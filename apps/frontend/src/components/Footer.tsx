"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram ,  faLinkedinIn, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const footerSections = [
  {
    title: "Top Categories",
    links: [
      { label: "Face Care", href: "/category/face-care" },
      { label: "Hair Care", href: "/category/hair-care" },
      { label: "Body Care", href: "/category/body-care" },
      { label: "Combos", href: "/category/combos" },
      { label: "Mini Products", href: "/category/mini-products" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
      { label: "Shipping Policy", href: "/shipping" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Track Order", href: "/order-track" },
      { label: "Order History", href: "/order-history" },
      { label: "My Profile", href: "/profile" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Cart", href: "/cart" },
    ],
  },
];

export default function Footer() {
  return (
    <>
      <footer className="bg-[#8B543E] text-white px-5 sm:px-8 md:px-10 py-10 font-sans w-full overflow-x-hidden">

        <div className="max-w-[1200px] mx-auto">

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-bold">Pureastra</h2>

            <p className="my-4 text-sm md:text-base">
              Gentle, effective skincare inspired by nature and backed by care.
            </p>

            {/* SOCIAL */}
            <div className="mt-4 flex gap-4 text-lg">
              <a
                href="https://wa.me/919400206479"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
              </a>
              <a
                href="https://www.facebook.com/share/1Ho4ajBRTp/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a
                href="https://www.instagram.com/pureastra.in?igsh=aWExMTVwamJraWNx"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a
                href="https://www.linkedin.com/company/pureastra/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
            </div>
          </div>

          {/* LINKS SECTIONS */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="mb-3 text-base md:text-lg font-semibold">
                {section.title}
              </h4>

              <ul className="space-y-2 text-sm text-[#f1f1f1] break-words">
                {section.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} prefetch={false} className="hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* CONTACT */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">

          <a href="mailto:support@pureastra.in" className="flex items-center gap-2 hover:underline">
            <FontAwesomeIcon icon={faEnvelope} />
            support@pureastra.in
          </a>

          <a href="tel:+919400206479" className="flex items-center gap-2 hover:underline">
            <FontAwesomeIcon icon={faPhone} />
            +91 94002 06479
          </a>

        </div>

        {/* COPYRIGHT */}
        <div className="mt-6 text-center text-xs sm:text-sm opacity-80">
          © 2026 Pureastra. All rights reserved.
        </div>

        </div>
      </footer>

      <a
        href="https://wa.me/919400206479"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110"
      >
        <FontAwesomeIcon icon={faWhatsapp} className="text-2xl" />
      </a>
    </>
  );
}
