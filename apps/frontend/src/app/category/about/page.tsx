import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeaf, faLightbulb, faHeart } from "@fortawesome/free-solid-svg-icons";

export default function AboutPage() {
  return (
    <section className="bg-[#FAF3E2] min-h-screen">

      {/* HERO */}
      <div className="relative h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center text-center px-4">
        <Image
          src="/img/about-banner.webp"
          alt="about banner"
          fill
          className="object-cover opacity-30"
        />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-[42px] font-bold text-[#8B543E]">
            About PureAstra
          </h1>
          <p className="text-[#7a5a4a] mt-2 text-xs sm:text-sm md:text-base">
            Gentle. Honest. Thoughtfully formulated skincare.
          </p>
        </div>
      </div>

      {/* BRAND STORY */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-14 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

        {/* TEXT */}
        <div className="order-2 md:order-1">
          <h2 className="text-xl sm:text-2xl md:text-[26px] font-semibold text-[#8B543E] mb-4">
            Our Story
          </h2>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            PureAstra was created with a clear purpose to develop skincare that is gentle, transparent, and thoughtfully formulated.
          </p>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            We believe many skincare products today focus only on quick results, sometimes overlooking how certain ingredients may irritate the skin.
          </p>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] leading-relaxed">
            Every formula is designed for daily use and crafted especially keeping Indian skin types in mind.
          </p>
        </div>

        {/* IMAGE */}
        <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-md">
          <Image
            src="/img/banner-2.webp"
            alt="brand"
            width={500}
            height={400}
            className="w-full h-[250px] sm:h-[300px] md:h-auto object-cover"
          />
        </div>
      </div>

      {/* MISSION / VISION */}
      <div className="bg-[#F5EFE9] py-10 md:py-14 px-4 sm:px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD */}
          {[ 
            { icon: faLeaf, title: "Our Mission", text: "To create skincare that is safe, gentle, and beneficial." },
            { icon: faLightbulb, title: "Our Vision", text: "To build a trusted brand rooted in honesty." },
            { icon: faHeart, title: "Our Promise", text: "Cruelty-free, toxin-conscious skincare." }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-[#8B543E] mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={item.icon} className="text-[#819744]" />
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}

        </div>
      </div>

      {/* FOUNDER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-14 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

        {/* IMAGE */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          <Image
            src="/img/founder.webp"
            alt="founder"
            width={500}
            height={400}
            className="w-full h-[250px] sm:h-[300px] md:h-auto object-cover"
          />
        </div>

        {/* TEXT */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-[26px] font-semibold text-[#8B543E] mb-4">
            Founder’s Note
          </h2>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            Hello, I’m Gauri Babu, the founder of PureAstra.
          </p>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            Pureastra began as a personal journey of understanding skincare ingredients.
          </p>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            This brand is also part of a larger dream to support meaningful causes.
          </p>

          <p className="text-sm md:text-[15px] text-[#3e2a1f] leading-relaxed">
            PureAstra is more than skincare it’s a journey of care and trust.
          </p>
        </div>
      </div>

    </section>
  );
}