import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  rating,
  maxStars = 5,
  showValue = false,
  size = 'sm',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg',
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Render full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className="text-yellow-400">
        ★
      </span>
    );
  }

  // Render half star
  if (hasHalfStar && fullStars < maxStars) {
    stars.push(
      <span key="half" className="relative inline-block">
        <span className="text-gray-300">★</span>
        <span
          className="absolute top-0 left-0 text-yellow-400 overflow-hidden"
          style={{ width: '50%' }}
        >
          ★
        </span>
      </span>
    );
  }

  // Render empty stars
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="text-gray-300">
        ★
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5" data-testid="star-rating">
      <div className={`flex gap-0.5 ${sizeClasses[size]}`}>{stars}</div>
      {showValue && <span className="ml-1 text-gray-600">{rating.toFixed(1)}</span>}
    </div>
  );
}
