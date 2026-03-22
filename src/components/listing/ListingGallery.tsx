"use client";

import { useCallback, useEffect, useState } from "react";

interface Photo {
  id: string;
  r2Key: string;
  r2Url: string;
}

interface ListingGalleryProps {
  photos: Photo[];
}

function buildImageUrl(photo: Photo, variant: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${photo.r2Key}/${variant}`;
  }
  return photo.r2Url;
}

export function ListingGallery({ photos }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrev = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  useEffect(() => {
    if (photos.length === 0) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, goToPrev, goToNext]);

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500 text-sm">No photos available</p>
      </div>
    );
  }

  const activePhoto = photos[activeIndex];

  return (
    <div className="w-full space-y-3">
      {/* Main photo */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={buildImageUrl(activePhoto, "listing-gallery")}
          alt={`Listing photo ${activeIndex + 1} of ${photos.length}`}
          className="w-full h-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              &#8249;
            </button>
            <button
              onClick={goToNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              &#8250;
            </button>
          </>
        )}

        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {activeIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${
                i === activeIndex
                  ? "border-blue-600"
                  : "border-transparent hover:border-gray-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildImageUrl(photo, "listing-thumb")}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
