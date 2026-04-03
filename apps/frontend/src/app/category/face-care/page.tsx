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
  const [openProduct, setOpenProduct] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);

  const filters = [
    "All",
    "Normal Skin",
    "Oily Skin",
    "Combination Skin",
    "Sensitive Skin",
  ];

  //  KEEP YOUR LOCAL PRODUCTS (NO CHANGE)
  const products = [
    {
      slug: "vitamin-c-face-wash",
      name: "Vitamin C Face wash",
      desc: "Rice Dewy Bright Face Wash With Rice Water & Niacinamide",
      price: 590,
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
      price: 499,
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
      price: 549,
      size: "100ml",
      img: "/img/banner-3.png",
      type: "Sensitive Skin",
      rating: 4.2,
    },
    {
      slug: "glow-cleanser",
      name: "Glow Cleanser",
      desc: "Instant glow face wash with herbal extracts",
      price: 599,
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
      price: 520,
      size: "100ml",
      img: "/img/routine-2.png",
      type: "Normal Skin",
      rating: 4.3,
    },
    {
      slug: "daily-glow-wash",
      name: "Daily Glow Wash",
      desc: "Daily use cleanser for radiant skin",
      price: 480,
      size: "100ml",
      img: "/img/routine-3.png",
      type: "Oily Skin",
      rating: 4.1,
    },
  ];

  //  FILTER LOGIC
  const filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.type === activeFilter);

  // CART FUNCTION
  const handleAddToCart = (product: any) => {
    alert(`${product.name} added to cart`);
  };

  return (
    <section className="bg-[#F5F0E6] min-h-screen px-4 md:px-10 py-10">

      {/* TITLE */}
      <h1 className="text-center text-[28px] md:text-[32px] font-bold text-[#9E6E5B] mb-8">
        Face wash
      </h1>

      {/* FILTER BUTTONS */}
      <div className="flex justify-center gap-3 flex-wrap mb-10">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              activeFilter === item
                ? "bg-[#819744] text-white"
                : "bg-[#EFE6D8] text-[#5E2B15] hover:bg-[#e4d7c4]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        {/* SIDEBAR */}
        <div className="bg-white/20 p-5 rounded-2xl shadow-lg">

          <h2 className="font-semibold text-[#5E2B15] mb-4">Filters</h2>

          {/* PRODUCT TYPE */}
          <div>
            <div
              onClick={() => setOpenProduct(!openProduct)}
              className="flex justify-between cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRODUCT TYPE</h3>
              <FontAwesomeIcon icon={openProduct ? faChevronUp : faChevronDown} />
            </div>

            {openProduct && (
              <ul className="mt-4 space-y-2 text-sm">
                {["Face Wash", "Face Serum", "Face Mask"].map((item) => (
                  <li key={item}>
                    <input type="checkbox" /> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t my-5" />

          {/* PRICE */}
          <div>

            {/* HEADER */}
            <div
              onClick={() => setOpenPrice(!openPrice)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRICE</h3>
              <FontAwesomeIcon
                icon={openPrice ? faChevronUp : faChevronDown}
              />
            </div>

            {/* CONTENT */}
            {openPrice && (
              <ul className="mt-4 space-y-3 text-sm pl-1">
                
                <li className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-[#5E2B15] w-4 h-4"
                  />
                  ₹200 - ₹500
                </li>

                <li className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-[#5E2B15] w-4 h-4"
                  />
                  ₹500 - ₹1000
                </li>

              </ul>
            )}

          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredProducts.map((product) => (
            <Link key={product.slug} href={`/product/${product.slug}`}>

              <div className="relative rounded-2xl overflow-hidden bg-white/20 shadow-lg hover:scale-[1.03] transition cursor-pointer">

                {/* TAG */}
                {product.tag && (
                  <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full z-10">
                    {product.tag}
                  </div>
                )}

                {/* IMAGE */}
                <Image
                  src={product.img}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-[220px] md:h-[260px] object-cover"
                />

                {/* CART */}
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    handleAddToCart(product);
                  }}
                  className="absolute top-3 right-3 bg-white/70 backdrop-blur-md rounded-full w-9 h-9 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faCartShopping} className="text-[#819744]" />
                </button>

                {/* DETAILS */}
                <div className="absolute bottom-0 w-full bg-black/40 text-white p-4">

                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">{product.name}</h3>

                    <div className="flex items-center gap-1 text-xs">
                      <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                      {product.rating}
                    </div>
                  </div>

                  <p className="text-xs mt-1 line-clamp-2">
                    {product.desc}
                  </p>

                  <div className="flex justify-between text-xs mt-2">
                    <span>{product.size}</span>
                    <span>₹{product.price}</span>
                  </div>

                </div>

              </div>

            </Link>
          ))}

        </div>
      </div>
    </section>
  );
}