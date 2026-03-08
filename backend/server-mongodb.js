/**
 * Updated Express Server with MongoDB Posts Search API
 * 
 * This server includes:
 * - MongoDB connection
 * - Posts search & filter API
 * - Pagination support
 * - Advanced filtering options
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./lib/mongoDb');

// Import routes
const postsSearchRouter = require('./routes/postsSearch');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB on startup
let dbConnected = false;

connectToDatabase()
  .then(() => {
    dbConnected = true;
    console.log('✓ MongoDB connection established');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    dbConnected = false;
  });

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Medication Forum Search API',
    status: dbConnected ? 'Connected to MongoDB' : 'MongoDB connection pending',
    endpoints: {
      'GET /posts': 'Search and filter posts',
      'GET /posts/advanced': 'Advanced search with multiple filters',
      'GET /posts/stats': 'Get posts statistics',
      'GET /posts/:id': 'Get single post by ID',
    },
  });
});

// Register routes
app.use('/posts', postsSearchRouter);

// Error handling middleware for 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Medication Forum API running on http://localhost:${PORT}\n`);
  console.log('Available endpoints:');
  console.log(`  Search:   GET http://localhost:${PORT}/posts?search=aspirin&page=1`);
  console.log(`  Filter:   GET http://localhost:${PORT}/posts?differentFromPackage=true`);
  console.log(`  Advanced: GET http://localhost:${PORT}/posts/advanced`);
  console.log(`  Stats:    GET http://localhost:${PORT}/posts/stats`);
  console.log(`  Single:   GET http://localhost:${PORT}/posts/:id\n`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
