import {
  type User, type InsertUser,
  type Property, type InsertProperty,
  type Favorite, type InsertFavorite,
  type Message, type InsertMessage,
  type Neighborhood, type InsertNeighborhood,
  type Notification, type InsertNotification,
  type Review, type InsertReview
} from "@shared/schema";

// Storage interface with all required CRUD operations
export interface IStorage {
  // Reviews
  getPropertyReviews(propertyId: number): Promise<Review[]>;
  getPropertyAverageRating(propertyId: number): Promise<number | null>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, rating: number, comment: string): Promise<Review | null>;
  deleteReview(id: number): Promise<boolean>;

  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Properties
  getProperties(filters?: PropertyFilters): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByOwner(ownerId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Favorites
  getFavorites(userId: number): Promise<Property[]>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  
  // Messages
  getConversations(userId: number): Promise<Conversation[]>;
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean>;
  
  // Neighborhoods
  getNeighborhoods(): Promise<Neighborhood[]>;
  getNeighborhood(id: number): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
}

// Custom types for the storage implementation
export interface PropertyFilters {
  search?: string;
  location?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  features?: string[];
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  // REVIEWS
  async getPropertyReviews(propertyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.propertyId === propertyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPropertyAverageRating(propertyId: number): Promise<number | null> {
    const reviews = await this.getPropertyReviews(propertyId);
    if (reviews.length === 0) return null;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal place
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const review: Review = {
      id: this.reviewIdCounter++,
      ...reviewData,
      createdAt: new Date(),
      updatedAt: null,
    };

    this.reviews.set(review.id, review);
    return review;
  }

  async updateReview(id: number, rating: number, comment: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updatedReview: Review = {
      ...review,
      rating,
      comment,
      updatedAt: new Date(),
    };

    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // NOTIFICATIONS
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read)
      .length;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: this.notificationIdCounter++,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      content: notificationData.content,
      read: false,
      linkUrl: notificationData.linkUrl || null,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    notification.read = true;
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    let updated = false;
    const notifications = Array.from(this.notifications.values());
    for (const notification of notifications) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        updated = true;
      }
    }
    return updated;
  }

  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private favorites: Map<number, Favorite>;
  private messages: Map<number, Message>;
  private neighborhoods: Map<number, Neighborhood>;
  private notifications: Map<number, Notification>;
  private reviews: Map<number, Review>;
  
  private userIdCounter: number;
  private propertyIdCounter: number;
  private favoriteIdCounter: number;
  private messageIdCounter: number;
  private neighborhoodIdCounter: number;
  private notificationIdCounter: number;
  private reviewIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.favorites = new Map();
    this.messages = new Map();
    this.neighborhoods = new Map();
    this.notifications = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.propertyIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.messageIdCounter = 1;
    this.neighborhoodIdCounter = 1;
    this.notificationIdCounter = 1;
    this.reviewIdCounter = 1;
    
    // Initialize with sample data
    this.initializeData();
  }



  
  // USERS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  // Password Reset Methods
  async updateUserResetToken(userId: number, resetToken: string, resetTokenExpiry: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
    }
  }

  async getUserByResetToken(resetToken: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.resetToken === resetToken);
  }

  async updateUserPassword(userId: number, newHashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = newHashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  // PROPERTIES
  async getProperties(filters?: PropertyFilters): Promise<Property[]> {
    let properties = Array.from(this.properties.values());
    
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        properties = properties.filter(p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.location.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        properties = properties.filter(p =>
          p.location.toLowerCase().includes(locationLower)
        );
      }
      
      if (filters.propertyType) {
        properties = properties.filter(p => p.propertyType === filters.propertyType);
      }
      
      if (filters.listingType) {
        properties = properties.filter(p => p.listingType === filters.listingType);
      }
      
      if (filters.minPrice) {
        properties = properties.filter(p => p.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice) {
        properties = properties.filter(p => p.price <= filters.maxPrice!);
      }
      
      if (filters.minBedrooms) {
        properties = properties.filter(p => p.bedrooms >= filters.minBedrooms!);
      }
      
      if (filters.maxBedrooms) {
        properties = properties.filter(p => p.bedrooms <= filters.maxBedrooms!);
      }
      
      if (filters.features && filters.features.length > 0) {
        properties = properties.filter(p => {
          if (!p.features) return false;
          return filters.features!.every(f => p.features!.includes(f));
        });
      }
    }
    
    return properties;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertiesByOwner(ownerId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(p => p.ownerId === ownerId);
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const id = this.propertyIdCounter++;
    const now = new Date();
    
    const property: Property = {
      ...propertyData,
      id,
      createdAt: now,
      verified: false,
      features: propertyData.features || [],
      images: propertyData.images || []
    };
    
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const property = await this.getProperty(id);
    if (!property) return undefined;
    
    const updatedProperty: Property = {
      ...property,
      ...propertyData,
      id, // Ensure ID doesn't get overwritten
      features: propertyData.features || property.features || [],
      images: propertyData.images || property.images || []
    };
    
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Handle optional fields
    let avatar: string | null = null;
    if (typeof userData.avatar === 'string') {
      avatar = userData.avatar;
    }
    
    let bio: string | null = null;
    if (typeof userData.bio === 'string') {
      bio = userData.bio;
    }
    
    const user: User = {
      id,
      username: userData.username,
      password: userData.password, 
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone ?? null,
      avatar,
      resetToken: null,
      resetTokenExpiry: null,
      role: userData.role ?? 'tenant',
      bio,
      createdAt: now,
      language: userData.language ?? "en",
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  

  
  // FAVORITES
  async getFavorites(userId: number): Promise<Property[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(
      (favorite) => favorite.userId === userId
    );
    
    return userFavorites.map(
      (favorite) => this.properties.get(favorite.propertyId)!
    ).filter(property => property !== undefined);
  }
  
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      (favorite) => favorite.userId === userId && favorite.propertyId === propertyId
    );
  }
  
  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteIdCounter++;
    const now = new Date();
    
    const favorite: Favorite = {
      id,
      userId: favoriteData.userId,
      propertyId: favoriteData.propertyId,
      createdAt: now,
    };
    
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      (fav) => fav.userId === userId && fav.propertyId === propertyId
    );
    
    if (!favorite) return false;
    return this.favorites.delete(favorite.id);
  }
  
  // MESSAGES
  async getConversations(userId: number): Promise<Conversation[]> {
    // Get all messages where user is sender or receiver
    const userMessages = Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
    
    // Get unique contacts
    const contactIds = new Set<number>();
    userMessages.forEach((message) => {
      if (message.senderId === userId) {
        contactIds.add(message.receiverId);
      } else {
        contactIds.add(message.senderId);
      }
    });
    
    // Create conversation objects
    const conversations: Conversation[] = [];
    Array.from(contactIds).forEach((contactId) => {
      const contactMessages = userMessages.filter(
        (message) =>
          (message.senderId === userId && message.receiverId === contactId) ||
          (message.senderId === contactId && message.receiverId === userId)
      );
      
      // Sort messages by createdAt (descending)
      contactMessages.sort((a, b) => {
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      });
      
      const lastMessage = contactMessages[0];
      const contact = this.users.get(contactId);
      
      if (contact && lastMessage) {
        const unreadCount = contactMessages.filter(
          (message) => message.senderId === contactId && !message.read
        ).length;
        
        conversations.push({
          user: contact,
          lastMessage,
          unreadCount,
        });
      }
    });

    // Sort conversations by last message time (descending)
    conversations.sort((a, b) => {
      return (b.lastMessage?.createdAt?.getTime() ?? 0) - (a.lastMessage?.createdAt?.getTime() ?? 0);
    });

    return conversations;
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values()).filter(
      (message) =>
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
    );
    
    // Sort messages by createdAt (ascending)
    messages.sort((a, b) => {
      return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
    });
    
    return messages;
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === userId && !message.read
    ).length;
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();

    const message: Message = {
      id,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      propertyId: messageData.propertyId ?? null,
      content: messageData.content,
      read: false,
      createdAt: now,
    };
    
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean> {
    const messages = Array.from(this.messages.values()).filter(
      (message) => message.senderId === senderId && message.receiverId === receiverId && !message.read
    );

    messages.forEach((message) => {
      message.read = true;
      this.messages.set(message.id, message);
    });

    return true;
  }
  
  // NEIGHBORHOODS
  async getNeighborhoods(): Promise<Neighborhood[]> {
    return Array.from(this.neighborhoods.values());
  }
  
  async getNeighborhood(id: number): Promise<Neighborhood | undefined> {
    return this.neighborhoods.get(id);
  }
  
  async createNeighborhood(neighborhoodData: InsertNeighborhood): Promise<Neighborhood> {
    const id = this.neighborhoodIdCounter++;
    
    const neighborhood: Neighborhood = {
      id,
      name: neighborhoodData.name,
      city: neighborhoodData.city,
      description: neighborhoodData.description ?? null,
      image: neighborhoodData.image ?? null,
      propertyCount: 0,
    };
    
    this.neighborhoods.set(id, neighborhood);
    return neighborhood;
  }
  
  // Initialize with sample data for development
  private initializeData() {
    // Initialize sample reviews
    const sampleReviews: InsertReview[] = [
      {
        propertyId: 1,
        userId: 2,
        rating: 5,
        comment: "Beautiful apartment with amazing views. The location is perfect and the amenities are top-notch.",
      },
      {
        propertyId: 1,
        userId: 3,
        rating: 4,
        comment: "Great property but slightly overpriced. The security and parking are excellent.",
      },
      {
        propertyId: 2,
        userId: 1,
        rating: 5,
        comment: "Spacious house with a beautiful garden. Perfect for families. The neighborhood is quiet and safe.",
      },
      {
        propertyId: 3,
        userId: 4,
        rating: 4,
        comment: "Modern apartment with great amenities. The gym and pool are well maintained.",
      },
      {
        propertyId: 4,
        userId: 2,
        rating: 5,
        comment: "Excellent location near shopping centers and restaurants. The house is well maintained.",
      },
    ];

    sampleReviews.forEach(review => {
      this.createReview(review);
    });

    // Create sample users
    const user1 = this.createUser({
      username: "shakii",
      password: "password123",
      email: "shakii@example.com",
      fullName: "Cale Shakii",
      phone: "+254712345678",
      avatar: "",
      role: "tenant",
      bio: "Looking for a nice place in Nairobi",
      language: "en",
      confirmPassword: "password123"
    });
    
    const user2 = this.createUser({
      username: "lebleba",
      password: "password123",
      email: "leb@example.com",
      fullName: "Leb Leba",
      phone: "+254723456789",
      avatar: "shared/images/mombasa-at-night2.jpg",
      role: "landlord",
      bio: "Property owner in Nairobi",
      language: "en",
      confirmPassword: "password123"
    });
    
    const user3 = this.createUser({
      username: "sarahk",
      password: "password123",
      email: "sarah@example.com",
      fullName: "Sarah Kamau",
      phone: "+254734567890",
      avatar: "client/assets/img1.png",
      role: "agent",
      bio: "Real estate agent with 5 years experience",
      language: "en",
      confirmPassword: "password123"
    });
    
    // Create sample neighborhoods
    const neighborhood1 = this.createNeighborhood({
      name: "Westlands",
      city: "Nairobi",
      description: "Upscale commercial and residential area in Nairobi",
      image: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&auto=format"
    });
    
    const neighborhood2 = this.createNeighborhood({
      name: "Kilimani",
      city: "Nairobi",
      description: "Popular residential area with many apartments",
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format" 
    });
    
    const neighborhood3 = this.createNeighborhood({
      name: "Karen",
      city: "Nairobi",
      description: "Affluent suburb with large houses and plots",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format"
    });
    
    const neighborhood4 = this.createNeighborhood({
      name: "Lavington",
      city: "Nairobi",
      description: "Quiet residential area with good security",
      image: "https://images.unsplash.com/photo-1572003818138-19cf96ee15e7?w=800&auto=format"
    });
    
    // Create sample properties
    const property1 = this.createProperty({
      title: "Modern 2 Bedroom Apartment",
      description: "Beautiful apartment with modern finishes, located in a secure compound with parking and swimming pool.",
      price: 45000,
      propertyType: "apartment",
      listingType: "rent",
      bedrooms: 2,
      bathrooms: 2,
      area: 85,
      location: "Kilimani, Nairobi",
      address: "Rose Avenue, Kilimani",
      latitude: -1.2921,
      longitude: 36.7892,
      features: ["swimming pool", "security", "parking", "gym", "furnished"],
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
      ],
      ownerId: 2
    });
    
    const property2 = this.createProperty({
      title: "Spacious 4 Bedroom Family Home",
      description: "Large family home with garden, located in the quiet Karen neighborhood. Excellent for families with children.",
      price: 18500000,
      propertyType: "house",
      listingType: "sale",
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      location: "Karen, Nairobi",
      address: "Karen Road, Karen",
      latitude: -1.3224,
      longitude: 36.7064,
      features: ["garden", "security", "parking", "servant quarter", "borehole"],
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
        "https://images.unsplash.com/photo-1600210492493-0946911123ea",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea"
      ],
      ownerId: 2
    });
    
    const property3 = this.createProperty({
      title: "Modern Studio Apartment",
      description: "Cozy studio apartment perfect for singles or couples. Located close to shopping centers and public transportation.",
      price: 30000,
      propertyType: "apartment",
      listingType: "rent",
      bedrooms: 1,
      bathrooms: 1,
      area: 45,
      location: "Westlands, Nairobi",
      address: "Waiyaki Way, Westlands",
      latitude: -1.2662,
      longitude: 36.8063,
      features: ["security", "parking", "furnished", "internet"],
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461"
      ],
      ownerId: 3
    });
    
    const property4 = this.createProperty({
      title: "Luxury 3 Bedroom Apartment",
      description: "Luxurious apartment with high-end finishes, ample parking and 24-hour security. Located in a serene environment.",
      price: 60000,
      propertyType: "apartment",
      listingType: "rent",
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      location: "Lavington, Nairobi",
      address: "James Gichuru Road, Lavington",
      latitude: -1.2833,
      longitude: 36.7667,
      features: ["swimming pool", "security", "parking", "gym", "furnished", "balcony"],
      images: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227",
        "https://images.unsplash.com/photo-1564013434775-f71db0030976",
        "https://images.unsplash.com/photo-1622015663319-e97cf3a4e2d4"
      ],
      ownerId: 3
    });
    
    const property5 = this.createProperty({
      title: "Modern 4 Bedroom Townhouse",
      description: "Elegant townhouse in a gated community with excellent security, garden and play area for children.",
      price: 22000000,
      propertyType: "townhouse",
      listingType: "sale",
      bedrooms: 4,
      bathrooms: 3,
      area: 220,
      location: "Runda, Nairobi",
      address: "Runda Drive, Runda",
      latitude: -1.2194,
      longitude: 36.8062,
      features: ["garden", "security", "parking", "servant quarter", "gym"],
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format"
      ],
      ownerId: 2
    });
    
    // Create sample notifications
    this.createNotification({
      userId: 1,
      type: "message",
      title: "New Message",
      content: "You have a new message from John regarding the studio apartment.",
      linkUrl: "/messages/3"
    });

    this.createNotification({
      userId: 1,
      type: "property_update",
      title: "Price Update",
      content: "A property in your favorites list has updated its price.",
      linkUrl: "/properties/3"
    });

    this.createNotification({
      userId: 2,
      type: "favorite",
      title: "New Interest",
      content: "Someone added your property to their favorites.",
      linkUrl: "/properties/1"
    });

    this.createNotification({
      userId: 3,
      type: "system",
      title: "Welcome!",
      content: "Welcome to HomeSeekerKe! Complete your profile to get started.",
      linkUrl: "/profile"
    });

    // Create sample notifications
    this.createNotification({
      userId: 1,
      type: "message",
      title: "New Message",
      content: "You have a new message from John regarding the studio apartment.",
      linkUrl: "/messages/3"
    });

    this.createNotification({
      userId: 1,
      type: "property_update",
      title: "Price Update",
      content: "A property in your favorites list has updated its price.",
      linkUrl: "/properties/3"
    });

    this.createNotification({
      userId: 2,
      type: "favorite",
      title: "New Interest",
      content: "Someone added your property to their favorites.",
      linkUrl: "/properties/1"
    });

    this.createNotification({
      userId: 3,
      type: "system",
      title: "Welcome!",
      content: "Welcome to HomeSeekerKe! Complete your profile to get started.",
      linkUrl: "/profile"
    });

    const property6 = this.createProperty({
      title: "Spacious 2 Bedroom Apartment",
      description: "Well-maintained apartment with spacious rooms, located in a family-friendly neighborhood with good amenities.",
      price: 35000,
      propertyType: "apartment",
      listingType: "rent",
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      location: "Parklands, Nairobi",
      address: "Forest Road, Parklands",
      latitude: -1.2633,
      longitude: 36.8172,
      features: ["security", "parking", "water storage"],
      images: [
        "https://images.unsplash.com/photo-1594484208280-efa00f96fc21",
        "https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32",
        "https://images.unsplash.com/photo-1558997519-83ea9252edf8"
      ],
      ownerId: 3
    });
    
    // Add some favorites
    this.addFavorite({
      userId: 1,
      propertyId: 3
    });
    
    this.addFavorite({
      userId: 1,
      propertyId: 6
    });
    
    // Add some messages
    this.createMessage({
      senderId: 1,
      receiverId: 3,
      propertyId: 3,
      content: "Hello, I'm interested in the studio apartment. Is it still available?"
    });
    
    this.createMessage({
      senderId: 3,
      receiverId: 1,
      propertyId: 3,
      content: "Yes, it's available. Would you like to schedule a viewing?"
    });
    
    this.createMessage({
      senderId: 1,
      receiverId: 3,
      propertyId: 3,
      content: "Yes, I would. Are you available this weekend?"
    });
    
    this.createMessage({
      senderId: 3,
      receiverId: 1,
      propertyId: 3,
      content: "I can do Saturday afternoon. How about 2pm?"
    });
    
    this.createMessage({
      senderId: 1,
      receiverId: 2,
      propertyId: 1,
      content: "Hi, I saw your apartment listing and I'm interested. Can I get more details?"
    });
    
    this.createMessage({
      senderId: 2,
      receiverId: 1,
      propertyId: 1,
      content: "Hello! Yes, what would you like to know about the apartment?"
    });
  }
}

export const storage = new MemStorage();
