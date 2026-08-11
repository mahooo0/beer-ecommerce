'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StarRating } from '../ui/star-rating';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  userName: string;
  createdAt: string;
}

interface ReviewsPlaceholderProps {
  averageRating?: number;
  reviewCount?: number;
  reviews?: Review[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function ReviewsPlaceholder({
  averageRating = 0,
  reviewCount = 0,
  reviews = [],
}: ReviewsPlaceholderProps) {
  const { t } = useTranslation('shop');
  // Calculate rating distribution
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const review of reviews) {
    const star = Math.round(review.rating);
    if (star >= 1 && star <= 5) {
      distribution[star] = (distribution[star] ?? 0) + 1;
    }
  }

  const maxCount = Math.max(...Object.values(distribution), 1);
  const displayedReviews = reviews.slice(0, 3);

  return (
    <section className="mt-8 border-t border-border-secondary pt-8">
      <h2 className="text-xl font-semibold text-primary mb-6">{t('reviews.title')}</h2>

      {/* Average rating summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8">
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</span>
          <div className="mt-2">
            <StarRating rating={averageRating} size="md" />
          </div>
          <span className="mt-1 text-sm text-tertiary">
            {t('reviews.count', { count: reviewCount })}
          </span>
        </div>

        {/* Rating distribution bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0;
            const widthPercent = reviews.length > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-tertiary w-12 shrink-0">{t('reviews.starRating', { count: star })}</span>
                <div className="flex-1 bg-secondary_subtle rounded-full h-2">
                  <div
                    className="bg-utility-warning-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-sm text-tertiary w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual reviews */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <div key={review.id} className="border-b border-border-secondary pb-6 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="sm" />
                  {review.title && (
                    <span className="font-medium text-primary">{review.title}</span>
                  )}
                </div>
                <span className="text-sm text-tertiary">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm font-medium text-secondary mb-1">{review.userName}</p>
              <p className="text-tertiary">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-tertiary text-center py-6">
          {t('reviews.empty')}
        </p>
      )}
    </section>
  );
}
