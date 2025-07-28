import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle both bcrypt and scrypt formats for compatibility
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    // This is a bcrypt hash, but we need to handle it differently
    // For now, we'll recreate the user with scrypt if they login successfully with a temp check
    console.log('Warning: Found bcrypt hash, user needs password migration');
    return false; // Force password reset or recreation
  }
  
  // Handle scrypt format: hash.salt
  const parts = stored.split(".");
  if (parts.length !== 2) {
    console.log('Invalid password format:', stored);
    return false;
  }
  
  const [hashed, salt] = parts;
  if (!salt) {
    console.log('Missing salt in password hash');
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Create demo users endpoint (for development only)
  app.post("/api/create-demo-users", async (req, res) => {
    try {
      const demoUsers = [
        {
          username: 'admin',
          email: 'admin@eclick.com',
          password: 'admin123',
          role: 'admin',
          full_name: 'System Administrator',
          phone: '+1234567890',
          address: '123 Admin Street, City'
        },
        {
          username: 'vendor1',
          email: 'vendor1@eclick.com',
          password: 'vendor123',
          role: 'vendor',
          full_name: 'Pizza Palace Owner',
          phone: '+1234567891',
          address: '456 Vendor Avenue, City'
        },
        {
          username: 'delivery1',
          email: 'delivery1@eclick.com',
          password: 'delivery123',
          role: 'delivery',
          full_name: 'John Delivery Driver',
          phone: '+1234567892',
          address: '789 Delivery Lane, City'
        },
        {
          username: 'customer1',
          email: 'customer1@eclick.com',
          password: 'customer123',
          role: 'user',
          full_name: 'Jane Customer',
          phone: '+1234567893',
          address: '321 Customer Road, City'
        }
      ];

      const createdUsers = [];
      for (const userData of demoUsers) {
        try {
          // Check if user already exists
          const existingUser = await storage.getUserByUsername(userData.username);
          if (!existingUser) {
            const user = await storage.createUser({
              username: userData.username,
              email: userData.email,
              password: await hashPassword(userData.password),
              role: userData.role as any,
              fullName: userData.full_name,
              phone: userData.phone,
              address: userData.address,
              isActive: true
            });
            createdUsers.push({ username: user.username, role: user.role });
          } else {
            createdUsers.push({ username: userData.username, role: userData.role, status: 'already exists' });
          }
        } catch (error) {
          console.error(`Error creating user ${userData.username}:`, error);
        }
      }

      res.json({ 
        message: 'Demo users creation completed',
        users: createdUsers,
        credentials: {
          admin: { username: 'admin', password: 'admin123' },
          vendor: { username: 'vendor1', password: 'vendor123' },
          delivery: { username: 'delivery1', password: 'delivery123' },
          customer: { username: 'customer1', password: 'customer123' }
        }
      });
    } catch (error) {
      console.error('Error creating demo users:', error);
      res.status(500).json({ error: 'Failed to create demo users' });
    }
  });
}
