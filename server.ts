import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "benxu-erp-secret-key-123";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new Database("data.db");

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    initial_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'income' or 'expense'
    amount REAL,
    date TEXT,
    customer TEXT,
    invoice_no TEXT,
    category TEXT,
    description TEXT,
    attachment_url TEXT, -- Store as JSON array string
    operator_id INTEGER,
    operator_name TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(operator_id) REFERENCES users(id)
  );

  -- Insert default main account if not exists
  INSERT OR IGNORE INTO accounts (id, name, initial_balance, current_balance) 
  VALUES ('main', '实验室公用资金', 0, 0);
`);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// Gemini AI setup
let model: any = null;
function getModel() {
  if (!model) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const genAI = new GoogleGenAI({ apiKey: key });
    model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return model;
}

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  res.json({ id: user.id, username: user.username, role: user.role, name: user.name });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// User Routes
app.get("/api/users", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT id, username, name, role, created_at FROM users").all();
  res.json(users);
});

// File Upload Route
app.post("/api/upload", authenticateToken, upload.array("files", 10), (req: any, res: any) => {
  const files = req.files as any[];
  if (!files) return res.status(400).json({ error: "No files uploaded" });
  
  const urls = files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// Admin Route: Initialize first admin
app.post("/api/auth/init-admin", (req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count > 0) return res.status(400).json({ error: "Admin already exists" });

  const { username, password, name } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run(username, hashedPassword, name, 'admin');
  res.json({ message: "Admin initialized" });
});

// Transaction Routes
app.get("/api/transactions", authenticateToken, (req, res) => {
  const transactions = db.prepare("SELECT * FROM transactions WHERE is_deleted = 0 ORDER BY date DESC, created_at DESC").all();
  res.json(transactions);
});

app.post("/api/transactions", authenticateToken, (req: any, res) => {
  const { type, amount, date, customer, invoice_no, category, description, attachment_url } = req.body;
  
  const result = db.prepare(`
    INSERT INTO transactions (type, amount, date, customer, invoice_no, category, description, attachment_url, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(type, amount, date, customer, invoice_no, category, description, attachment_url, req.user.id, req.user.name);

  // Update account balance
  const balanceChange = type === 'income' ? amount : -amount;
  db.prepare("UPDATE accounts SET current_balance = current_balance + ? WHERE id = 'main'").run(balanceChange);

  res.json({ id: result.lastInsertRowid });
});

app.patch("/api/transactions/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { is_deleted } = req.body;

  if (is_deleted === 1) {
    const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
    if (transaction && transaction.is_deleted === 0) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      db.prepare("UPDATE accounts SET current_balance = current_balance + ? WHERE id = 'main'").run(balanceChange);
      db.prepare("UPDATE transactions SET is_deleted = 1 WHERE id = ?").run(id);
    }
  }
  res.json({ success: true });
});

// Account Routes
app.get("/api/accounts", authenticateToken, (req, res) => {
  const accounts = db.prepare("SELECT * FROM accounts").all();
  res.json(accounts);
});

// AI Invoice Parsing (Mocked for now)
app.post("/api/ai/parse-invoice", authenticateToken, async (req, res) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.json({
      amount: 1280.50,
      invoice_no: "INV-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      customer: "模拟供应实业有限公司",
      type: "试剂耗材"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse invoice" });
  }
});

// Vite middleware for development
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
