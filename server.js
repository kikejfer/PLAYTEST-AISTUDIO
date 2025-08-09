const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from current directory
app.use(express.static('.', {
  extensions: ['html'],
  index: 'index.html',
  dotfiles: 'allow'
}));

// Serve index.html for root path explicitly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle SPA routes - serve index.html for unknown routes that don't have file extensions
app.get('*', (req, res) => {
  const ext = path.extname(req.path);
  if (!ext) {
    // No extension, might be a SPA route, serve index.html
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    // Has extension, likely a file request that wasn't found
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PlayTest Frontend running on port ${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});