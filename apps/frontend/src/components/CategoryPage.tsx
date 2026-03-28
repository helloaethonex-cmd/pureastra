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

  return (
    <section className="bg-[#FAF3E2] min-h-screen px-6 md:px-12 py-10">

      {/* TITLE */}
      <h1 className="text-center text-[32px] font-bold text-[#9E6E5B] mb-6">
        {title}
      </h1>

      {/* FILTER */}
      <div className="flex justify-center gap-4 flex-wrap mb-10">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setActiveFilter(item)}
            className={`px-5 py-2 rounded-full text-sm ${
              activeFilter === item
                ? "bg-[#819744] text-white"
                : "bg-[#EFE6D8] text-[#5E2B15]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[250px_1fr] gap-8 max-lg:grid-cols-1">

        {/* SIDEBAR */}
        <div className="bg-white p-5 rounded-xl shadow-sm h-fit">

          {/* PRODUCT TYPE */}
          <div>
            <div
              onClick={() => setOpenProduct(!openProduct)}
              className="flex justify-between cursor-pointer"
            >
              <h3 className="text-sm font-semibold">SHOP BY PRODUCT TYPE</h3>
              <FontAwesomeIcon icon={openProduct ? faChevronUp : faChevronDown} />
            </div>

            {openProduct && (
              <ul className="mt-4 space-y-2 text-sm">
                <li>All Products</li>
                <li>Top Rated</li>
              </ul>
            )}
          </div>

          <div className="border-t my-5"></div>

          {/* PRICE */}
          <div>
            <div
              onClick={() => setOpenPrice(!openPrice)}
              className="flex justify-between cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRICE</h3>
              <FontAwesomeIcon icon={openPrice ? faChevronUp : faChevronDown} />
            </div>

            {openPrice && (
              <ul className="mt-4 space-y-2 text-sm">
                <li>₹ 200 - ₹ 500</li>
                <li>₹ 500 - ₹ 1000</li>
              </ul>
            )}
          </div>

        </div>

        {/* PRODUCTS */}
        <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filteredProducts.map((product) => (
            <div key={product.slug} className="relative rounded-[16px] overflow-hidden group">

              <Link href={`/product/${product.slug}`}>
                <Image
                  src={product.img}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-[260px] object-cover"
                />
              </Link>

              <div className="absolute bottom-0 w-full bg-black/20 backdrop-blur-md p-3 text-white">
                <div className="flex justify-between text-sm">
                  <span>{product.name}</span>
                  <span>₹ {product.price}</span>
                </div>
              </div>

              <button className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center">
                <FontAwesomeIcon icon={faCartShopping} className="text-[#819744]" />
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}