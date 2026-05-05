// Express Router — creates a modular route handler for AI endpoints
import { Router } from "express";
// AI controller functions for all 5 AI features
import { smartSearch, generateDescription, chat, recommend, reviewSummary } from "../../controllers/ai.controller";
// authenticate middleware — verifies JWT token for protected routes
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/search", smartSearch);
router.post("/listings/:id/generate-description", authenticate, generateDescription);
router.post("/chat", chat);
router.post("/recommend", authenticate, recommend);
router.get("/listings/:id/review-summary", reviewSummary);

export default router;
