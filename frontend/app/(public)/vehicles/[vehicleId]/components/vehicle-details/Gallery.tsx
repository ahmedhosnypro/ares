"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/src/utils/cn";
import { toImageUrl } from "@/src/utils/image-url";

interface GalleryProps {
  images: string[];
}

export default function Gallery({ images }: Readonly<GalleryProps>) {
  const [mainImage, setMainImage] = useState(images[0] ?? "");

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-colors duration-300 dark:bg-slate-800">
        <Image
          src={toImageUrl(mainImage) ?? "/placeholder-car.jpg"}
          alt="Vehicle Preview"
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority
        />
      </div>

      {/* Thumbnails List */}
      {images.length > 1 && (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto py-2 px-1">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setMainImage(img);
              }}
              className={cn(
                "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl transition-all duration-300 sm:h-24 sm:w-32",
                mainImage === img
                  ? "scale-100 ring-2 ring-indigo-600 ring-offset-2 shadow-md dark:ring-indigo-500 dark:ring-offset-slate-900"
                  : "scale-95 opacity-60 grayscale-[20%] hover:scale-100 hover:opacity-100 hover:grayscale-0 hover:shadow-sm"
              )}
            >
              <Image
                src={toImageUrl(img) ?? "/placeholder-car.jpg"}
                alt={`Thumbnail ${String(index)}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
