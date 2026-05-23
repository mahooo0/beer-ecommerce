'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import ProductLightbox from './product-lightbox';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2NiZDVlMSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gaW1hZ2U8L3RleHQ+PC9zdmc+';

export default function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const displayImages = images.length > 0 ? images : [PLACEHOLDER];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Mobile carousel tracking
  const carouselRef = useRef<HTMLDivElement>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false);
  }, []);

  const handleHeroClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  // Track mobile carousel scroll position
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const { scrollLeft, offsetWidth } = carousel;
      const index = Math.round(scrollLeft / offsetWidth);
      setMobileActiveIndex(index);
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({ left: index * carousel.offsetWidth, behavior: 'smooth' });
    setMobileActiveIndex(index);
  }, []);

  const activeImage = displayImages[activeIndex] ?? PLACEHOLDER;

  return (
    <div className="w-full">
      {/* Desktop layout (md+) */}
      <div className="hidden md:block">
        {/* Hero image with zoom */}
        <div
          className="relative w-full aspect-square overflow-hidden rounded-lg bg-secondary_subtle cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleHeroClick}
        >
          <Image
            src={activeImage}
            alt={`${productName} - image ${activeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={activeIndex === 0}
          />

          {/* Zoom overlay */}
          {isZooming && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${activeImage})`,
                backgroundSize: '250%',
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}

          {/* Fullscreen button */}
          <button
            type="button"
            className="absolute top-3 right-3 z-10 bg-primary/80 hover:bg-primary text-secondary rounded-md p-1.5 shadow transition-colors pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            aria-label="Open fullscreen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>

        {/* Thumbnail strip */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {displayImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                  i === activeIndex
                    ? 'border-border-brand'
                    : 'border-transparent hover:border-border-primary'
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={`${productName} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile layout (below md) */}
      <div className="block md:hidden">
        {/* Swipeable carousel */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-lg scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayImages.map((img, i) => (
            <div
              key={i}
              className="relative min-w-full aspect-square flex-shrink-0 snap-start bg-secondary_subtle"
              onClick={() => {
                setActiveIndex(i);
                setIsLightboxOpen(true);
              }}
            >
              <Image
                src={img}
                alt={`${productName} - image ${i + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {displayImages.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {displayImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === mobileActiveIndex ? 'bg-brand-solid' : 'bg-quaternary'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ProductLightbox
        images={displayImages}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialIndex={activeIndex}
      />
    </div>
  );
}
