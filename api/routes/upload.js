const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, req.body.type || 'general');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload single image
router.post('/single', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { type = 'general', resize } = req.body;
    const originalPath = req.file.path;
    const filename = req.file.filename;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let processedPath = originalPath;
    
    // Process image if resize parameters are provided
    if (resize) {
      const { width, height, quality = 80 } = JSON.parse(resize);
      const processedFilename = `processed_${filename}`;
      processedPath = path.join(path.dirname(originalPath), processedFilename);
      
      await sharp(originalPath)
        .resize(width, height, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(processedPath);
        
      // Remove original file
      fs.unlinkSync(originalPath);
    }

    const relativePath = path.relative(uploadsDir, processedPath);
    const imageUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: path.basename(processedPath),
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Upload multiple images
router.post('/multiple', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { type = 'general', resize } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedImages = [];

    for (const file of req.files) {
      const originalPath = file.path;
      const filename = file.filename;
      let processedPath = originalPath;
      
      // Process image if resize parameters are provided
      if (resize) {
        const { width, height, quality = 80 } = JSON.parse(resize);
        const processedFilename = `processed_${filename}`;
        processedPath = path.join(path.dirname(originalPath), processedFilename);
        
        await sharp(originalPath)
          .resize(width, height, { 
            fit: 'cover',
            withoutEnlargement: true 
          })
          .jpeg({ quality })
          .toFile(processedPath);
          
        // Remove original file
        fs.unlinkSync(originalPath);
      }

      const relativePath = path.relative(uploadsDir, processedPath);
      const imageUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

      uploadedImages.push({
        url: imageUrl,
        filename: path.basename(processedPath),
        size: file.size,
        type: file.mimetype
      });
    }

    res.json({
      success: true,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Delete uploaded file
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;
    
    const filePath = path.join(uploadsDir, type, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

module.exports = router;