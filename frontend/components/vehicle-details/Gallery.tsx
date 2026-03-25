"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/src/utils/cn";

interface GalleryProps {
  images: string[];
}

export default function Gallery({ images }: Readonly<GalleryProps>) {
  // State to keep track of the currently selected main image
  const [mainImage, setMainImage] = useState(images[0]);

  return (
    // ضفنا بادينج خفيف عشان الصور متلزقش في حواف الكارت الأب
    <div className="flex flex-col gap-3 p-3">
      
      {/* Main Image Container */}
      {/* حطينا كلاس group عشان نقدر نتحكم في الصورة اللي جواها لما نعمل hover */}
      <div className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
        <Image
          src={mainImage}
          alt="Vehicle Preview"
          fill
          // ضفنا scale-105 مع transition طويل عشان تعمل زووم ناعم جداً
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority // Loads this image faster for better LCP
        />
      </div>

      {/* Thumbnails List (Only render if there is more than 1 image) */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide px-1">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setMainImage(img);
              }}
              className={cn(
                "relative h-20 w-28 sm:h-24 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300",
                mainImage === img
                  ? "ring-2 ring-blue-600 ring-offset-2 shadow-md scale-100" // الحالة النشطة: رينج أزرق مع أوفسيت
                  : "opacity-60 hover:opacity-100 hover:scale-105 hover:shadow-sm grayscale-[20%] hover:grayscale-0" // الحالة العادية: بهتانه شوية ولما تلمسها تنور
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${String(index)}`} // حولنا الرقم لنص صراحةً
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