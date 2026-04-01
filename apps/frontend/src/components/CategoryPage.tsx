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

type Product = {
  slug: string;
  name: string;
  desc: string;
  price: string;
  size: string;
  img: string;
  type?: string;
  tag?: string;
  rating: number;
};

export default function CategoryPage({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [openProduct, setOpenProduct] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);

  const filters = ["All", "Normal", "Oily", "Dry"];

  const filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.type === activeFilter);

  const handleAddToCart = (product: Product) => {
    alert(`${product.name} added to cart`);
  };

  return (
    <section className="bg-[#F5F0E6] min-h-screen px-4 md:px-10 py-10">

      {/* TITLE */}
      <h1 className="text-center text-[26px] sm:text-[30px] md:text-[32px] font-bold text-[#9E6E5B] mb-8">
        {title}
      </h1>

      {/* TOP FILTER */}
      <div className="flex justify-center gap-3 flex-wrap mb-10">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              activeFilter === item
                ? "bg-[#819744] text-white"
                : "bg-white/30 backdrop-blur-md border border-white/30 text-[#5E2B15] hover:bg-[#e4d7c4]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        {/* ================= SIDEBAR ================= */}
        <div className="backdrop-blur-md bg-white/20 border border-white/30 p-5 rounded-2xl shadow-lg h-fit">

          <h2 className="font-semibold text-[#5E2B15] mb-4 text-lg">
            Filters
          </h2>

          {/* PRODUCT TYPE */}
          <div>
            <div
              onClick={() => setOpenProduct(!openProduct)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRODUCT TYPE</h3>

              <FontAwesomeIcon
                icon={openProduct ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm"
              />
            </div>

            {openProduct && (
              <ul className="mt-4 space-y-3 text-sm">
                {["All Products", "Top Rated"].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 cursor-pointer hover:text-[#819744]"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#5E2B15]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* DIVIDER */}
          <div className="border-t my-5 border-white/30"></div>

          {/* PRICE */}
          <div>
            <div
              onClick={() => setOpenPrice(!openPrice)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRICE</h3>

              <FontAwesomeIcon
                icon={openPrice ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm"
              />
            </div>

            {openPrice && (
              <ul className="mt-4 space-y-3 text-sm">
                {["₹200 - ₹500", "₹500 - ₹1000"].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 cursor-pointer hover:text-[#819744]"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#5E2B15]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ================= PRODUCTS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {filteredProducts.map((product) => (
            <div
              key={product.slug}
              className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:scale-[1.03] transition"
            >

              {/* TAG */}
              {product.tag && (
                <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full z-10">
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
                  className="w-full h-[200px] sm:h-[230px] md:h-[260px] object-cover"
                />
              </Link>

              {/* CART BUTTON */}
              <button
                onClick={() => handleAddToCart(product)}
                className="absolute top-3 right-3 bg-white/70 backdrop-blur-md rounded-full w-9 h-9 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faCartShopping} className="text-[#819744]" />
              </button>

              {/* GLASS OVERLAY */}
              <div className="absolute bottom-0 left-0 w-full bg-white/20 backdrop-blur-md border-t border-white/20 text-white p-3 md:p-4">

                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 text-xs">
                    <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                    {product.rating}
                  </div>
                </div>

                <p className="text-xs mt-1 opacity-90 line-clamp-2">
                  {product.desc}
                </p>

                <div className="flex justify-between text-xs mt-2">
                  <span>{product.size}</span>
                  <span>₹{product.price}</span>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}