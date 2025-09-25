
import express from 'express';
const router = express.Router();

// Mock OAuth
router.get('/login', (req, res) => {
  res.json({ msg: 'Simulação de login com Discord' });
});

export default router;
