import { 
  users, vendors, products, orders, orderItems, reviews, chats, coupons, couponUsage, disputes,
  type User, type InsertUser, type Vendor, type InsertVendor, type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Review, type InsertReview,
  type Chat, type InsertChat, type Coupon, type InsertCoupon, type Dispute, type InsertDispute
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, avg, sum } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Vendor methods
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;

  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByVendor(vendorId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersByVendor(vendorId: string): Promise<Order[]>;
  getOrdersByDeliveryPerson(deliveryPersonId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;

  // Order Item methods
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Review methods
  getReviewsByOrder(orderId: string): Promise<Review[]>;
  getReviewsByVendor(vendorId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Chat methods
  getChatsByOrder(orderId: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  markChatAsRead(id: string): Promise<boolean>;

  // Coupon methods
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAllActiveCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, updates: Partial<InsertCoupon>): Promise<Coupon | undefined>;

  // Dispute methods
  getDispute(id: string): Promise<Dispute | undefined>;
  getAllDisputes(): Promise<Dispute[]>;
  getOpenDisputes(): Promise<Dispute[]>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: string, updates: Partial<InsertDispute>): Promise<Dispute | undefined>;

  // Analytics methods
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalOrders: number;
    totalRevenue: string;
    openDisputes: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate referral code
    const referralCode = `${insertUser.username.toUpperCase().slice(0, 4)}${Date.now().toString().slice(-4)}`;
    
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, referralCode })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Vendor methods
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor || undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values(vendor)
      .returning();
    return newVendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();
    return vendor || undefined;
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByVendor(vendorId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByVendor(vendorId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByDeliveryPerson(deliveryPersonId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.deliveryPersonId, deliveryPersonId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `ECK-${Date.now()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  // Order Item methods
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  // Review methods
  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.orderId, orderId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByVendor(vendorId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.vendorId, vendorId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  // Chat methods
  async getChatsByOrder(orderId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.orderId, orderId))
      .orderBy(chats.createdAt);
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db
      .insert(chats)
      .values(chat)
      .returning();
    return newChat;
  }

  async markChatAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(chats)
      .set({ isRead: true })
      .where(eq(chats.id, id));
    return result.rowCount > 0;
  }

  // Coupon methods
  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon || undefined;
  }

  async getAllActiveCoupons(): Promise<Coupon[]> {
    return await db
      .select()
      .from(coupons)
      .where(eq(coupons.isActive, true))
      .orderBy(desc(coupons.createdAt));
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db
      .insert(coupons)
      .values(coupon)
      .returning();
    return newCoupon;
  }

  async updateCoupon(id: string, updates: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [coupon] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();
    return coupon || undefined;
  }

  // Dispute methods
  async getDispute(id: string): Promise<Dispute | undefined> {
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id));
    return dispute || undefined;
  }

  async getAllDisputes(): Promise<Dispute[]> {
    return await db.select().from(disputes).orderBy(desc(disputes.createdAt));
  }

  async getOpenDisputes(): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.status, "open"))
      .orderBy(desc(disputes.createdAt));
  }

  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [newDispute] = await db
      .insert(disputes)
      .values(dispute)
      .returning();
    return newDispute;
  }

  async updateDispute(id: string, updates: Partial<InsertDispute>): Promise<Dispute | undefined> {
    const [dispute] = await db
      .update(disputes)
      .set(updates)
      .where(eq(disputes.id, id))
      .returning();
    return dispute || undefined;
  }

  // Analytics methods
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalOrders: number;
    totalRevenue: string;
    openDisputes: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [vendorCount] = await db.select({ count: count() }).from(vendors);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    const [revenueSum] = await db.select({ sum: sum(orders.totalAmount) }).from(orders);
    const [disputeCount] = await db.select({ count: count() }).from(disputes).where(eq(disputes.status, "open"));

    return {
      totalUsers: userCount.count,
      totalVendors: vendorCount.count,
      totalOrders: orderCount.count,
      totalRevenue: revenueSum.sum || "0",
      openDisputes: disputeCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
