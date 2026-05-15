import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getNotifications, markAllAsRead } from "../../controllers/notifications.controller";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read", markAllAsRead);

export default router;
