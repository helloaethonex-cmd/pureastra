"use client";

import { useState } from "react";
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

import { useAuthStore } from "@/store/auth.store";
import { useSignOut } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user } = useAuthStore();
  const signOut = useSignOut();

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

  function handleUserIconClick() {
    if (user) {
      setIsUserMenuOpen((prev) => !prev);
    } else {
      setIsAuthModalOpen(true);
    }
  }

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
          <div className="flex gap-5 text-lg [&>svg]:text-[#5E2B15] [&>svg]:cursor-pointer [&>svg]:transition-transform [&>svg:hover]:scale-110 items-center">
            <FontAwesomeIcon icon={faHeart} />

            {/* USER ICON + DROPDOWN */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faUser}
                onClick={handleUserIconClick}
                className="text-[#5E2B15] cursor-pointer transition-transform hover:scale-110"
                title={user ? user.name : "Login / Sign Up"}
              />

              {/* LOGGED-IN DROPDOWN */}
              {user && isUserMenuOpen && (
                <div
                  className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-44 z-50"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <p className="px-4 py-1 text-xs text-gray-400 truncate">{user.email}</p>
                  <hr className="my-1 border-gray-100" />
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-[#5E2B16] hover:bg-[#FAF3E2] transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut.mutate();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    {signOut.isPending ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>

            <FontAwesomeIcon icon={faCartShopping} />
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

      {/* AUTH MODAL */}
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}