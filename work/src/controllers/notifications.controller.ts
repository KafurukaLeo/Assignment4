import type { Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";

/**
 * GET /api/v1/notifications
 * Fetches all notifications for the authenticated user.
 */
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
}

/**
 * PATCH /api/v1/notifications/read
 * Marks all notifications as read for the user.
 */
export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating notifications" });
  }
}

/**
 * Helper function to create a notification
 */
export async function createNotification(userId: string, title: string, content: string, type: "message" | "booking" | "system", link?: string) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        link
      }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
