const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Trust reverse proxy (Dokploy, Nginx, Render, etc.) when running in production
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security: HTTP headers & Content Security Policy via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  })
);

// CORS configuration (allow restricting via CORS_ORIGIN environment variable)
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) }
  : {};
app.use(cors(corsOptions));

// Body parsing with payload size limits (prevents payload DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Rate limiter for demo request endpoint: max 10 requests per 15 min window per IP
const demoRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});

// Serve static frontend files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the landing page when visiting the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'IAMS_landing_page.html'));
});

// Nodemailer Transporter Setup for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_LOGIN, // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY   // Your Brevo SMTP key
  }
});

// Endpoint to handle demo requests with rate limiting and input validation
app.post('/api/request-demo', demoRequestLimiter, (req, res) => {
  const { name, inst, email, msg } = req.body;

  // Strict type checking
  if (
    typeof name !== 'string' ||
    typeof inst !== 'string' ||
    typeof email !== 'string' ||
    (msg !== undefined && msg !== null && typeof msg !== 'string')
  ) {
    return res.status(400).json({ error: 'Invalid field types.' });
  }

  const trimmedName = name.trim();
  const trimmedInst = inst.trim();
  const trimmedEmail = email.trim();
  const trimmedMsg = (msg || '').trim();

  // Required field checks
  if (!trimmedName || !trimmedInst || !trimmedEmail) {
    return res.status(400).json({ error: 'Name, Institution, and Email are required.' });
  }

  // Length limits to prevent DoS / buffer overflow
  if (
    trimmedName.length > 100 ||
    trimmedInst.length > 200 ||
    trimmedEmail.length > 254 ||
    trimmedMsg.length > 2000
  ) {
    return res.status(400).json({ error: 'Input exceeded maximum allowed length.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  // Insert into SQLite database (parameterized query)
  const sql = `INSERT INTO demo_requests (name, institution, email, message) VALUES (?, ?, ?, ?)`;
  db.run(sql, [trimmedName, trimmedInst, trimmedEmail, trimmedMsg], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to save request.' });
    }

    // Prepare email
    const mailOptions = {
      from: process.env.BREVO_SENDER_EMAIL, // Must be a verified sender in Brevo
      to: 'pyliew@utm.my', // The admin email
      subject: 'New IAMS Demo Request',
      text: `You have received a new demo request for IAMS:\n\nName: ${trimmedName}\nInstitution: ${trimmedInst}\nEmail: ${trimmedEmail}\nMessage: ${trimmedMsg || 'N/A'}\n\nThis request has been saved to your database.`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, error: 'Failed to send email. Please check your SMTP configuration.' });
      } else {
        console.log('Email sent:', info.response);
        return res.status(200).json({ success: true, message: 'Request submitted successfully.' });
      }
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
