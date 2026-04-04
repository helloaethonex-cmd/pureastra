"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faDatabase,
  faUserShield,
  faCookie,
} from "@fortawesome/free-solid-svg-icons";

const faqs = [
  {
    q: "What personal information do you collect?",
    a: "We collect your name, email address, phone number, and delivery address when you place an order. We may also collect browsing data through cookies to improve your experience.",
  },
  {
    q: "Is my payment information stored?",
    a: "No. All payments are processed through a secure third-party payment gateway. We do not store or have access to your card or UPI details.",
  },
  {
    q: "Do you share my data with third parties?",
    a: "We only share your information with authorised partners such as courier services and payment processors — strictly for fulfilling your order. We never sell your data.",
  },
  {
    q: "How long do you keep my data?",
    a: "We retain your data for as long as needed to process your orders, provide support, and meet legal obligations. You can request deletion at any time by contacting us.",
  },
  {
    q: "Can I opt out of marketing emails?",
    a: "Yes. You can unsubscribe from our marketing communications at any time using the unsubscribe link in any email we send.",
  },
];

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5C4A4A]">
          Your privacy matters to us. Here is exactly how we collect, use, and protect your personal information when you shop with Pureastra.
        </p>
      </motion.div>

      {/* Policy Cards */}
      <div className="max-w-5xl mx-auto space-y-8">
        {[
          {
            icon: faDatabase,
            title: "Information We Collect",
            points: [
              "Name, email address, phone number, and delivery address when you place an order.",
              "Payment details handled exclusively by our secure third-party payment gateway.",
              "Browsing behaviour and preferences via cookies to improve your shopping experience.",
              "Any communication you send us through email, WhatsApp, or contact forms.",
            ],
          },
          {
            icon: faLock,
            title: "How We Use Your Information",
            points: [
              "To process, confirm, and deliver your orders.",
              "To send order updates, tracking information, and support responses.",
              "To send promotional offers if you have opted in — you can unsubscribe anytime.",
              "To improve our website, products, and overall customer experience.",
              "We never sell your personal information to any third party.",
            ],
            highlight: "Your data is used only to serve you better. We do not sell or misuse your information under any circumstances.",
          },
          {
            icon: faUserShield,
            title: "How We Protect Your Data",
            points: [
              "All data is stored on secure servers with restricted access.",
              "Payments are processed through SSL-encrypted, PCI-compliant gateways.",
              "We do not store your card numbers, UPI IDs, or banking credentials.",
              "Access to customer data is limited to authorised personnel only.",
            ],
          },
          {
            icon: faCookie,
            title: "Cookies and Tracking",
            points: [
              "We use cookies to remember your preferences and improve site performance.",
              "Analytics tools help us understand how visitors use our website.",
              "No personal identity is exposed through our analytics data.",
              "You can disable cookies through your browser settings at any time.",
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
            Have a question about your data?
          </p>
          <a
            href="mailto:support@pureastra.com"
            className="inline-block bg-[#8B543E] hover:bg-[#6f3f2d] text-white px-6 py-2 rounded-full text-sm transition"
          >
            Contact Support
          </a>
        </div>
      </div>

      <div className="text-center mt-16 text-xs text-[#7A6A6A]">
        Last updated: {new Date().getFullYear()}
      </div>
    </section>
  );
}