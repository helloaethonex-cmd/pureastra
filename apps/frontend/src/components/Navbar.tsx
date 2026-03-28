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
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { faHeart, faUser } from "@fortawesome/free-regular-svg-icons";

import { useAuthStore } from "@/store/auth.store";
import { useSignOut } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useProducts";

// Icon mapping for different category slugs
const categoryIcons: Record<string, any> = {
  "face-care": faFaceSmile,
  "skincare": faFaceSmile,
  "body-care": faSpa,
  "hair-care": faWind,
  "haircare": faWind,
  "mini-products": faBox,
  "combos": faTags,
  "offers": faPercent,
};

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user } = useAuthStore();
  const signOut = useSignOut();
  const { data: isAdmin } = useIsAdmin();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Static menu items for non-category pages
  const staticMenuItems = [
    { name: "Home", path: "/", icon: faHouse },
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

                  {/* ADMIN PANEL — only visible to admins */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#819744] hover:bg-[#EBF1DC] transition font-medium"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                      Admin Panel
                    </Link>
                  )}

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

          {/* Static menu items */}
          {staticMenuItems.map((item, index) => (
            <Link
              key={`static-${index}`}
              href={item.path}
              className="group flex items-center gap-2 text-[#5E2B16] font-medium text-lg font-['Poppins',sans-serif] transition-all duration-300 hover:text-[#819744] hover:-translate-y-[2px]"
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="text-sm transition-transform duration-300 group-hover:scale-110"
              />
              <span className="relative">
                {item.name}
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#819744] transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          ))}

          {/* Dynamic category menu items (only top-level categories) */}
          {!categoriesLoading && categories?.filter((cat) => !cat.parentId).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex items-center gap-2 text-[#5E2B16] font-medium text-lg font-['Poppins',sans-serif] transition-all duration-300 hover:text-[#819744] hover:-translate-y-[2px]"
            >
              <FontAwesomeIcon
                icon={categoryIcons[category.slug] || faTags}
                className="text-sm transition-transform duration-300 group-hover:scale-110"
              />
              <span className="relative">
                {category.name}
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