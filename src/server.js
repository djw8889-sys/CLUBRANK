const express = require('express');
const bodyParser = require('body-parser');
const { initializeFirebaseAdmin } = require('./config/firebase');
const { buildCorsOptions } = require('./config/cors');
const clubsRouter = require('./routes/clubs');

const app = express();
const PORT = process.env.PORT || 3000;

// Immediately initialize Firebase; surface configuration errors at startup so
// Codespace users see actionable feedback rather than silent crashes.
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.warn('[startup] Firebase Admin not initialized:', error.message);
}

app.use(buildCorsOptions());
app.use(bodyParser.json());
app.use('/api/clubs', clubsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  if (err.message && err.message.includes('Origin') && err.message.includes('not allowed')) {
    return res.status(403).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
