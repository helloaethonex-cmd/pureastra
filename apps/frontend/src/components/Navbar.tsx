"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCartShopping,
  faMagnifyingGlass,
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
      {/* TOP BAR */}
      <div className="border-b border-gray-200 py-2 px-3 bg-white">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          
          {/* SEARCH */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-[220px] border-0 border-b-2 border-black bg-transparent outline-none text-base py-1 px-0"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-[#5E2B15] text-lg"
            />
          </div>

          {/* LOGO */}
          <Link href="/" className="flex justify-center items-center">
            <Image
              src="/img/pureastra.png"
              alt="Pureastra Logo"
              className="w-[180px] h-auto object-contain"
              width={180}
              height={60}
              priority
            />
          </Link>

          {/* RIGHT ICONS */}
          {/* <div className="flex gap-5 text-lg [&>svg]:text-[#5E2B15] [&>svg]:cursor-pointer [&>svg]:transition-transform [&>svg:hover]:scale-110">
            <FontAwesomeIcon icon={faHeart} />
            <FontAwesomeIcon icon={faUser} />
            <FontAwesomeIcon icon={faCartShopping} />
          </div> */}
          <div className="flex items-center gap-3">

              {/* Wishlist */}
              <Link href="/wishlist">
                <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E6D5C3] text-[#8B543E] hover:bg-[#F5EFE9] hover:scale-105 transition">
                  <FontAwesomeIcon icon={faHeart} />

                  {/* Badge (optional) */}
                  <span className="absolute -top-1 -right-1 bg-[#819744] text-white text-[10px] px-1.5 py-[1px] rounded-full">
                    2
                  </span>
                </button>
              </Link>

              {/* User */}
              <Link href="/profile">
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E6D5C3] text-[#8B543E] hover:bg-[#F5EFE9] hover:scale-105 transition hover:shadow-md">
                  <FontAwesomeIcon icon={faUser} />
                </button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#819744] text-white hover:bg-[#6f8438] hover:scale-105 transition shadow-sm hover:shadow-md">
                  <FontAwesomeIcon icon={faCartShopping} />

                  {/* Cart Count */}
                  <span className="absolute -top-1 -right-1 bg-[#8B543E] text-white text-[10px] px-1.5 py-[1px] rounded-full">
                    3
                  </span>
                </button>
              </Link>

            </div>
        </div>
      </div>

      {/* MENU BAR */}
      <div className="border-b border-gray-200 py-2 bg-white">
        <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-[30px]">

          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className="group flex items-center gap-2 text-[#5E2B16] font-medium text-lg font-['Poppins',sans-serif] transition-all duration-300 hover:text-[#819744] hover:-translate-y-[2px]"
            >
              {/* ICON */}
              <FontAwesomeIcon
                icon={item.icon}
                className="text-sm transition-transform duration-300 group-hover:scale-110"
              />

              {/* TEXT */}
              <span className="relative">
                {item.name}

                {/* ANIMATED UNDERLINE */}
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#819744] transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          ))}

        </div>
      </div>
    </>
  );
}