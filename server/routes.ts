import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { z } from "zod";
import {
  insertUserSchema,
  insertPropertySchema,
  insertFavoriteSchema,
  insertMessageSchema
} from "@shared/schema";
import { createId } from "@paralleldrive/cuid2";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nyumba-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
      }
    })
  );

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // API routes
  // =========================================

  // AUTH ENDPOINTS
  // -----------------------------------------

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
      
      // Remove confirmPassword field before saving to database
      const { confirmPassword, ...userData } = userFormData;
      const user = await storage.createUser(userData);
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
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
      if (!user || user.password !== password) {
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
        language: z.string().optional()
      });
      
      const userData = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
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

  const httpServer = createServer(app);
  return httpServer;
}
