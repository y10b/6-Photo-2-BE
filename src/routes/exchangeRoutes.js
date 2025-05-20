import express from "express";
import {
  proposeExchange,
  acceptExchange,
  rejectExchange,
} from "../controllers/exchangeController.js";

const router = express.Router();

router.post("/exchange", proposeExchange);
router.post("/exchange/:id/accept", acceptExchange);
router.post("/exchange/:id/reject", rejectExchange);

export default router;
