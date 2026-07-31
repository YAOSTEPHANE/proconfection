"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  productName: string;
  images: string[];
};

export default function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const safeImages = useMemo(() => (images.length > 0 ? images : ["/logo-proconfection.png"]), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f8f7f5]">
        <Image
          src={safeImages[activeIndex]}
          alt={productName}
          width={900}
          height={1200}
          className="h-full w-full object-contain object-center"
          priority
        />
      </div>

      {safeImages.length > 1 ? (
        <div className="grid grid-cols-3 gap-2">
          {safeImages.map((imageUrl, index) => (
            <button
              key={`${productName}-thumb-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-lg border-2 bg-[#f8f7f5] ${
                index === activeIndex ? "border-violet-500" : "border-transparent"
              }`}
              aria-label={`Voir image ${index + 1}`}
            >
              <Image
                src={imageUrl}
                alt={`${productName} vue ${index + 1}`}
                width={400}
                height={500}
                className="aspect-[3/4] h-auto w-full object-contain object-center"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
