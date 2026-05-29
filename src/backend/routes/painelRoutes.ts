import express from 'express';
const router = express.Router();
import painelController from '../controllers/painelController';

router.get('/', painelController.obterPainel);

export default router;
