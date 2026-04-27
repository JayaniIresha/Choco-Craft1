"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import type { Review } from "@/types/review.types";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="w-72 shrink-0 bg-white border border-stone-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow mx-3">
      <div className="flex items-center justify-between">
        <StarRow rating={review.rating} />
        <span className="text-xs text-amber-600 font-semibold">{review.rating}/5</span>
      </div>
      <p className="text-stone-600 text-sm leading-relaxed line-clamp-4 flex-1">
        {review.comment}
      </p>
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
        <span className="font-medium text-stone-600 truncate max-w-[60%]">
          {review.user?.name ?? "Anonymous"}
        </span>
        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    axios
      .get<{ reviews: Review[] }>("http://localhost:5001/api/reviews?limit=20")
      .then((res) => setReviews(res.data.reviews ?? []))
      .catch(() => {});
  }, []);

  if (!mounted || reviews.length === 0) return null;

  // Duplicate enough times to fill any screen width seamlessly
  const tiles = reviews.length < 4 ? [...reviews, ...reviews, ...reviews] : [...reviews, ...reviews];

  return (
    <section className="bg-stone-50 border-t border-stone-200 py-14 overflow-hidden">
      <div className="mb-10 text-center px-4">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">What Our Customers Say</h2>
        <p className="text-stone-500 text-sm">Real reviews from our chocolate lovers</p>
      </div>

      {/* Marquee track */}
      <div
        className="relative w-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-stone-50 to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-stone-50 to-transparent" />

        <div
          ref={trackRef}
          className="flex py-2"
          style={{
            animation: `marquee 40s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
            width: "max-content",
          }}
        >
          {tiles.map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
