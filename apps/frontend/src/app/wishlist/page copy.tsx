"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function WishlistPage() {

  const products = [
    { id: 1, name: "Vitamin C Face wash", price: 590 },
    { id: 2, name: "Vitamin C Face wash", price: 590 },
    { id: 3, name: "Vitamin C Face wash", price: 590 },
    { id: 4, name: "Vitamin C Face wash", price: 590 },
    { id: 5, name: "Vitamin C Face wash", price: 590 },
    { id: 6, name: "Vitamin C Face wash", price: 590 },
  ];

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-6">

      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <h1 className="text-center text-[#7A5C45] text-[32px] font-semibold mb-10 font-['Marko_One']">
          Wishlist
        </h1>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">

          {products.map((item) => (
            <div
              key={item.id}
              className="relative rounded-xl overflow-hidden bg-[#D9D9D9]"
            >

              {/* IMAGE */}
              <Image
                src="/img/facewash.png"
                alt="product"
                width={400}
                height={400}
                className="w-full h-[260px] object-cover"
              />

              {/* HEART ICON */}
              <div className="absolute top-3 right-3 w-9 h-9 bg-white/70 rounded-full flex items-center justify-center cursor-pointer">
                <FontAwesomeIcon icon={faHeart} className="text-white text-sm" />
              </div>

              {/* OVERLAY */}
              <div className="absolute bottom-0 left-0 w-full bg-black/40 text-white p-4">

                <h2 className="font-semibold text-[16px]">
                  {item.name}
                </h2>

                <p className="text-sm opacity-90 mt-1">
                  Rice Dewy Bright Face Wash With Rice Water & Niacinamide for Glass Skin
                </p>

                <div className="flex justify-between mt-2 text-sm">
                  <span>100ml</span>
                  <span>{item.price}</span>
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}