"use client";

import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faStar,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function ProductPage() {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const product = {
    name: "Vitamin C facewash",
    price: 590,
    rating: 4.5,
    images: [
      "/img/facewash.png",
      "/img/banner-1.png",
      "/img/banner-2.png",
      "/img/banner-3.png",
    ],
  };

  return (
    <section className="bg-[#FAF3E2] min-h-screen px-6 md:px-12 py-10">

      <div className="grid grid-cols-2 gap-10 max-md:grid-cols-1">

        {/* LEFT SIDE */}
        <div>
          <div className="bg-white p-6 rounded-xl">
            <Image
              src={product.images[activeImg]}
              alt="product"
              width={400}
              height={400}
              className="w-full object-contain"
            />
          </div>

          {/* THUMBNAILS */}
          <div className="flex gap-3 mt-4">
            {product.images.map((img, i) => (
              <Image
                key={i}
                src={img}
                alt="thumb"
                width={80}
                height={80}
                onClick={() => setActiveImg(i)}
                className={`cursor-pointer rounded-md border ${
                  activeImg === i ? "border-[#819744]" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>

          {/* TITLE */}
          <h2 className="text-2xl font-semibold mb-2">
            {product.name}
          </h2>

          {/* RATING */}
          <div className="flex items-center gap-2 text-[#F59E0B] mb-3">
            <FontAwesomeIcon icon={faStar} />
            <span>{product.rating}</span>
          </div>

          {/* PRICE */}
          <p className="text-xl font-semibold mb-6">
            ₹ {product.price}
          </p>

          {/* SIZE */}
          <div className="mb-5">
            <p className="text-sm font-medium mb-2">Size:</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-[#819744] text-white rounded-full text-xs">
                100ml
              </button>
              <button className="px-3 py-1 bg-[#EFE6D8] rounded-full text-xs">
                200ml
              </button>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
              className="w-9 h-9 border rounded flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>

            <span className="text-lg">{qty}</span>

            <button
              onClick={() => setQty(qty + 1)}
              className="w-9 h-9 border rounded flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {/* ADD TO CART */}
          <button className="bg-[#819744] text-white px-6 py-3 rounded-full flex items-center gap-3 hover:bg-[#6e833b] transition">
            ADD TO CART
            <FontAwesomeIcon icon={faCartShopping} />
          </button>

          {/* DESCRIPTION */}
          <div className="mt-8 text-sm text-gray-700 leading-relaxed">
            Discover the power of Vitamin C face wash enriched with rice water
            & niacinamide. Helps brighten skin, remove dirt and improve texture.
          </div>
        </div>
      </div>
    </section>
  );
}