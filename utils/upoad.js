// /middlewares/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES module __dirname fallback
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the directories
const uploadImagesPath = path.resolve(__dirname, '../assets/images');  // For images
const uploadFilesPath = path.resolve(__dirname, '../assets/files');    // For game files

// Multer storage configuration for images and game files
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check which field the file belongs to
    if (file.fieldname === 'gameFile') {
      cb(null, uploadFilesPath); // Save game files in assets/files
    } else {
      cb(null, uploadImagesPath);  // Save images in assets/images
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);  // Create a unique name for each uploaded file
  }
});

// Multer upload middleware for images (profile pictures and screenshots) and game file (gameFile)
export const uploadGameAssets = multer({ storage: imageStorage }).fields([
  { name: 'profilePicture', maxCount: 1 },  // Single profile picture
  { name: 'pictures', maxCount: 8 },        // Up to 6 screenshots
  { name: 'gameFile', maxCount: 1 }         // Single game file (e.g., .rar, .zip)
]);
