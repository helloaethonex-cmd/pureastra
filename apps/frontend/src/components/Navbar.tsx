"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCartShopping,
  faMagnifyingGlass,
  faBars,
  faXmark,
  faHouse,
  faFaceSmile,
  faSpa,
  faWind,
  faBox,
  faTags,
  faPercent,
  faCircleInfo,
  faBlog,
} from "@fortawesome/free-solid-svg-icons";

import { faHeart, faUser } from "@fortawesome/free-regular-svg-icons";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

 const menuItems = [
    { name: "Home", path: "/", icon: faHouse },
    { name: "Face", path: "/category/face-care", icon: faFaceSmile },
    { name: "Body", path: "/category/body-care", icon: faSpa },
    { name: "Hair", path: "/category/hair-care", icon: faWind },
    { name: "Miniz", path: "/category/mini-products", icon: faBox },
    { name: "Combo", path: "/category/combos", icon: faTags },
    { name: "Offer", path: "/category/offers", icon: faPercent },
    { name: "About", path: "/category/about", icon: faCircleInfo },
    { name: "Blog", path: "/category/blogs", icon: faBlog },
  ];
  return (
    <>
      {/* ================= TOP BAR ================= */}
      <div className="border-b border-gray-200 py-2 px-4 bg-white">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">

          {/* LEFT (MOBILE MENU + SEARCH) */}
          <div className="flex items-center gap-3">

            {/* HAMBURGER (mobile only) */}
            <button
              className="md:hidden text-xl"
              onClick={() => setIsOpen(true)}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            {/* SEARCH (hidden on small mobile) */}
            <div className="hidden sm:flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                className="w-[150px] md:w-[220px] border-0 border-b-2 border-black bg-transparent outline-none text-sm md:text-base"
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
          </div>

          {/* LOGO */}
          <Link href="/" className="flex justify-center items-center">
            <Image
              src="/img/pureastra.png"
              alt="Pureastra Logo"
              width={150}
              height={50}
              className="object-contain"
              priority
            />
          </Link>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-2 md:gap-3">

            <Link href="/wishlist">
              <button className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border border-[#E6D5C3] text-[#8B543E] hover:bg-[#F5EFE9] transition">
                <FontAwesomeIcon icon={faHeart} />
              </button>
            </Link>

            <Link href="/profile">
              <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border border-[#E6D5C3] text-[#8B543E] hover:bg-[#F5EFE9] transition">
                <FontAwesomeIcon icon={faUser} />
              </button>
            </Link>

            <Link href="/cart">
              <button className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#819744] text-white hover:bg-[#6f8438] transition">
                <FontAwesomeIcon icon={faCartShopping} />
                <span className="absolute -top-1 -right-1 bg-[#8B543E] text-white text-[10px] px-1 rounded-full">
                  3
                </span>
              </button>
            </Link>

          </div>
        </div>
      </div>

      {/* ================= DESKTOP MENU ================= */}
      <div className="hidden md:block border-b border-gray-200 py-3 bg-white">
        <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-6 lg:gap-10">

          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className="group flex items-center gap-2 text-[#5E2B16] font-medium text-base lg:text-lg hover:text-[#819744] transition"
            >
              <FontAwesomeIcon icon={item.icon} />
              <span className="relative">
                {item.name}
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#819744] group-hover:w-full transition-all"></span>
              </span>
            </Link>
          ))}

        </div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}

      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-white z-50 shadow-lg transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg">Menu</h2>
          <button onClick={() => setIsOpen(false)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* MENU ITEMS */}
        <div className="flex flex-col p-4 gap-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-[#5E2B16] font-medium hover:text-[#819744] transition"
            >
              <FontAwesomeIcon icon={item.icon} />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}