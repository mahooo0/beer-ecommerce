'use client';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ProductLightboxProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex: number;
}

export default function ProductLightbox({
  images,
  isOpen,
  onClose,
  initialIndex,
}: ProductLightboxProps) {
  const slides = images.map((src) => ({ src }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={initialIndex}
      slides={slides}
    />
  );
}
