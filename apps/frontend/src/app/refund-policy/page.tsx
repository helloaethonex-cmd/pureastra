"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateLeft,
  faCircleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp as faWhatsappBrand } from "@fortawesome/free-brands-svg-icons";

const faqs = [
  {
    q: "Do you offer refunds?",
    a: "We do not offer monetary refunds. If you receive a damaged or defective product, we replace it free of cost after verification.",
  },
  {
    q: "What counts as a damaged product?",
    a: "A product is considered damaged if it arrives broken, leaking, or clearly defective. Minor variations in scent, texture, or color due to natural ingredients are normal and are not considered defects.",
  },
  {
    q: "How do I request a replacement?",
    a: "Share a clear photo or video of the damaged product via WhatsApp within 48 hours of delivery. Our team will review and respond within 1–2 business days.",
  },
  {
    q: "How long does the replacement take?",
    a: "Once your claim is verified, the replacement will be shipped and delivered within 7–14 business days.",
  },
  {
    q: "Can I get a refund if I ordered the wrong product?",
    a: "Orders placed are final. Please review your cart carefully before checkout. We are unable to process a refund or exchange for wrong orders placed by the customer.",
  },
];

export default function RefundPolicy() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="bg-linear-to-b from-[#FAF3E2] via-[#F5EFE9] to-[#FAF3E2] px-6 md:px-16 py-20 text-[#3B2F2F]">

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h1 className="text-3xl md:text-5xl font-['Marko_One',serif] text-[#8B543E] mb-4">
          Refund Policy
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5C4A4A]">
          We stand behind every product we make. Here is everything you need to know about how we handle refunds and replacements.
        </p>
      </motion.div>

      {/* Policy Cards */}
      <div className="max-w-5xl mx-auto space-y-8">

        {[
          {
            icon: faRotateLeft,
            title: "Our Refund Approach",
            points: [
              "We do not offer monetary refunds for any order.",
              "Replacements are provided for verified damaged or defective products only.",
              "Replacements match the original product ordered.",
              "The replacement policy does not apply to products mishandled after delivery.",
            ],
          },
          {
            icon: faCircleExclamation,
            title: "How to Raise a Replacement Request",
            points: [
              "Inspect your order carefully once it arrives.",
              "If the product is damaged, record a clear unboxing video or photograph as proof.",
              "Contact us via WhatsApp within 48 hours of receiving the order.",
              "Our team will verify the claim and confirm the replacement within 1–2 business days.",
              "Replacements are shipped and typically delivered within 7–14 business days.",
            ],
            highlight: "Claims raised after 48 hours of delivery will not be accepted. Please check your order as soon as it arrives.",
          },
          {
            icon: faXmark,
            title: "What Is Not Covered",
            points: [
              "Products damaged by the customer after delivery.",
              "Incorrect orders placed by the customer.",
              "Minor variation in color, texture, or scent due to natural ingredients.",
              "Products purchased outside our official website.",
              "Skin reactions caused by individual sensitivities or allergies.",
            ],
          },
        ].map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-[#E6D5C3] hover:border-[#8B543E]/30 shadow-sm hover:shadow-md transition"
          >
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition bg-linear-to-r from-[#819744]/10 via-[#8B543E]/10 to-transparent blur-xl" />

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <FontAwesomeIcon icon={section.icon} className="text-[#819744] text-lg" />
              <h2 className="text-lg font-semibold text-[#8B543E]">{section.title}</h2>
            </div>

            <ul className="space-y-2 text-sm leading-6 relative z-10">
              {section.points.map((point, idx) => (
                <li key={idx}>• {point}</li>
              ))}
            </ul>

            {section.highlight && (
              <div className="mt-4 bg-[#F5EFE9] border-l-4 border-[#8B543E] p-4 rounded-md text-sm relative z-10">
                {section.highlight}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-5xl mx-auto mt-20">
        <h2 className="text-2xl md:text-3xl font-['Marko_One',serif] text-center text-[#8B543E] mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((item, index) => {
            const isOpen = active === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? "bg-[#F5EFE9] border-[#8B543E]/40 shadow-sm"
                    : "bg-white/60 border-[#E6D5C3] hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setActive(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-5"
                >
                  <span className="text-sm md:text-base font-medium">{item.q}</span>
                  <span
                    className={`text-[#819744] text-xl transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-[#5C4A4A] leading-6">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-sm text-[#6B5B5B] mb-3">
            Got a damaged product? We are here to help.
          </p>
          <a
            href="https://wa.me/919400206479"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#8B543E] hover:bg-[#6f3f2d] text-white px-6 py-2 rounded-full text-sm transition"
          >
            <FontAwesomeIcon icon={faWhatsappBrand} className="mr-2" />
            Contact via WhatsApp
          </a>
        </div>
      </div>

      <div className="text-center mt-16 text-xs text-[#7A6A6A]">
        Last updated: {new Date().getFullYear()}
      </div>
    </section>
  );
}
