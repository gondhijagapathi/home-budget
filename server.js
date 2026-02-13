// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8083;

const schemaInit = require('./models/schemaInit');

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
// Serve React build with cache control for index.html
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
}));

// Catch-all for React routing (after API routes)
app.use(/^(?!(\/api)).*$/, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// Discord Bot & Scheduler
const { client } = require('./services/discordBot/bot');
const { initScheduler } = require('./services/discordBot/scheduler');

// Start server after DB Init
schemaInit().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize Discord Bot
    if (process.env.DISCORD_BOT_TOKEN) {
      client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
        console.log('[Discord] Bot logged in successfully.');
        // Initialize Scheduler
        initScheduler();
      }).catch(err => {
        console.error('[Discord] Failed to login:', err);
      });
    } else {
      console.warn('[Discord] No DISCORD_BOT_TOKEN found. Bot will not run.');
    }
  });
}).catch(err => {
  console.error('Failed to initialize database schema. Exiting...', err);
  process.exit(1);
});

