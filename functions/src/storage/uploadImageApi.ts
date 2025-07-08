import express from 'express';
import multer from 'multer';
import { admin } from '../admin';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bucket = admin.storage().bucket();
    const fileName = `images/${Date.now()}_${req.file.originalname}`;
    
    await bucket.file(fileName).save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router; 