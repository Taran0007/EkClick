import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertVendorSchema, insertProductSchema, insertOrderSchema, insertReviewSchema, insertChatSchema, insertCouponSchema, insertDisputeSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Vendor routes
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ message: "Invalid vendor data" });
    }
  });

  app.get("/api/vendors/:id/products", async (req, res) => {
    try {
      const products = await storage.getProductsByVendor(req.params.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Product routes
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // Verify vendor ownership
      if (req.user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (vendor?.id !== validatedData.vendorId) {
          return res.status(403).json({ message: "Can only create products for your own vendor" });
        }
      }

      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Verify vendor ownership
      if (req.user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (vendor?.id !== product.vendorId) {
          return res.status(403).json({ message: "Can only update your own products" });
        }
      }

      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Verify vendor ownership
      if (req.user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (vendor?.id !== product.vendorId) {
          return res.status(403).json({ message: "Can only delete your own products" });
        }
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      let orders;
      
      switch (req.user?.role) {
        case "admin":
          orders = await storage.getAllOrders();
          break;
        case "vendor":
          const vendor = await storage.getVendorByUserId(req.user.id);
          orders = vendor ? await storage.getOrdersByVendor(vendor.id) : [];
          break;
        case "delivery":
          orders = await storage.getOrdersByDeliveryPerson(req.user.id);
          break;
        default:
          orders = await storage.getOrdersByUser(req.user.id);
      }

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const order = await storage.createOrder(validatedData);
      
      // Create order items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createOrderItem({
            ...item,
            orderId: order.id
          });
        }
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check permissions
      const canUpdate = req.user?.role === "admin" || 
                       order.userId === req.user.id ||
                       order.deliveryPersonId === req.user.id ||
                       (req.user?.role === "vendor" && 
                        await storage.getVendorByUserId(req.user.id).then(v => v?.id === order.vendorId));

      if (!canUpdate) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const updatedOrder = await storage.updateOrder(req.params.id, req.body);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // Chat routes
  app.get("/api/orders/:orderId/chats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const chats = await storage.getChatsByOrder(req.params.orderId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertChatSchema.parse({
        ...req.body,
        senderId: req.user.id
      });

      const chat = await storage.createChat(validatedData);
      
      // Emit to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'chat_message',
            data: chat
          }));
        }
      });

      res.status(201).json(chat);
    } catch (error) {
      res.status(400).json({ message: "Invalid chat data" });
    }
  });

  // Coupon routes
  app.get("/api/coupons", async (req, res) => {
    try {
      const coupons = await storage.getAllActiveCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/coupons", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const validatedData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(validatedData);
      res.status(201).json(coupon);
    } catch (error) {
      res.status(400).json({ message: "Invalid coupon data" });
    }
  });

  // Dispute routes
  app.get("/api/disputes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      let disputes;
      
      if (req.user?.role === "admin") {
        disputes = await storage.getAllDisputes();
      } else {
        // Users can only see their own disputes
        disputes = [];
      }

      res.json(disputes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.post("/api/disputes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertDisputeSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const dispute = await storage.createDispute(validatedData);
      res.status(201).json(dispute);
    } catch (error) {
      res.status(400).json({ message: "Invalid dispute data" });
    }
  });

  app.put("/api/disputes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const updatedDispute = await storage.updateDispute(req.params.id, req.body);
      res.json(updatedDispute);
    } catch (error) {
      res.status(400).json({ message: "Failed to update dispute" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_order') {
          // Join order room for real-time updates
          ws.orderId = data.orderId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
