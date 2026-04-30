import prisma from "../config/prisma.js";
// Create a review
export const createReview = async (req, res) => {
    try {
        const { userId, listingId, rating, comment } = req.body;
        // Validate required fields
        if (!userId || !listingId || !rating) {
            return res.status(400).json({
                success: false,
                message: "userId, listingId, and rating are required",
            });
        }
        const review = await prisma.review.create({
            data: {
                userId,
                listingId,
                rating,
                comment: comment || "",
            },
            include: {
                user: true,
                listing: true,
            },
        });
        res.status(201).json({
            success: true,
            data: review,
        });
    }
    catch (error) {
        console.error("Create review error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create review",
        });
    }
};
// Get all reviews
export const getReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: true,
                listing: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    }
    catch (error) {
        console.error("Get reviews error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
        });
    }
};
// Get single review
export const getReviewById = async (req, res) => {
    try {
        const review = await prisma.review.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                user: true,
                listing: true,
            },
        });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }
        res.json({
            success: true,
            data: review,
        });
    }
    catch (error) {
        console.error("Get review by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching review",
        });
    }
};
// Delete review
export const deleteReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        // Verify review exists
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }
        await prisma.review.delete({
            where: { id: reviewId },
        });
        res.json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete review error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
        });
    }
};
//# sourceMappingURL=reviews.controller.js.map