"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCircleExclamation,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

const faqs = [
  {
    q: "Can I cancel my order after placing it?",
    a: "Once an order is confirmed and payment is made, cancellation is not possible. Your order enters processing immediately to ensure fast dispatch.",
  },
  {
    q: "What if I made a mistake in my order?",
    a: "Please double-check your cart, address, and product selections before confirming your order. We are unable to make changes or cancel orders once they are placed.",
  },
  {
    q: "What if I want to cancel because of a delay?",
    a: "Shipping delays can occasionally happen due to courier partners or unforeseen events. We are unable to cancel orders on account of shipping delays, but we will keep you informed with tracking details.",
  },
  {
    q: "Will I be charged if my order is cancelled by Pureastra?",
    a: "On rare occasions, we may cancel an order due to stock unavailability or payment issues. In such cases, a full refund will be processed to your original payment method within 5–7 business days.",
  },
  {
    q: "Can I cancel a bulk or combo order?",
    a: "No, bulk and combo orders are also non-cancellable once confirmed.",
  },
];

export default function CancellationPolicy() {
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
          Cancellation Policy
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#5C4A4A]">
          We process orders quickly to get your products to you as fast as possible. Please read our cancellation terms before placing an order.
        </p>
      </motion.div>

      {/* Policy Cards */}
      <div className="max-w-5xl mx-auto space-y-8">

        {[
          {
            icon: faBan,
            title: "No Cancellations After Order Confirmation",
            points: [
              "Orders cannot be cancelled once payment is confirmed.",
              "Processing begins immediately after an order is placed.",
              "This applies to all product types, including combos and bulk orders.",
              "Please review your items, address, and quantities carefully before placing your order.",
            ],
            highlight: "We strongly recommend reviewing your order before confirming payment, as all sales are final.",
          },
          {
            icon: faCircleExclamation,
            title: "Cancellation by Pureastra",
            points: [
              "We reserve the right to cancel orders in case of stock unavailability.",
              "Orders identified as fraudulent or suspicious may be cancelled without notice.",
              "Pricing errors or technical issues may also result in order cancellation.",
              "You will be notified promptly, and a full refund will be processed within 5–7 business days.",
            ],
          },
          {
            icon: faShieldHalved,
            title: "Your Order Is Secure",
            points: [
              "All payments are processed through a secure, encrypted payment gateway.",
              "You will receive an order confirmation and invoice via email after payment.",
              "Tracking details will be shared once your order is dispatched.",
              "If you have any concerns, please reach out to our support team immediately.",
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
            Still have questions about your order?
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
