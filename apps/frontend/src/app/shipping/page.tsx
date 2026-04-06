"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faTruck,
  faLocationDot,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Orders are processed within 1 to 2 business days, and delivery typically takes 5 to 7 business days depending on your location and courier service.",
  },
  {
    q: "How can I track my order?",
    a: "Tracking details will be shared via SMS, email, or WhatsApp once your order is shipped.",
  },
  {
    q: "Do you deliver across India?",
    a: "Yes, we deliver pan-India through trusted courier partners including Blue Dart, Delhivery, and other reliable regional agencies.",
  },
  {
    q: "What if my order is delayed?",
    a: "Delays can occasionally occur due to courier issues, weather, or public holidays. We are not liable for such delays but will keep you informed with tracking updates.",
  },
  {
    q: "What if my address was entered incorrectly?",
    a: "Customers are responsible for providing accurate delivery addresses. Pureastra is not liable for delays or failed deliveries caused by incorrect address details.",
  },
];

const sections = [
  {
    title: "Order Processing",
    icon: faBox,
    content: [
      "Orders are processed within 1 to 2 business days after payment confirmation.",
      "Sundays and public holidays are non-working days.",
      "You will receive an order confirmation email or message once your order is placed.",
      "Processing may be delayed in case of high order volume during sales or festive periods.",
    ],
  },
  {
    title: "Shipping and Delivery",
    icon: faTruck,
    content: [
      "Delivery typically takes 5 to 7 business days depending on your location.",
      "We partner with trusted couriers such as Blue Dart, Delhivery, and regional agencies.",
      "Tracking information will be shared once your order is dispatched.",
      "Pureastra is not responsible for delays caused by courier partners, weather, or natural events.",
    ],
    highlight:
      "Make sure your delivery address and phone number are accurate to avoid any delays.",
  },
  {
    title: "Delivery Address",
    icon: faLocationDot,
    content: [
      "Customers are responsible for providing a complete and accurate delivery address.",
      "Any failed deliveries due to incorrect or incomplete addresses are not our liability.",
      "If your order is returned due to address issues, reshipping charges may apply.",
      "Please include a landmark wherever possible to help the courier locate you easily.",
    ],
  },
  {
    title: "Delivery Confirmation",
    icon: faCircleCheck,
    content: [
      "You will receive a delivery confirmation notification once the order is marked delivered.",
      "Please inspect your package upon receipt and report any damage within 48 hours.",
      "If someone else received the order on your behalf, please collect it promptly.",
      "Pureastra is not responsible for packages left unattended after delivery confirmation.",
    ],
  },
];

export default function ShippingPolicy() {
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
          Shipping Policy
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base font-['Poppins']text-[#5C4A4A]">
          We are committed to delivering your orders safely and quickly. Here is
          everything you need to know about how we ship.
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
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition bg-linear-to-r from-[#819744]/10 via-[#8B543E]/10 to-transparent blur-xl" />

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
            Have a question about your shipment?
          </p>
          <a
            href="mailto:support@pureastra.com"
            className="inline-block bg-[#8B543E] hover:bg-[#6f3f2d] text-white px-6 py-2 rounded-full text-sm transition"
          >
            Contact Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-16 text-xs text-[#7A6A6A]">
        Last updated: {new Date().getFullYear()}
      </div>
    </section>
  );
}
