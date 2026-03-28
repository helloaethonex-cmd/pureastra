import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeaf, faLightbulb, faHeart } from "@fortawesome/free-solid-svg-icons";

export default function AboutPage() {
  return (
    <section className="bg-[#FAF3E2] min-h-screen">

      {/* HERO SECTION */}
      <div className="relative h-[300px] flex items-center justify-center text-center">
        <Image
          src="/img/about-banner.png"
          alt="about banner"
          fill
          className="object-cover opacity-30"
        />

        <div className="relative z-10">
          <h1 className="text-[42px] font-bold text-[#5E2B16]">
            About PureAstra
          </h1>
          <p className="text-[#7a5a4a] mt-2 text-sm">
            Gentle. Honest. Thoughtfully formulated skincare.
          </p>
        </div>
      </div>

      {/*  BRAND STORY */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-2 gap-10 items-center">

        <div>
          <h2 className="text-[26px] font-semibold text-[#5E2B16] mb-4">
            Our Story
          </h2>

          <p className="text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            PureAstra was created with a clear purpose to develop skincare that is gentle, transparent, and thoughtfully formulated.
          </p>

          <p className="text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            We believe many skincare products today focus only on quick results, sometimes overlooking how certain ingredients may irritate the skin. PureAstra takes a different approach with plant-based ingredients and a philosophy centered on balance and comfort.
          </p>

          <p className="text-[15px] text-[#3e2a1f] leading-relaxed">
            Every formula is designed for daily use and crafted especially keeping Indian skin types in mind.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-md">
          <Image
            src="/img/banner-2.png"
            alt="brand"
            width={500}
            height={400}
            className="w-full object-cover"
          />
        </div>
      </div>

      {/*  MISSION / VISION */}
      <div className="bg-[#F0EADC] py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#5E2B16] mb-2">
                <FontAwesomeIcon icon={faLeaf} className="text-[#819744]" /> Our Mission
            </h3>
            <p className="text-sm text-gray-600">
              To create skincare that is safe, gentle, and truly beneficial for everyday use.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#5E2B16] mb-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-[#819744]" /> Our Vision
            </h3>
            <p className="text-sm text-gray-600">
              To build a trusted skincare brand rooted in honesty and transparency.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#5E2B16] mb-2">
                <FontAwesomeIcon icon={faHeart} className="text-[#819744]" /> Our Promise
            </h3>
            <p className="text-sm text-gray-600">
              Cruelty-free, toxin-conscious, and made with care for your skin.
            </p>
          </div>

        </div>
      </div>

      {/* FOUNDER SECTION */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-2 gap-10 items-center">

        <div className="rounded-2xl overflow-hidden shadow-md">
          <Image
            src="/img/founder.png"
            alt="founder"
            width={500}
            height={400}
            className="w-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-[26px] font-semibold text-[#5E2B16] mb-4">
            Founder’s Note
          </h2>

          <p className="text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            Hello, I’m Gauri Babu, the founder of PureAstra.
          </p>

          <p className="text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            PureAstra began as a personal journey of understanding skincare ingredients and how they interact with the skin. The goal was to create products that feel gentle, honest, and effective.
          </p>

          <p className="text-[15px] text-[#3e2a1f] mb-4 leading-relaxed">
            This brand is also part of a larger dream to support meaningful causes like helping cancer patients through future initiatives.
          </p>

          <p className="text-[15px] text-[#3e2a1f] leading-relaxed">
            PureAstra is more than skincare it’s a journey of care, trust, and confidence.
          </p>
        </div>
      </div>

    </section>
  );
}