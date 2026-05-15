import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  getConversations,
  getMessagesWithParticipant,
  sendMessage,
  clearConversation
} from "../../controllers/messages.controller";

const router = Router();

router.use(authenticate);

router.get("/conversations", getConversations);
router.get("/:participantId", getMessagesWithParticipant);
router.post("/", sendMessage);
router.delete("/:participantId", clearConversation);

export default router;
