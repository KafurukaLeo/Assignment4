import { Router } from "express";
import { login, register, changePassword, resetPassword, forgotPassword, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authenticate, me);
router.post("/change-password",  authenticate, changePassword);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);

export default router;