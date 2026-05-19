import type { Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";

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
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        link
      }
    });

    // Automatically send an email notification copy to the user's email address!
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (user && user.email) {
      console.log(`[Notification Email] Dispatching to ${user.email}: ${title}`);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #EBEBEB; border-radius: 16px; background-color: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: bold; color: #FF5A5F; letter-spacing: -1px;">airbnb</span>
          </div>
          
          <h2 style="color: #222222; font-size: 20px; font-weight: 700; margin-bottom: 16px; border-bottom: 1px solid #F5F5F5; padding-bottom: 12px;">${title}</h2>
          
          <p style="color: #484848; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">Hi ${user.name},</p>
          <p style="color: #484848; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${content}</p>
          
          ${link ? `
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env["FRONTEND_URL"] ?? "http://localhost:5173"}${link}" 
                 style="display: inline-block; background-color: #FF5A5F; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; transition: background-color 0.2s;">
                View Details
              </a>
            </div>
          ` : ""}
          
          <div style="margin-top: 40px; border-top: 1px solid #EBEBEB; padding-top: 20px; text-align: center;">
            <p style="color: #767676; font-size: 12px; line-height: 1.4; margin: 0;">
              This is an automated notification from Airbnb. You received this email because you have notifications enabled on your profile.
            </p>
          </div>
        </div>
      `;

      sendEmail({
        to: user.email,
        subject: `[Airbnb Notification] ${title}`,
        html: emailHtml
      }).catch(err => {
        console.error(`[Notification Email Error] Failed to send email to ${user?.email}:`, err);
      });
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
