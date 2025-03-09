const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle image upload
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  
  // Mock AI processing - in a real app, this would call your AI service
  const productRanks = ['A', 'B', 'C', 'D', 'F'];
  const randomRank = productRanks[Math.floor(Math.random() * productRanks.length)];
  
  // Calculate reimbursement percentage based on rank
  let reimbursementPercentage;
  switch (randomRank) {
    case 'A': reimbursementPercentage = 100; break;
    case 'B': reimbursementPercentage = 80; break;
    case 'C': reimbursementPercentage = 60; break;
    case 'D': reimbursementPercentage = 40; break;
    case 'F': reimbursementPercentage = 0; break;
    default: reimbursementPercentage = 0;
  }
  
  res.json({
    success: true,
    imagePath: req.file.path,
    productRank: randomRank,
    reimbursementPercentage: reimbursementPercentage
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
