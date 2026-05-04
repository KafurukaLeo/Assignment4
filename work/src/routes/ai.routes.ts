import { Router } from "express";
import { generateDescription } from "../controllers/ai.controller";

const router = Router();

router.post("/listings/:id/generate-description", generateDescription);

export default router;