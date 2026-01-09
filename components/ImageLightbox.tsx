import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; distance: number | null }>({
    x: 0,
    y: 0,
    distance: null
  });

  // Reset state when opening or changing image
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          navigatePrev();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const navigatePrev = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const navigateNext = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: null
      };
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current.distance !== null) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance - touchStartRef.current.distance;
      const newScale = Math.min(Math.max(scale + delta * 0.01, 1), 4);
      setScale(newScale);
      touchStartRef.current.distance = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0 && touchStartRef.current.distance === null) {
      // Swipe detection for navigation
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (scale === 1 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
        if (deltaX > 0) {
          navigatePrev();
        } else {
          navigateNext();
        }
      }
    }
    touchStartRef.current.distance = null;
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={(e) => e.target === containerRef.current && onClose()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <i className="fas fa-times text-lg"></i>
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          <i className="fas fa-minus"></i>
        </button>
        <span className="text-white text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 4}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={navigatePrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <button
            onClick={navigateNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <i className="fas fa-chevron-right text-lg"></i>
          </button>
        </>
      )}

      {/* Image container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={images[currentIndex]}
          alt={`Scene ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? 'grab' : 'zoom-in'
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 max-w-[80vw] overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-rose-500 opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Instructions hint */}
      <div className="absolute bottom-4 right-4 text-white/40 text-xs hidden md:block">
        Double-click to zoom • Drag to pan • Arrow keys to navigate
      </div>
    </div>
  );
};

export default ImageLightbox;
