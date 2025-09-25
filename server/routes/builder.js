
import express from 'express';
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Página de builder (em construção)" });
});

export default router;
