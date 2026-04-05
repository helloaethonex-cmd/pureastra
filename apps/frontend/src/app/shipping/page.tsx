"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faCreditCard,
  faTruck,
  faRotateLeft,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

export default function ShippingPolicy() {
  const [active, setActive] = useState<number | null>(null);

  const faqs = [
    {
      q: "How long does delivery take?",
      a: "Orders are processed within 1–2 business days, and delivery typically takes 5–7 business days depending on your location and courier service.",
    },
    {
      q: "Can I cancel my order?",
      a: "Once an order is placed, cancellation is not allowed as processing begins immediately.",
    },
    {
      q: "How can I track my order?",
      a: "Tracking details will be shared via SMS, email, or WhatsApp once your order is shipped.",
    },
    {
      q: "What if I receive a damaged product?",
      a: "Please share proof within 48 hours. Verified cases are replaced within 7–14 days.",
    },
    {
      q: "Do you offer refunds?",
      a: "No refunds are provided. Only replacements are available for verified damaged products.",
    },
  ];

  const sections = [
    {
      title: "Order Processing",
      icon: faBox,
      content: [
        "Orders are processed within 1–2 business days.",
        "Sundays and public holidays are non-working days.",
        "Orders cannot be cancelled once placed.",
        "Orders may be declined due to stock or suspicious activity.",
      ],
    },
    {
      title: "Pricing & Payments",
      icon: faCreditCard,
      content: [
        "Prices are in INR (₹) including taxes.",
        "Only secure online payments are accepted.",
        "Provide accurate billing and shipping details.",
        "Payments are final — no refunds except damaged items.",
      ],
    },
    {
      title: "Shipping & Delivery",
      icon: faTruck,
      content: [
        "Orders are delivered within 5–7 business days.",
        "Delivery timelines may vary slightly based on your location.",
        "Tracking details are shared after dispatch.",
        "Delays due to courier or weather conditions are not our responsibility.",
        "Incorrect address may cause delivery issues.",
      ],
      highlight:
        "Ensure your address & phone number are correct to avoid delays.",
    },
    {
      title: "Returns & Replacements",
      icon: faRotateLeft,
      content: [
        "Only damaged/defective products are eligible.",
        "Proof required within 48 hours.",
        "Replacement in 7–14 days.",
        "No refunds — only replacements.",
      ],
    },
  ];

  return (
    <section className="bg-gradient-to-b from-[#FAF3E2] via-[#F5EFE9] to-[#FAF3E2] px-6 md:px-16 py-20 text-[#3B2F2F]">

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h1 className="text-3xl md:text-5xl font-['Marko_One',serif] text-[#8B543E] mb-4">
          Shipping & Delivery
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base font-['Poppins']text-[#5C4A4A]">
          We are committed to delivering your orders safely, quickly, and efficiently.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto space-y-8">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-[#E6D5C3] hover:border-[#8B543E]/30 shadow-sm hover:shadow-md transition"
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition bg-gradient-to-r from-[#819744]/10 via-[#8B543E]/10 to-transparent blur-xl"></div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <FontAwesomeIcon
                icon={section.icon}
                className="text-[#819744] text-lg"
              />
              <h2 className="text-lg font-semibold text-[#8B543E]">
                {section.title}
              </h2>
            </div>

            <ul className="space-y-2 text-sm leading-6 relative z-10">
              {section.content.map((item, idx) => (
                <li key={idx}>• {item}</li>
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
          <FontAwesomeIcon icon={faCircleQuestion} className="mr-2 text-[#819744]" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((item, index) => {
            const isOpen = active === index;

            return (
              <div
                key={index}
                className={`rounded-xl border transition-all duration-300 
                ${
                  isOpen
                    ? "bg-[#F5EFE9] border-[#8B543E]/40 shadow-sm"
                    : "bg-white/60 border-[#E6D5C3] hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setActive(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-5"
                >
                  <span className="text-sm md:text-base font-medium">
                    {item.q}
                  </span>

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
            Still have questions?
          </p>
          <button className="bg-[#8B543E] hover:bg-[#6f3f2d] text-white px-6 py-2 rounded-full text-sm transition">
            Contact Support
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-16 text-xs text-[#7A6A6A]">
        Last updated: {new Date().getFullYear()}
      </div>
    </section>
  );
}