import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import session from "express-session";
import { z } from "zod";
import bcrypt from "bcrypt";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
//import xss from "xss-clean";
import {
  insertUserSchema,
  insertPropertySchema,
  insertFavoriteSchema,
  insertMessageSchema,
  type InsertUser
} from "@shared/schema";
import { createId } from "@paralleldrive/cuid2";

// Security constants
const SALT_ROUNDS = 10;
const MAX_REQUESTS_PER_WINDOW = 10000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up security middleware
  
  // Set security HTTP headers with customized CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://*"],
          connectSrc: ["'self'", "wss://*"]
        }
      }
    })
  );
  
  // XSS protection
 // app.use(xss());
  
  // Rate limiting to prevent brute force attacks
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: MAX_REQUESTS_PER_WINDOW,
      message: { message: "Too many requests from this IP, please try again later" },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  
  // Session middleware with secure settings
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nyumba-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        httpOnly: true, // Prevents client-side JS from reading the cookie
        sameSite: "strict", // CSRF protection
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
      }
    })
  );

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // API routes
  // =========================================

  // AUTH ENDPOINTS
  // -----------------------------------------

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Return success even if user not found for security
        return res.json({ message: "If an account exists with that email, you will receive password reset instructions." });
      }
      
      // Generate reset token
      const resetToken = createId();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Save reset token to user
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
      
      // TODO: Send email with reset link
      // For now, just return the token in development
      if (process.env.NODE_ENV === "development") {
        return res.json({
          message: "Reset token generated (development only)",
          resetLink: `http://localhost:3000/reset-password?token=${resetToken}`,
        });
      }
      
      res.json({ message: "If an account exists with that email, you will receive password reset instructions." });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Find user with valid reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Update password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userFormData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userFormData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userFormData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash the password with bcrypt
      const hashedPassword = await bcrypt.hash(userFormData.password, SALT_ROUNDS);
      
      // Remove confirmPassword field and use hashed password before saving to database
      const { confirmPassword, password, ...restUserData } = userFormData;
      const userData: InsertUser = {
        ...restUserData,
        password: hashedPassword,
        confirmPassword: hashedPassword // Include confirmPassword to satisfy type, it's not used for validation here
      };
      
      const user = await storage.createUser(userData);
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string()
      }).parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Successfully logged out" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/users/profile", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const updateSchema = z.object({
        fullName: z.string().optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        bio: z.string().optional(),
        language: z.string().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
        confirmNewPassword: z.string().optional(),
      })
      .refine(
        (data) => {
          // If changing password, require all password fields
          return (
            (data.currentPassword && data.newPassword && data.confirmNewPassword) ||
            (!data.currentPassword && !data.newPassword && !data.confirmNewPassword)
          );
        },
        {
          message: "All password fields are required when changing password",
        }
      )
      .refine(
        (data) => {
          // Passwords must match if provided
          return !data.newPassword || data.newPassword === data.confirmNewPassword;
        },
        {
          message: "New passwords do not match",
          path: ["confirmNewPassword"],
        }
      );
      
      const formData = updateSchema.parse(req.body);
      
      // If user is trying to change password
      if (formData.currentPassword && formData.newPassword) {
        // Verify current password
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const isPasswordValid = await bcrypt.compare(formData.currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(formData.newPassword, SALT_ROUNDS);
        
        // Remove password-related fields and add the hashed password
        const { currentPassword, newPassword, confirmNewPassword, ...restData } = formData;
        const userData = {
          ...restData,
          password: hashedPassword
        };
        
        const updatedUser = await storage.updateUser(userId, userData);
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const { password, ...userWithoutPassword } = updatedUser;
        return res.json(userWithoutPassword);
      } else {
        // Regular profile update (no password change)
        const { currentPassword, newPassword, confirmNewPassword, ...userData } = formData;
        const updatedUser = await storage.updateUser(userId, userData);
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PROPERTY ENDPOINTS
  // -----------------------------------------

  // Get all properties with filters
  app.get("/api/properties", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        location: req.query.location as string | undefined,
        propertyType: req.query.propertyType as string | undefined,
        listingType: req.query.listingType as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minBedrooms: req.query.minBedrooms ? Number(req.query.minBedrooms) : undefined,
        maxBedrooms: req.query.maxBedrooms ? Number(req.query.maxBedrooms) : undefined,
        features: req.query.features ? (req.query.features as string).split(",") : undefined
      };
      
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get owner info (without password)
      const owner = await storage.getUser(property.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Property owner not found" });
      }
      
      const { password, ...ownerWithoutPassword } = owner;
      
      // Check if property is in user's favorites
      let isFavorite = false;
      if (req.session.userId) {
        isFavorite = await storage.isFavorite(req.session.userId, propertyId);
      }
      
      res.json({
        ...property,
        owner: ownerWithoutPassword,
        isFavorite
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create property
  app.post("/api/properties", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyData = insertPropertySchema.parse(req.body);
      
      // Ensure owner ID matches current user
      if (propertyData.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update property
  app.patch("/api/properties/:id", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Check if property exists and belongs to user
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Update schema (subset of property fields that can be updated)
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        features: z.array(z.string()).optional(),
        images: z.array(z.string()).optional()
      });
      
      const propertyData = updateSchema.parse(req.body);
      const updatedProperty = await storage.updateProperty(propertyId, propertyData);
      
      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Check if property exists and belongs to user
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const success = await storage.deleteProperty(propertyId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete property" });
      }
      
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // FAVORITES ENDPOINTS
  // -----------------------------------------

  // Get user favorites
  app.get("/api/favorites", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add favorite
  app.post("/api/favorites", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const { propertyId } = insertFavoriteSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if already a favorite
      const isAlreadyFavorite = await storage.isFavorite(userId, propertyId);
      if (isAlreadyFavorite) {
        return res.status(400).json({ message: "Property already in favorites" });
      }
      
      const favorite = await storage.addFavorite({ userId, propertyId });
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove favorite
  app.delete("/api/favorites/:propertyId", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const success = await storage.removeFavorite(userId, propertyId);
      if (!success) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // MESSAGES ENDPOINTS
  // -----------------------------------------

  // Get conversations
  app.get("/api/conversations", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages with a specific user
  app.get("/api/messages/:userId", authenticate, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const otherUserId = parseInt(req.params.userId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const messages = await storage.getMessages(currentUserId, otherUserId);
      
      // Mark messages from other user as read
      await storage.markMessagesAsRead(otherUserId, currentUserId);
      
      const { password, ...otherUserWithoutPassword } = otherUser;
      
      res.json({
        messages,
        user: otherUserWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send message
  app.post("/api/messages", authenticate, async (req, res) => {
    try {
      const senderId = req.session.userId!;
      
      const messageSchema = insertMessageSchema.parse({
        ...req.body,
        senderId
      });
      
      // Check if receiver exists
      const receiver = await storage.getUser(messageSchema.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      // If property ID is provided, check if it exists
      if (messageSchema.propertyId) {
        const property = await storage.getProperty(messageSchema.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }
      }
      
      const message = await storage.createMessage(messageSchema);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread/count", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PROPERTIES ENDPOINTS
  // -----------------------------------------

  // Get all properties with filtering
  app.get("/api/properties", async (req, res) => {
    try {
      const {
        location,
        minPrice,
        maxPrice,
        propertyType,
        listingType,
        minBedrooms,
        minBathrooms,
        sortBy
      } = req.query;

      // Get all properties first
      let properties = await storage.getProperties();

      // Apply filters
      if (location) {
        properties = properties.filter(p => 
          p.location.toLowerCase().includes(String(location).toLowerCase())
        );
      }

      if (minPrice) {
        properties = properties.filter(p => p.price >= Number(minPrice));
      }

      if (maxPrice) {
        properties = properties.filter(p => p.price <= Number(maxPrice));
      }

      if (propertyType) {
        properties = properties.filter(p => p.propertyType === propertyType);
      }

      if (listingType) {
        properties = properties.filter(p => p.listingType === listingType);
      }

      if (minBedrooms) {
        properties = properties.filter(p => p.bedrooms >= Number(minBedrooms));
      }

      if (minBathrooms) {
        properties = properties.filter(p => p.bathrooms >= Number(minBathrooms));
      }

      // Apply sorting
      if (sortBy) {
        switch (String(sortBy)) {
          case 'price-low':
            properties.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            properties.sort((a, b) => b.price - a.price);
            break;
          case 'newest':
            properties.sort((a, b) => 
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
            );
            break;
          default:
            // Default sorting (recommended)
            break;
        }
      }

      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new property
  app.post("/api/properties", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: userId
      });
      
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update property
  app.put("/api/properties/:id", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Check if property exists and belongs to user
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (existingProperty.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this property" });
      }
      
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: userId
      });
      
      const property = await storage.updateProperty(propertyId, propertyData);
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Check if property exists and belongs to user
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (existingProperty.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }
      
      await storage.deleteProperty(propertyId);
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // NEIGHBORHOODS ENDPOINTS
  // -----------------------------------------

  // Get all neighborhoods
  app.get("/api/neighborhoods", async (req, res) => {
    try {
      const neighborhoods = await storage.getNeighborhoods();
      res.json(neighborhoods);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get neighborhood by ID
  app.get("/api/neighborhoods/:id", async (req, res) => {
    try {
      const neighborhoodId = parseInt(req.params.id);
      
      if (isNaN(neighborhoodId)) {
        return res.status(400).json({ message: "Invalid neighborhood ID" });
      }
      
      const neighborhood = await storage.getNeighborhood(neighborhoodId);
      if (!neighborhood) {
        return res.status(404).json({ message: "Neighborhood not found" });
      }
      
      res.json(neighborhood);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // REVIEW ENDPOINTS
  // -----------------------------------------

  // Get property reviews
  app.get("/api/properties/:id/reviews", async (req, res) => {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    const reviews = await storage.getPropertyReviews(propertyId);
    res.json(reviews);
  });

  // Get property rating
  app.get("/api/properties/:id/rating", async (req, res) => {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    const rating = await storage.getPropertyAverageRating(propertyId);
    res.json({ rating });
  });

  // Create new review
  app.post("/api/properties/:id/reviews", requireAuth, async (req: express.Request & { user?: { id: number } }, res) => {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    const review = await storage.createReview({
      propertyId,
      userId: req.user!.id,
      rating,
      comment,
    });

    res.json(review);
  });

  // Update review
  app.put("/api/reviews/:id", requireAuth, async (req: express.Request & { user?: { id: number } }, res) => {
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    const updatedReview = await storage.updateReview(reviewId, rating, comment);
    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(updatedReview);
  });

  // Delete review
  app.delete("/api/reviews/:id", requireAuth, async (req: express.Request & { user?: { id: number } }, res) => {
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const success = await storage.deleteReview(reviewId);
    if (!success) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true });
  });

  // NOTIFICATIONS ENDPOINTS
  // -----------------------------------------

  // Get user notifications
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread/count", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
