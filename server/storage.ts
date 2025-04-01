// Import schema and types
import { users, properties, favorites, messages, neighborhoods,
         type User, type InsertUser,
         type Property, type InsertProperty, 
         type Favorite, type InsertFavorite,
         type Message, type InsertMessage,
         type Neighborhood, type InsertNeighborhood } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, like, gte, lte, inArray, sql, not } from "drizzle-orm";

// Storage interface with all required CRUD operations
export interface IStorage {
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

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Nothing to initialize in the database version
  }
  
  // USERS
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const lowerUsername = username.toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(eq(sql`LOWER(${users.username})`, lowerUsername));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const lowerEmail = email.toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(eq(sql`LOWER(${users.email})`, lowerEmail));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        avatar: userData.avatar,
        role: userData.role || "tenant",
        bio: userData.bio,
        language: userData.language || "en",
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // PROPERTIES
  async getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
    let query = db.select().from(properties);
    
    // Handle text search with SQL LIKE
    if (filters.search) {
      const search = `%${filters.search.toLowerCase()}%`;
      query = query.where(
        or(
          like(sql`LOWER(${properties.title})`, search),
          like(sql`LOWER(${properties.description})`, search),
          like(sql`LOWER(${properties.location})`, search)
        )
      );
    }
    
    // Filter by location
    if (filters.location) {
      query = query.where(
        like(sql`LOWER(${properties.location})`, `%${filters.location.toLowerCase()}%`)
      );
    }
    
    // Filter by property type
    if (filters.propertyType) {
      query = query.where(eq(properties.propertyType, filters.propertyType));
    }
    
    // Filter by listing type
    if (filters.listingType) {
      query = query.where(eq(properties.listingType, filters.listingType));
    }
    
    // Filter by min price
    if (filters.minPrice !== undefined) {
      query = query.where(gte(properties.price, filters.minPrice));
    }
    
    // Filter by max price
    if (filters.maxPrice !== undefined) {
      query = query.where(lte(properties.price, filters.maxPrice));
    }
    
    // Filter by min bedrooms
    if (filters.minBedrooms !== undefined) {
      query = query.where(gte(properties.bedrooms, filters.minBedrooms));
    }
    
    // Filter by max bedrooms
    if (filters.maxBedrooms !== undefined) {
      query = query.where(lte(properties.bedrooms, filters.maxBedrooms));
    }
    
    // Execute the query
    const result = await query;
    
    // Filter by features (in-memory)
    if (filters.features && filters.features.length > 0) {
      return result.filter((property) => 
        filters.features!.every(feature => 
          property.features?.includes(feature)
        )
      );
    }
    
    return result;
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getPropertiesByOwner(ownerId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.ownerId, ownerId));
  }
  
  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values({
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        propertyType: propertyData.propertyType,
        listingType: propertyData.listingType,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        area: propertyData.area,
        location: propertyData.location,
        address: propertyData.address,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
        features: propertyData.features || [],
        images: propertyData.images || [],
        ownerId: propertyData.ownerId,
        verified: false,
      })
      .returning();
    return property;
  }
  
  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set(propertyData)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    await db.delete(properties).where(eq(properties.id, id));
    return true;
  }
  
  // FAVORITES
  async getFavorites(userId: number): Promise<Property[]> {
    // Join favorites with properties to get all favorited properties
    const favProperties = await db
      .select({
        property: properties
      })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, userId));
    
    // Extract the property objects
    return favProperties.map(fp => fp.property);
  }
  
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        )
      );
    return result.length > 0;
  }
  
  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId: favoriteData.userId,
        propertyId: favoriteData.propertyId
      })
      .returning();
    return favorite;
  }
  
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        )
      );
    return true;
  }
  
  // MESSAGES
  async getConversations(userId: number): Promise<Conversation[]> {
    // Get unique sender IDs where this user is the receiver
    const senderIds = await db
      .selectDistinct({ id: messages.senderId })
      .from(messages)
      .where(eq(messages.receiverId, userId));
    
    // Get unique receiver IDs where this user is the sender
    const receiverIds = await db
      .selectDistinct({ id: messages.receiverId })
      .from(messages)
      .where(eq(messages.senderId, userId));
    
    // Combine and deduplicate IDs
    const contactIds = [...new Set([
      ...senderIds.map(s => s.id),
      ...receiverIds.map(r => r.id)
    ])].filter(id => id !== userId);
    
    // Now create conversation objects for each contact
    const conversations: Conversation[] = [];
    
    for (const contactId of contactIds) {
      // Get the user info for this contact
      const [contactUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, contactId));
      
      if (!contactUser) continue;
      
      // Get the last message
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, contactId)
            ),
            and(
              eq(messages.senderId, contactId),
              eq(messages.receiverId, userId)
            )
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      // Get unread count
      const unreadMsgs = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(messages)
        .where(
          and(
            eq(messages.senderId, contactId),
            eq(messages.receiverId, userId),
            eq(messages.read, false)
          )
        );
      
      const unreadCount = unreadMsgs[0]?.count || 0;
      
      conversations.push({
        user: contactUser,
        lastMessage: lastMsg,
        unreadCount,
      });
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    return conversations;
  }
  
  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    const messagesResult = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(messages.createdAt);
    
    return messagesResult;
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    const countResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    return countResult[0]?.count || 0;
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        propertyId: messageData.propertyId,
        content: messageData.content,
        read: false,
      })
      .returning();
    
    return message;
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean> {
    await db
      .update(messages)
      .set({
        read: true
      })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.read, false)
        )
      );
    
    return true;
  }
  
  // NEIGHBORHOODS
  async getNeighborhoods(): Promise<Neighborhood[]> {
    return await db.select().from(neighborhoods);
  }
  
  async getNeighborhood(id: number): Promise<Neighborhood | undefined> {
    const result = await db.select().from(neighborhoods).where(eq(neighborhoods.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createNeighborhood(neighborhoodData: InsertNeighborhood): Promise<Neighborhood> {
    const [neighborhood] = await db
      .insert(neighborhoods)
      .values({
        name: neighborhoodData.name,
        city: neighborhoodData.city,
        description: neighborhoodData.description,
        image: neighborhoodData.image,
        propertyCount: 0,
      })
      .returning();
    return neighborhood;
  }
}

export const storage = new DatabaseStorage();