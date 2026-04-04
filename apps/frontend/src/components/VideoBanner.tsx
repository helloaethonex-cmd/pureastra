"use client";

export default function VideoBanner() {
  return (
    <section className="w-full h-[500px] overflow-hidden relative">
      <video
        className="w-full h-full object-cover"
        src="/video/banner.mp4"
        poster="/img/thumb.png"
        preload="metadata"
        autoPlay
        loop
        muted
        playsInline
      />
    </section>
  );
}
