import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import { enhancedStorage as storage } from "./enhanced-storage";
import { 
  User as SelectUser, 
  insertUserSchema, 
  updateUserSchema,
  changePasswordSchema,
  emailChangeSchema
} from "@shared/schema";
import { sendEmailVerification, sendPasswordReset, generateSecureToken } from "./services/email";
import { upload, handleUploadError } from "./services/upload";

// Declare the User type for Express session
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

/**
 * Check if user account is locked due to failed login attempts
 */
function isAccountLocked(user: SelectUser): boolean {
  return user.lockedUntil ? new Date() < new Date(user.lockedUntil) : false;
}

/**
 * Get the base URL for email links
 */
function getBaseUrl(req: any): string {
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return `${protocol}://${req.get('host')}`;
}

/**
 * Extract IP address from request
 */
function getClientIP(req: any): string {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

/**
 * Extract User Agent from request
 */
function getUserAgent(req: any): string {
  return req.get('User-Agent') || 'unknown';
}

/**
 * Set up authentication and rate limiting for the Express app
 */
export function setupAuth(app: Express) {
  // Rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting for registration
  const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: { error: "Too many registration attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting for password reset requests
  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: { error: "Too many password reset attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session settings using the storage implementation's sessionStore
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pokemon-card-album-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for email/username and password auth
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'usernameOrEmail', // Allow both username and email
        passwordField: 'password'
      },
      async (usernameOrEmail, password, done) => {
        try {
          // Try to find user by email first, then by username
          let user = await storage.getUserByEmail(usernameOrEmail);
          if (!user) {
            user = await storage.getUserByUsername(usernameOrEmail);
          }

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          // Check if account is locked
          if (isAccountLocked(user)) {
            return done(null, false, { message: 'Account is temporarily locked due to too many failed login attempts' });
          }

          // Check if account is active
          if (!user.isActive) {
            return done(null, false, { message: 'Account is deactivated' });
          }

          // Verify password
          const isPasswordValid = await comparePasswords(password, user.password);
          if (!isPasswordValid) {
            // Increment failed login attempts
            await storage.incrementFailedLoginAttempts(user.id);
            
            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts >= 4) { // Will be 5 after increment
              const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
              await storage.lockUser(user.id, lockUntil);
              return done(null, false, { message: 'Account locked due to too many failed login attempts' });
            }
            
            return done(null, false, { message: 'Invalid credentials' });
          }

          // Reset failed login attempts on successful login
          await storage.resetFailedLoginAttempts(user.id);
          await storage.updateLastLogin(user.id);

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ),
  );

  // Serialize/deserialize user to/from session
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // User registration endpoint with email verification
  app.post("/api/register", registrationLimiter, async (req, res, next) => {
    try {
      // Validate input using Zod schema
      const validatedData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Log user activity
      await storage.logUserActivity({
        userId: user.id,
        action: 'account_created',
        details: { method: 'email_registration' },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      // Generate email verification token
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createEmailVerificationToken({
        userId: user.id,
        token,
        expiresAt,
      });

      // Send verification email
      const baseUrl = getBaseUrl(req);
      await sendEmailVerification(user.email, token, baseUrl);

      // Return user info without the password
      const { password, ...userInfo } = user;
      res.status(201).json({
        ...userInfo,
        message: "Account created successfully. Please check your email to verify your account."
      });
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data", details: err.errors });
      }
      next(err);
    }
  });

  // User login endpoint with rate limiting
  app.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: Express.User, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);

        // Log successful login activity
        await storage.logUserActivity({
          userId: user.id,
          action: 'login',
          details: { method: 'password' },
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
        });

        // Return user info without the password
        const { password, ...userInfo } = user;
        res.status(200).json(userInfo);
      });
    })(req, res, next);
  });

  // User logout endpoint
  app.post("/api/logout", async (req, res, next) => {
    if (req.user) {
      // Log logout activity
      await storage.logUserActivity({
        userId: req.user.id,
        action: 'logout',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Return user info without the password
    const { password, ...userInfo } = req.user as Express.User;
    res.json(userInfo);
  });

  // Email verification endpoint
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (new Date() > new Date(verificationToken.expiresAt)) {
        await storage.deleteEmailVerificationToken(verificationToken.id);
        return res.status(400).json({ error: "Verification token has expired" });
      }

      // Mark email as verified
      await storage.updateUser(verificationToken.userId, { emailVerified: true });
      
      // Delete the used token
      await storage.deleteEmailVerificationToken(verificationToken.id);

      // Log activity
      await storage.logUserActivity({
        userId: verificationToken.userId,
        action: 'email_verified',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: "Email verified successfully" });
    } catch (err) {
      next(err);
    }
  });

  // Request password reset endpoint
  app.post("/api/request-password-reset", passwordResetLimiter, async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: "If that email exists, a password reset link has been sent." });
      }

      // Generate password reset token
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Send password reset email
      const baseUrl = getBaseUrl(req);
      await sendPasswordReset(user.email, token, baseUrl);

      // Log activity
      await storage.logUserActivity({
        userId: user.id,
        action: 'password_reset_requested',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: "If that email exists, a password reset link has been sent." });
    } catch (err) {
      next(err);
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired or already used
      if (new Date() > new Date(resetToken.expiresAt) || resetToken.used) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      // Reset failed login attempts
      await storage.resetFailedLoginAttempts(resetToken.userId);

      // Log activity
      await storage.logUserActivity({
        userId: resetToken.userId,
        action: 'password_reset_completed',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      next(err);
    }
  });

  // Update user profile endpoint
  app.patch("/api/user/profile", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const validatedData = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log activity
      await storage.logUserActivity({
        userId: req.user.id,
        action: 'profile_updated',
        details: { fields: Object.keys(validatedData) },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      // Return updated user info without password
      const { password, ...userInfo } = updatedUser;
      res.json(userInfo);
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data", details: err.errors });
      }
      next(err);
    }
  });

  // Change password endpoint
  app.post("/api/user/change-password", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const validatedData = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(validatedData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password
      const hashedPassword = await hashPassword(validatedData.newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Log activity
      await storage.logUserActivity({
        userId: user.id,
        action: 'password_changed',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data", details: err.errors });
      }
      next(err);
    }
  });

  // Upload avatar endpoint
  app.post("/api/user/avatar", upload.single('avatar'), handleUploadError, async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      // Update user avatar URL
      const updatedUser = await storage.updateUser(req.user.id, { avatarUrl });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log activity
      await storage.logUserActivity({
        userId: req.user.id,
        action: 'avatar_updated',
        details: { filename: req.file.filename },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ 
        message: "Avatar uploaded successfully",
        avatarUrl 
      });
    } catch (err) {
      next(err);
    }
  });

  // Change email endpoint
  app.post("/api/user/change-email", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const validatedData = emailChangeSchema.parse(req.body);
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await comparePasswords(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Password is incorrect" });
      }

      // Check if new email already exists
      const existingUser = await storage.getUserByEmail(validatedData.newEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Update email and set emailVerified to false
      await storage.updateUser(user.id, { 
        email: validatedData.newEmail, 
        emailVerified: false 
      });

      // Generate new email verification token
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createEmailVerificationToken({
        userId: user.id,
        token,
        expiresAt,
      });

      // Send verification email to new address
      const baseUrl = getBaseUrl(req);
      await sendEmailVerification(validatedData.newEmail, token, baseUrl);

      // Log activity
      await storage.logUserActivity({
        userId: user.id,
        action: 'email_changed',
        details: { oldEmail: user.email, newEmail: validatedData.newEmail },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      res.json({ 
        message: "Email updated successfully. Please check your new email to verify it.",
        newEmail: validatedData.newEmail
      });
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input data", details: err.errors });
      }
      next(err);
    }
  });

  // Get user activity log
  app.get("/api/user/activity", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getUserActivityLog(req.user.id, limit);
      
      res.json(activities);
    } catch (err) {
      next(err);
    }
  });

  // Deactivate account endpoint
  app.post("/api/user/deactivate", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required to deactivate account" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Password is incorrect" });
      }

      // Deactivate account
      await storage.deactivateUser(user.id);

      // Log activity
      await storage.logUserActivity({
        userId: user.id,
        action: 'account_deactivated',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      // Logout user
      req.logout((err) => {
        if (err) return next(err);
        res.json({ message: "Account deactivated successfully" });
      });
    } catch (err) {
      next(err);
    }
  });

  // Delete account endpoint
  app.delete("/api/user/delete", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { password, confirmation } = req.body;
      
      if (!password || confirmation !== "DELETE") {
        return res.status(400).json({ 
          error: "Password and confirmation ('DELETE') are required to delete account" 
        });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Password is incorrect" });
      }

      // Log activity before deletion
      await storage.logUserActivity({
        userId: user.id,
        action: 'account_deleted',
        details: {},
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      });

      // Delete account
      await storage.deleteUser(user.id);

      // Logout user
      req.logout((err) => {
        if (err) return next(err);
        res.json({ message: "Account deleted successfully" });
      });
    } catch (err) {
      next(err);
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static('client/public/uploads'));

  // Cleanup expired tokens periodically
  setInterval(async () => {
    try {
      await storage.deleteExpiredEmailVerificationTokens();
      await storage.deleteExpiredPasswordResetTokens();
    } catch (err) {
      console.error('Error cleaning up expired tokens:', err);
    }
  }, 60 * 60 * 1000); // Run every hour
}