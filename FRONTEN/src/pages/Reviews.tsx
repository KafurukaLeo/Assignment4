import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { toast } from "sonner";
import { Check, MessageSquare, Pencil, Star, Trash2, X } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  guest: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
}

export default function Reviews() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    comment: string;
  } | null>(null);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}/reviews`);
      return response.data as ReviewsResponse;
    },
    enabled: !!id,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      listingId: string;
      rating: number;
      comment: string;
    }) => {
      const response = await api.post("/reviews", reviewData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully");
      setNewReview({ rating: 5, comment: "" });
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      id: string;
      rating: number;
      comment: string;
    }) => {
      const response = await api.put(`/reviews/${reviewData.id}`, {
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Review updated");
      setEditingReview(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: () => {
      toast.error("Failed to update review");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newReview.comment.trim()) return;

    createReviewMutation.mutate({
      listingId: id,
      rating: newReview.rating,
      comment: newReview.comment,
    });
  };

  const handleUpdateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview?.comment.trim()) return;
    updateReviewMutation.mutate(editingReview);
  };

  const totalReviews = Array.isArray(reviewsData?.ratingDistribution)
    ? reviewsData.ratingDistribution.reduce(
        (sum, item) => sum + item.count,
        0,
      )
    : 0;
  const weightedTotal = Array.isArray(reviewsData?.ratingDistribution)
    ? reviewsData.ratingDistribution.reduce(
        (sum, item) => sum + item.rating * item.count,
        0,
      )
    : 0;
  const averageRating = totalReviews > 0 ? weightedTotal / totalReviews : 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] py-8">
        <div className="h-80 rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
            Guest reviews
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-1 text-3xl font-semibold text-gray-950 dark:text-white"
          >
            Reviews
          </h1>
        </div>
        {user?.role === "guest" && (
          <button
            onClick={() => setShowReviewForm((value) => !value)}
            className="w-fit rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
          >
            {showReviewForm ? "Cancel" : "Write a review"}
          </button>
        )}
      </div>

      <section className="mb-6 rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] md:p-7">
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <div>
            <p className="text-5xl font-semibold text-gray-950 dark:text-white">
              {averageRating.toFixed(1)}
            </p>
            <div className="mt-3">
              <Stars rating={Math.round(averageRating)} />
            </div>
            <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
              {reviewsData?.pagination.total || 0} reviews
            </p>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                reviewsData?.ratingDistribution.find((r) => r.rating === rating)
                  ?.count || 0;
              const percentage =
                totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-5 text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                    {rating}
                  </span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-(--color-primary)"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[12px] text-gray-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {showReviewForm && (
        <form
          onSubmit={handleSubmitReview}
          className="mb-6 rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827]"
        >
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
            Share your experience
          </h2>
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-gray-500">
              Rating
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="text-amber-400"
                  aria-label={`Set rating ${star}`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= newReview.rating ? "fill-current" : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500">
              Comment
            </span>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              className="min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              placeholder="Share what stood out during your stay"
              required
            />
          </label>
          <button
            type="submit"
            disabled={createReviewMutation.isPending}
            className="mt-4 rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-60"
          >
            {createReviewMutation.isPending ? "Submitting..." : "Submit review"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviewsData?.reviews.map((review) => {
          const isOwner = user?.id === review.guest.id;
          const isEditingThis = editingReview?.id === review.id;

          return (
            <article
              key={review.id}
              className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827]"
            >
              <div className="flex items-start gap-4">
                {review.guest.avatar ? (
                  <img
                    src={review.guest.avatar}
                    alt={review.guest.name}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-primary)/10 font-semibold text-(--color-primary)">
                    {review.guest.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold text-gray-950 dark:text-white">
                        {review.guest.name}
                      </h3>
                      <p className="text-[12px] text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      {isOwner && !isEditingThis && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingReview({
                                id: review.id,
                                rating: review.rating,
                                comment: review.comment,
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08]"
                            aria-label="Edit review"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              deleteReviewMutation.mutate(review.id)
                            }
                            disabled={deleteReviewMutation.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:hover:bg-red-500/10"
                            aria-label="Delete review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditingThis ? (
                    <form onSubmit={handleUpdateReview} className="mt-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setEditingReview({
                                ...editingReview,
                                rating: star,
                              })
                            }
                            className="text-amber-400"
                            aria-label={`Set rating ${star}`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= editingReview.rating
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editingReview.comment}
                        onChange={(e) =>
                          setEditingReview({
                            ...editingReview,
                            comment: e.target.value,
                          })
                        }
                        className="mt-3 min-h-28 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        required
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="submit"
                          disabled={updateReviewMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {updateReviewMutation.isPending
                            ? "Saving..."
                            : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingReview(null)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-3 text-[14px] leading-6 text-gray-600 dark:text-gray-300">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {reviewsData?.reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-gray-200 bg-white px-6 py-20 text-center dark:border-white/[0.08] dark:bg-[#111827]">
            <MessageSquare className="h-8 w-8 text-(--color-primary)" />
            <h2 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
              No reviews yet
            </h2>
            <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
              Reviews from guests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
