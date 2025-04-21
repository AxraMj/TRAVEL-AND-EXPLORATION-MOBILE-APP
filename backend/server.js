require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const guideRoutes = require("./routes/guide");
const postRoutes = require("./routes/post");
const profileRoutes = require("./routes/profile");
const notificationRoutes = require("./routes/notification");
const searchRoutes = require("./routes/search");
const auth = require("./middleware/auth");

const app = express();
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ server });

// Store WebSocket connections with user IDs
const clients = new Map();

wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection attempt");

  // Extract token from query string
  const url = new URL(req.url, `ws://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    console.log("WebSocket connection rejected: No token provided");
    ws.close();
    return;
  }

  try {
    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log("WebSocket authenticated for user:", userId);

    // Store the connection
    clients.set(userId, ws);
    console.log("Active WebSocket connections:", clients.size);

    // Send a welcome message to confirm connection
    ws.send(
      JSON.stringify({
        event: "connected",
        data: { message: "Successfully connected to notifications" },
      })
    );

    ws.on("close", () => {
      console.log("WebSocket disconnected for user:", userId);
      clients.delete(userId);
      console.log("Remaining active connections:", clients.size);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error for user:", userId, error);
    });
  } catch (error) {
    console.error("WebSocket authentication error:", error);
    ws.close();
  }
});

// Make WebSocket server available globally
global.io = {
  to: (userId) => ({
    emit: (event, data) => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        console.log("Emitting event to user:", userId, { event, data });
        client.send(JSON.stringify({ event, data }));
      } else {
        console.log(
          "Client not found or connection not open for user:",
          userId
        );
      }
    },
  }),
};

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
    headers: req.headers
  });
});

// Additional test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint request received from:', req.ip);
  res.status(200).json({
    status: 'ok',
    message: 'API is working correctly',
    serverTime: new Date().toISOString(),
    clientInfo: {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guides", auth, guideRoutes);
app.use("/api/posts", auth, postRoutes);
app.use("/api/profiles", auth, profileRoutes);
app.use("/api/notifications", auth, notificationRoutes);
app.use("/api/search", searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.toString() : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const YOUR_IP = "0.0.0.0";  // Listen on all network interfaces

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Database:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Start server
server.listen(PORT, YOUR_IP, () => {
  console.log(`Server running on http://${YOUR_IP}:${PORT}`);
  console.log(`WebSocket server running on ws://${YOUR_IP}:${PORT}`);
  console.log(`Access the API at http://localhost:${PORT} or http://<your-ip>:${PORT}`);
});
