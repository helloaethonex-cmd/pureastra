import Image from "next/image";

export default function Hero() {
  return (
    <section className="w-full">

      <div className="grid grid-cols-1 md:grid-cols-2 items-center">

        {/* LEFT SIDE */}
        <div className="order-2 md:order-1 px-5 sm:px-8 md:px-10 py-8 md:py-0">

          <h2 className="mb-3 text-[#7A4E3A] font-semibold 
            text-2xl sm:text-3xl md:text-[32px] leading-tight">
            Reveal Your Natural Glow
          </h2>

          <p className="mb-4 max-w-[400px] text-sm sm:text-base leading-relaxed">
            Gentle, natural skincare designed to cleanse, nourish, and protect
            your skin every day.
          </p>

          <button
            className="bg-[#5E2B15] text-white px-5 py-2.5 rounded transition-all duration-300
            hover:bg-[#819744] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5"
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

      </div>

    </section>
  );
}