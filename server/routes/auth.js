import express from "express";
const router = express.Router();

// mock OAuth
router.get("/login", (req, res) => {
  res.json({ msg: "Simulação de login com Discord" });
});

export default router;
