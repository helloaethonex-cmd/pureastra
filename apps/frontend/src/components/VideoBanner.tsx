"use client";

export default function VideoBanner() {
  return (
    <section className="w-full h-[500px] overflow-hidden relative">
      <video
        className="w-full h-full object-cover"
        src="/video/facewash-banner.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </section>
  );
}
