const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes.cjs');
const gameRoutes = require('./routes/gameRoutes.cjs');
const globalErrorHandler = require('./utils/globalErrorHandler.cjs');
const app = express();
const cron = require('node-cron');
const Game = require('./models/gameModel.cjs');

const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from a single IP! Please try again in an hour',
});

// SECURITY & READ-DATA
// Reading data from body to req.body
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Applying rate limit to avoid attacks
app.set('trust proxy', 1);

app.use('/api', limiter);

// Applying XSS to sanitize
// app.use((req, res, next) => {
//   if (req.body) req.body = xss(req.body);
//   if (req.params) req.params = xss(req.params);
//   next();
// });

// Applying mongo sanitization

// app.use((req, res, next) => {
//   if (req.body) req.body = mongoSanitize.sanitize(req.body);
//   if (req.params) req.params = mongoSanitize.sanitize(req.params);
//   next();
// });

// Applying helmet to add security headers
app.use(helmet());

/* CREATE GAME AT MIDNIGHT */
cron.schedule('0 0 * * *', async () => {
  createGame();
});

// ROUTES
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/game', gameRoutes);

// ERROR HANDLING
app.use(globalErrorHandler);

module.exports = app;
