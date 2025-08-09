const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html',
  dotfiles: 'allow'
}));

// Handle all routes by serving index.html (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 PlayTest Frontend running on port ${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});