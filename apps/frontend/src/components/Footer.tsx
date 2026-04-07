"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#8B543E] text-white px-5 sm:px-8 md:px-10 py-10 font-sans">

      <div className="max-w-[1200px] mx-auto">

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-bold">Pureastra</h2>

            <p className="my-4 text-sm md:text-base">
              Sign up to get 10% off on your first order
            </p>

            {/* EMAIL */}
            <div className="flex bg-white/10 rounded-full overflow-hidden w-full max-w-[300px]">
              <input
                type="email"
                placeholder="E-mail"
                className="px-4 py-2 flex-1 bg-transparent text-white outline-none placeholder:text-[#ddd]"
              />
              <button className="w-12 flex items-center justify-center bg-white/20">
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>

            {/* SOCIAL */}
            <div className="mt-4 flex gap-4 text-lg">
              <a href="#" className="hover:scale-110 transition">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="hover:scale-110 transition">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>

          {/* LINKS SECTIONS */}
          {[
            {
              title: "Top Categories",
              links: ["Face Care", "Hair Care", "Body Care", "Combos", "Mini Products"],
            },
            {
              title: "Policies",
              links: ["Terms & Conditions", "Privacy Policy", "Refund Policy", "Cancellation Policy", "Shipping Policy"],
            },
            {
              title: "Best Sellers",
              links: ["Vitamin C Face Wash", "Brightening Serum", "Hair Growth Oil", "Face Mask"],
            },
            {
              title: "Info",
              links: ["About Us", "Contact Us", "Track Order", "Blogs", "Careers"],
            },
          ].map((section, idx) => (
            <div key={idx}>
              <h4 className="mb-3 text-base md:text-lg font-semibold">
                {section.title}
              </h4>

              <ul className="space-y-2 text-sm text-[#f1f1f1]">
                {section.links.map((item, i) => (
                  <li key={i} className="hover:underline cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* CONTACT */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">

          <p className="flex items-center gap-2">
            <FontAwesomeIcon icon={faEnvelope} />
            support@pureastra.com
          </p>

          <p className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPhone} />
            +91 94002 06479
          </p>

        </div>

        {/* COPYRIGHT */}
        <div className="mt-6 text-center text-xs sm:text-sm opacity-80">
          © 2026 Pureastra. All rights reserved.
        </div>

      </div>
    </footer>
  );
}