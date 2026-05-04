import { Router } from "express";
import { smartSearch, generateDescription, chat, recommend, reviewSummary } from "../../controllers/ai.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/search", smartSearch);
router.post("/listings/:id/generate-description", authenticate, generateDescription);
router.post("/chat", chat);
router.post("/recommend", authenticate, recommend);
router.get("/listings/:id/review-summary", reviewSummary);

export default router;
