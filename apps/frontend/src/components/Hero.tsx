"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const connection = (
      "connection" in navigator ? (navigator as Navigator & { connection?: { saveData?: boolean } }).connection : undefined
    );
    if (connection?.saveData) return;

    const timer = window.setTimeout(() => {
      setShouldLoadVideo(true);
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* BACKGROUND VIDEO */}
      <video
        autoPlay={shouldLoadVideo}
        loop
        muted
        playsInline
        preload="none"
        poster="/img/banner-1.webp"
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        {shouldLoadVideo ? (
          <source src="/video/hero-banner.mp4" type="video/mp4" />
        ) : null}
      </video>

      {/* DARK OVERLAY (optional but recommended) */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h2
          className="mb-4 text-white font-semibold 
          text-2xl sm:text-3xl md:text-5xl leading-tight"
        >
          Reveal Your Natural Glow
        </h2>

        <p className="mb-6 max-w-[500px] text-white text-sm sm:text-base md:text-lg">
          Gentle, natural skincare designed to cleanse, nourish, and protect
          your skin every day.
        </p>

        <button
          className="bg-[#5E2B15] text-white px-6 py-3 rounded 
          transition-all duration-300 hover:bg-[#819744] hover:-translate-y-0.5"
        >
          Explore Collection
        </button>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="order-1 md:order-2 w-full">
        <Image
          src="/img/facewash.webp"
          alt="product"
          width={700}
          height={600}
          className="w-full h-[260px] sm:h-[350px] md:h-auto object-cover"
          priority
        />
      </div>
    </section>
  );
}
