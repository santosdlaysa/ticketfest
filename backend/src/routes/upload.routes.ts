import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload single image
router.post('/image', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Use request host to build URL (works for both localhost and IP addresses)
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer upload' });
  }
});

// Upload multiple images
router.post('/images', authenticate, upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Use request host to build URL (works for both localhost and IP addresses)
    const protocol = req.protocol;
    const host = req.get('host');
    const urls = files.map(file => `${protocol}://${host}/uploads/${file.filename}`);

    res.json({
      success: true,
      urls,
      count: files.length,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer upload' });
  }
});

// Delete image
router.delete('/:filename', authenticate, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Imagem deletada com sucesso' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error: any) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ error: error.message || 'Erro ao deletar arquivo' });
  }
});

export default router;
