"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faStar,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

export default function FaceCarePage() {
  const [activeFilter, setActiveFilter] = useState("All");

  // MULTI-OPEN ACCORDION
  const [openProduct, setOpenProduct] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);

  const filters = [
    "All",
    "Normal Skin",
    "Oily Skin",
    "Combination Skin",
    "Sensitive Skin",
  ];

  const products = [
    {
      slug: "vitamin-c-face-wash",
      name: "Vitamin C Face wash",
      desc: "Rice Dewy Bright Face Wash With Rice Water & Niacinamide",
      price: "590",
      size: "100ml",
      img: "/img/banner-1.png",
      type: "Oily Skin",
      tag: "Trending",
      rating: 4.5,
    },
    {
      slug: "rice-cleanser",
      name: "Rice Cleanser",
      desc: "Hydrating cleanser for soft glowing skin",
      price: "499",
      size: "100ml",
      img: "/img/banner-2.png",
      type: "Normal Skin",
      tag: "Bestseller",
      rating: 4.4,
    },
    {
      slug: "aloe-face-wash",
      name: "Aloe Face Wash",
      desc: "Soothing aloe cleanser for sensitive skin",
      price: "549",
      size: "100ml",
      img: "/img/banner-3.png",
      type: "Sensitive Skin",
      rating: 4.2,
    },
    {
      slug: "glow-cleanser",
      name: "Glow Cleanser",
      desc: "Instant glow face wash with herbal extracts",
      price: "599",
      size: "100ml",
      img: "/img/routine-1.png",
      type: "Combination Skin",
      tag: "Trending",
      rating: 4.6,
    },
    {
      slug: "hydra-face-wash",
      name: "Hydra Face Wash",
      desc: "Deep hydration cleanser for dry skin",
      price: "520",
      size: "100ml",
      img: "/img/routine-2.png",
      type: "Normal Skin",
      rating: 4.3,
    },
    {
      slug: "daily-glow-wash",
      name: "Daily Glow Wash",
      desc: "Daily use cleanser for radiant skin",
      price: "480",
      size: "100ml",
      img: "/img/routine-3.png",
      type: "Oily Skin",
      rating: 4.1,
    },
  ];

  const handleAddToCart = (product: any) => {
    console.log("Added to cart:", product);
    alert(`${product.name} added to cart`);
  };

  const filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.type === activeFilter);

  return (
    <section className="bg-[#FAF3E2] min-h-screen px-6 md:px-12 py-10">

      {/* TITLE */}
      <h1 className="text-center text-[32px] font-bold font-['Roboto',serif] text-[#9E6E5B] mb-6">
        Face wash
      </h1>

      {/* TOP FILTER */}
      <div className="flex justify-center gap-4 flex-wrap mb-10">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`px-5 py-2 rounded-full text-sm font-['Poppins']
              ${
                activeFilter === item
                  ? "bg-[#819744] text-white"
                  : "bg-[#EFE6D8] text-[#5E2B15] shadow-sm hover:bg-[#e4d7c4]"
              }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-[250px_1fr] gap-8 max-lg:grid-cols-1">

        {/* SIDEBAR ACCORDION */}
        <div className="bg-white p-5 rounded-xl shadow-sm h-fit">

          {/* PRODUCT TYPE */}
          <div>
            <div
              onClick={() => setOpenProduct(!openProduct)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">SHOP BY PRODUCT TYPE</h3>

              <FontAwesomeIcon
                icon={openProduct ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm transition-transform duration-300"
              />
            </div>

            {openProduct && (
              <ul className="mt-4 space-y-3 text-sm max-h-[180px] overflow-y-auto pr-2">
                <li className="cursor-pointer hover:text-[#819744]">Face Wash</li>
                <li className="cursor-pointer hover:text-[#819744]">Face Serum</li>
                <li className="cursor-pointer hover:text-[#819744]">Face Mask</li>
                <li className="cursor-pointer hover:text-[#819744]">Face Cream</li>
                <li className="cursor-pointer hover:text-[#819744]">Moisturizer</li>
              </ul>
            )}
          </div>

          {/* DIVIDER */}
          <div className="border-t my-5"></div>

          {/* PRICE */}
          <div>
            <div
              onClick={() => setOpenPrice(!openPrice)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRICE</h3>

              <FontAwesomeIcon
                icon={openPrice ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm transition-transform duration-300"
              />
            </div>

            {openPrice && (
              <ul className="mt-4 space-y-3 text-sm">
                <li className="cursor-pointer hover:text-[#819744]">₹ 200 - ₹ 500</li>
                <li className="cursor-pointer hover:text-[#819744]">₹ 500 - ₹ 1000</li>
              </ul>
            )}
          </div>

        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filteredProducts.map((product) => (
            <div
              key={product.slug}
              className="relative rounded-[16px] overflow-hidden group bg-[#D9D9D9]"
            >
              {/* TAG */}
              {product.tag && (
                <div className="absolute top-3 left-3 bg-[#9333ea] text-white text-[10px] px-2 py-1 rounded-full z-10">
                  {product.tag}
                </div>
              )}

              {/* IMAGE */}
              <Link href={`/product/${product.slug}`}>
                <Image
                  src={product.img}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-[260px] object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                />
              </Link>

            
              {/* OVERLAY */}
                <div className="absolute bottom-0 left-0 right-0 
                bg-black/15 backdrop-blur-md 
                p-4 text-white 
                rounded-b-[16px] transition-all duration-300 group-hover:bg-black/25"
                >
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">
                    {product.name}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-[#F59E0B]">
                    <FontAwesomeIcon icon={faStar} />
                    {product.rating}
                    </div>
                </div>

                <p className="text-xs mt-1 opacity-90 line-clamp-2">
                    {product.desc}
                </p>

                <div className="flex justify-between text-xs mt-2">
                    <span>{product.size}</span>
                    <span>₹ {product.price}</span>
                </div>
                </div>

              {/* CART BUTTON */}
              <button
                onClick={() => handleAddToCart(product)}
                className="absolute top-3 right-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition"
              >
                <FontAwesomeIcon icon={faCartShopping} className="text-[#819744]" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}