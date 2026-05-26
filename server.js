const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

const { ensureUploadDir, uploadRoot } = require('./utils/uploadStorage');

// Connect to database
connectDB();

const app = express();

ensureUploadDir();
ensureUploadDir('tenders');
ensureUploadDir('services');
ensureUploadDir('gallery');
ensureUploadDir('partners');
ensureUploadDir('marketplace');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://vishwakarma-build-and-furnish.vercel.app',
  'https://vishwakarma-build-and-furnish.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files for uploads
app.use(
  '/uploads',
  cors({ origin: '*' }),
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(uploadRoot)
);

// API Routes
app.use('/api/categories', require('./routes/categories')); // Keep categories route
app.use('/api/services', require('./routes/services')); // Keep services route
app.use('/api/blogs', require('./routes/blogs')); // Blog routes
app.use('/api/gallery', require('./routes/gallery')); // Gallery routes
app.use('/api/inquiries', require('./routes/inquiries')); // Keep inquiries route
app.use('/api/auth', require('./routes/auth')); // Auth routes
app.use('/api/tenders', require('./routes/tenderRoutes')); // Tender routes with PDF upload
app.use('/api/partners', require('./routes/partners'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/analytics', require('./routes/analytics'));
app.use(require('./routes/seo'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    uploads: {
      path: '/uploads',
      root: uploadRoot,
      tenders: '/uploads/tenders',
      services: '/uploads/services',
      gallery: '/uploads/gallery'
    }
  });
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  }
  
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed'
    });
  }

  if (err.message === 'Only image and video files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image and video files are allowed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Uploads available at http://localhost:${PORT}/uploads`);
  console.log(`Tenders endpoint: http://localhost:${PORT}/api/tenders`);
});

module.exports = app;
