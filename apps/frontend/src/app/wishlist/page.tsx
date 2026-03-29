"use client";

import Image from "next/image";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faStar } from "@fortawesome/free-solid-svg-icons";

export default function WishlistPage() {

  const [products, setProducts] = useState([
    { id: 1, name: "Vitamin C Face wash", price: 590, rating: 4.5, img: "/img/facewash.jpeg" },
    { id: 2, name: "Apple Berry Face wash", price: 590, rating: 4.4, img: "/img/facewash-1.jpeg" },
    { id: 3, name: "Glow Cleanser", price: 590, rating: 4.3, img: "/img/facewash.png" },
    { id: 4, name: "Skin Serum", price: 590, rating: 4.6, img: "/img/facewash.png" },
    { id: 5, name: "Hydra Facewash", price: 590, rating: 4.2, img: "/img/facewash.png" },
    { id: 6, name: "Brightening Wash", price: 590, rating: 4.5, img: "/img/facewash.png" },
  ]);

  // ❤️ remove from wishlist
  const removeItem = (id: number) => {
    setProducts(products.filter(item => item.id !== id));
  };

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-4 md:px-6">

      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <h1 className="text-center text-[#7A5C45] text-[26px] md:text-[32px] font-semibold mb-8 font-['Marko_One']">
          Wishlist
        </h1>

        {/* GRID RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {products.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:scale-[1.02] transition duration-300"
            >

              {/* IMAGE */}
              <Image
                src={item.img}
                alt={item.name}
                width={400}
                height={400}
                className="w-full h-[220px] md:h-[260px] object-cover"
              />

              {/* ❤️ HEART */}
              <div
                onClick={() => removeItem(item.id)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faHeart} className="text-red-500" />
              </div>

              {/* GLASS OVERLAY */}
              <div className="absolute bottom-0 left-0 w-full bg-white/20 backdrop-blur-md text-white p-4">

                {/* NAME + RATING */}
                <div className="flex justify-between items-center">

                  <h2 className="font-semibold text-[15px] md:text-[16px]">
                    {item.name}
                  </h2>

                  {/* ⭐ RATING */}
                  <div className="flex items-center gap-1 bg-[#7A5C45]/80 px-2 py-[2px] rounded text-xs">
                    <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                    <span>{item.rating}</span>
                  </div>

                </div>

                <p className="text-xs md:text-sm opacity-90 mt-1">
                  Rice Dewy Bright Face Wash With Rice Water & Niacinamide
                </p>

                {/* PRICE */}
                <div className="flex justify-between mt-2 text-sm">
                  <span>100ml</span>
                  <span className="font-medium">₹{item.price}</span>
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* EMPTY STATE */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-[#5E2B15] mb-4">
              Your wishlist is empty 💔
            </h2>
          </div>
        )}

      </div>
    </div>
  );
}