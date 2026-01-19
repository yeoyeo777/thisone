import express from "express";
import cors from "cors";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "backend alive" });
});

// Launch endpoint (placeholder)
app.post("/launch", (req, res) => {
  console.log("Launch request received:", req.body);
  res.json({
    status: "received",
    note: "Backend exists but execution logic not wired yet"
  });
});

// Listen on port 3001 and all network interfaces
const PORT = parseInt(process.env.PORT || '3001', 10);
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on 0.0.0.0:${PORT}`);
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
