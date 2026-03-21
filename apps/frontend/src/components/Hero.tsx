import Image from "next/image";

export default function Hero() {
  return (
    <section>
      <div className="w-full">
        <div className="flex flex-wrap items-center">
          {/* LEFT SIDE */}
          <div className="w-full md:w-1/2 p-10">
            <h2 className="mb-3 text-[#7A4E3A] font-semibold text-[32px]">
              Reveal Your Natural Glow
            </h2>

            <p className="mb-4 max-w-[400px] leading-relaxed">
              Gentle, natural skincare designed to cleanse, nourish, and protect
              your skin every day.
            </p>

            <button
              className="bg-[#5E2B15] text-white px-5 py-[10px] border-none rounded cursor-pointer transition-all duration-300
                hover:bg-[#819744] hover:-translate-y-0.5 hover:shadow-[0_2px_0_#2e2e2e]
                active:translate-y-0.5"
            >
              Explore Collection
            </button>
          </div>

          {/* RIGHT SIDE IMAGE */}
          <div className="w-full md:w-1/2 p-0">
            <Image
              src="/img/facewash.png"
              alt="product"
              width={700}
              height={600}
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
