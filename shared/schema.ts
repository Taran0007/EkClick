import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "vendor", "delivery", "user"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "preparing", "ready", "picked_up", "in_transit", "delivered", "cancelled"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "investigating", "resolved", "closed"]);
export const disputePriorityEnum = pgEnum("dispute_priority", ["low", "medium", "high"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  address: text("address"),
  city: text("city"),
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Vendors Table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  shopName: text("shop_name").notNull(),
  shopDescription: text("shop_description"),
  category: text("category").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  feeStatus: paymentStatusEnum("fee_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products Table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders Table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  deliveryPersonId: varchar("delivery_person_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  deliveryAddress: text("delivery_address").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  orderType: text("order_type").notNull().default("catalog"), // catalog or point-to-point
  specialInstructions: text("special_instructions"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Reviews Table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  deliveryPersonId: varchar("delivery_person_id").references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reviewType: text("review_type").notNull(), // vendor or delivery
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chats Table
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Coupons Table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // fixed or percentage
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").notNull().default(true),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Coupon Usage Table
export const couponUsage = pgTable("coupon_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Disputes Table
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: disputeStatusEnum("status").notNull().default("open"),
  priority: disputePriorityEnum("priority").notNull().default("medium"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  vendor: one(vendors, { fields: [users.id], references: [vendors.userId] }),
  orders: many(orders),
  deliveryOrders: many(orders, { relationName: "deliveryPerson" }),
  reviews: many(reviews),
  chats: many(chats),
  disputes: many(disputes),
  couponUsage: many(couponUsage),
  referrer: one(users, { fields: [users.referredBy], references: [users.id] }),
  referrals: many(users, { relationName: "referrals" }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, { fields: [vendors.userId], references: [users.id] }),
  products: many(products),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [orders.vendorId], references: [vendors.id] }),
  deliveryPerson: one(users, { fields: [orders.deliveryPersonId], references: [users.id] }),
  orderItems: many(orderItems),
  reviews: many(reviews),
  chats: many(chats),
  disputes: many(disputes),
  couponUsage: many(couponUsage),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [reviews.vendorId], references: [vendors.id] }),
  deliveryPerson: one(users, { fields: [reviews.deliveryPersonId], references: [users.id] }),
}));

export const chatsRelations = relations(chats, ({ one }) => ({
  order: one(orders, { fields: [chats.orderId], references: [orders.id] }),
  sender: one(users, { fields: [chats.senderId], references: [users.id] }),
  receiver: one(users, { fields: [chats.receiverId], references: [users.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponUsage: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
  user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
  order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, { fields: [disputes.orderId], references: [orders.id] }),
  user: one(users, { fields: [disputes.userId], references: [users.id] }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
