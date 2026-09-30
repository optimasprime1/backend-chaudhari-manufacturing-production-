const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const LOCAL_FRONTEND_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const PRODUCTION_FRONTEND_ORIGINS = [
  'https://forntend-chaudhari-manufacturing-pr.vercel.app'
];

function configuredOrigins() {
  return (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function createCorsOptions() {
  const origins = configuredOrigins();
  const allowedOrigins = [
    ...new Set([
      ...origins,
      ...PRODUCTION_FRONTEND_ORIGINS,
      ...(origins.length || process.env.NODE_ENV === 'production' ? [] : LOCAL_FRONTEND_ORIGINS)
    ])
  ];

  return {
    credentials: true,
    origin(origin, callback) {
      // Non-browser clients such as curl do not send an Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);

      const error = new Error('Origin not allowed by CORS.');
      error.statusCode = 403;
      return callback(error);
    },
    optionsSuccessStatus: 204
  };
}

const app = express();
app.disable('x-powered-by');

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '100kb' }));
app.use('/photos', express.static(path.join(__dirname, '..', 'photos')));

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Chaudhari Manufacturing API is running.' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products', productRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'admin', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

module.exports = app;
