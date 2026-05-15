import type { Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { createNotification } from "./notifications.controller";

/**
 * GET /api/v1/messages
 * Fetches all conversations for the authenticated user.
 * A conversation is grouped by the other participant (sender or receiver).
 */
export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Fetch all messages where user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, title: true } }
      }
    });

    // Group by participant
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherParticipant = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherParticipant.id)) {
        conversationsMap.set(otherParticipant.id, {
          participant: otherParticipant,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          listing: msg.listing
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
}

/**
 * GET /api/v1/messages/:participantId
 * Fetches the full message history between the user and another participant.
 */
export async function getMessagesWithParticipant(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const participantId = req.params["participantId"] as string;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: participantId },
          { senderId: participantId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching messages" });
  }
}

/**
 * POST /api/v1/messages
 * Sends a new message.
 */
export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const senderId = req.userId!;
    const { receiverId, content, listingId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver ID and content are required" });
    }

    // Fetch sender and receiver roles to enforce Guest <-> Host communication
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId }, select: { role: true } }),
      prisma.user.findUnique({ where: { id: receiverId }, select: { role: true } })
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    // Role-based restriction: Guest <-> Host, or anyone <-> Admin
    const isAdminInvolved = sender.role === "admin" || receiver.role === "admin";
    const isGuestHostInteraction = (sender.role === "guest" && receiver.role === "host") || 
                                    (sender.role === "host" && receiver.role === "guest");

    if (!isAdminInvolved && !isGuestHostInteraction) {
      return res.status(403).json({ error: "Messaging is only allowed between guests and hosts." });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        listingId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Create notification for receiver
    await createNotification(
      receiverId,
      "New Message",
      `You have a new message from ${message.sender.name}`,
      "message",
      "/messages"
    );

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error sending message" });
  }
}

/**
 * DELETE /api/v1/messages/:participantId
 * Deletes all messages between the user and another participant.
 */
export async function clearConversation(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const participantId = req.params["participantId"] as string;

    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: participantId },
          { senderId: participantId, receiverId: userId }
        ]
      }
    });

    res.json({ message: "Conversation cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error clearing conversation" });
  }
}
