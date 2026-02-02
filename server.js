// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8083;

// Middleware
app.use(express.json());

// Health check endpoint (for Docker/load balancers)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount your API routes under a common prefix
const routes = require('./routes');
app.use('/api', routes);

// Serve React build
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all for React routing (after API routes)
app.use(/^(?!(\/api)).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
