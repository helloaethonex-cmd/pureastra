"use client";

export default function VideoBanner() {
  return (
    <section
      className="
        w-full overflow-hidden relative
        
        h-[220px] 
        sm:h-[260px] 
        md:h-[350px] 
        lg:h-[500px]
      "
    >
      <video
        className="
          w-full h-full 
          object-contain 
          md:object-cover 
          object-center
          
        "
        src="/video/banner.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </section>
  );
}