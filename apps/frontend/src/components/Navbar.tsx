"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

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
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { faHeart, faUser } from "@fortawesome/free-regular-svg-icons";

import { useAuthStore } from "@/store/auth.store";
import { useSignOut } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

// Icon mapping for different category slugs
const categoryIcons: Record<string, IconDefinition> = {
  "face-care": faFaceSmile,
  skincare: faFaceSmile,
  "body-care": faSpa,
  "hair-care": faWind,
  haircare: faWind,
  "mini-products": faBox,
  combos: faTags,
  offers: faPercent,
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

 const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user } = useAuthStore();
  const signOut = useSignOut();
  const { data: isAdmin } = useIsAdmin();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: cart } = useCart(Boolean(user));
  const { data: wishlist } = useWishlist(Boolean(user));

  const cartCount = (cart?.items ?? []).reduce(
    (total, item) => total + item.quantity,
    0
  );
  const wishlistCount = wishlist?.length ?? 0;

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
                <span className="absolute -top-1 -right-1 bg-[#819744] text-white text-[10px] px-1 rounded-full">
                  {wishlistCount}
                </span>
              </button>
            </Link>

              {/* User */}
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E6D5C3] text-[#8B543E] hover:bg-[#F5EFE9] hover:scale-105 transition hover:shadow-md">
                <FontAwesomeIcon
                  icon={faUser}
                  onClick={handleUserIconClick}
                  className="text-[#5E2B15] cursor-pointer transition-transform hover:scale-110"
                  title={user ? user.name : "Login / Sign Up"}
                />

                {user && isUserMenuOpen && (
                  <div
                    className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-44 z-50"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <p className="px-4 py-1 text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                    <hr className="my-1 border-gray-100" />

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#819744] hover:bg-[#EBF1DC] transition font-medium"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FontAwesomeIcon
                          icon={faShieldHalved}
                          className="text-xs"
                        />
                        Admin Panel
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-[#5E2B16] hover:bg-[#FAF3E2] transition"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <div
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut.mutate();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      {signOut.isPending ? "Signing out..." : "Sign Out"}
                    </div>
                  </div>
                )}
              </button>

            <Link href="/cart">
              <button className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#819744] text-white hover:bg-[#6f8438] transition">
                <FontAwesomeIcon icon={faCartShopping} />
                <span className="absolute -top-1 -right-1 bg-[#8B543E] text-white text-[10px] px-1 rounded-full">
                  {cartCount}
                </span>
              </button>
            </Link>

          </div>
        </div>
      </div>

      {/* ================= DESKTOP MENU ================= */}
      <div className="hidden md:block border-b border-gray-200 py-3 bg-white">
        <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-6 lg:gap-10">

          {/* Static menu items */}
          {staticMenuItems.map((item, index) => (
            <Link
              key={`static-${index}`}
              href={item.path}
              className="group flex items-center gap-2 text-[#5E2B16] font-medium text-base lg:text-lg hover:text-[#819744] transition"
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

      {/* ================= MOBILE DRAWER ================= */}

      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* SIDEBAR */}
      {/* ================= MOBILE GLASS MENU ================= */}

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* BACKGROUND BLUR */}
        <div
          className="absolute inset-0 bg-[#FAF3E2]/70 backdrop-blur-md z-40"
          onClick={() => setIsOpen(false)}
        />

        {/* RIGHT BROWN OVERLAY (OVERLAPPING) */}
        <div
          className={`absolute top-0 right-0 h-full w-[80px]
          bg-gradient-to-b from-[#5E2B15]/50 to-[#5E2B15]/40
          backdrop-blur-xl z-50
          transition-transform duration-500 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        />

        {/* CLOSE BUTTON */}
        <div className="absolute top-4 right-4 z-[60]">
          <button onClick={() => setIsOpen(false)}>
            <FontAwesomeIcon icon={faXmark} className="text-white text-xl" />
          </button>
        </div>

        {/* MENU ITEMS */}
        <div className="absolute top-[110px] left-[36px] w-[320px] z-[40] flex flex-col gap-4">

          {[...staticMenuItems, ...(categories?.filter((c) => !c.parentId) || [])].map(
            (item: any, index) => {
              const name = item.name;
              const path = item.path || `/category/${item.slug}`;
              const isActive = index === 0;

              return (
                <Link
                  key={index}
                  href={path}
                  onClick={() => setIsOpen(false)}
                  className={`h-[56px] w-[325px] flex items-center justify-center rounded-full text-[15px] font-medium transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#5E2B15] via-[#5E2B15] to-[#5E2B15]/45 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                      : "bg-white/20 text-[#5E2B15] backdrop-blur-md hover:bg-white/50"
                  }`}
                >
                  {name}
                </Link>
              );
            }
          )}

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