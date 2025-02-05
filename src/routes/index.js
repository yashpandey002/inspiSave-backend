import { Router } from 'express';
import { authenticateUser, savePageToNotion } from '../controllers/index.js';
import multer from 'multer';
const upload = multer();
const router = Router();

router.post('/authenticate', authenticateUser);
router.post('/save-page-to-notion', upload.none(), savePageToNotion);

export default router;
