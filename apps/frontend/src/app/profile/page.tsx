"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";

export default function ProfilePage() {
  const [gender, setGender] = useState("female");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16">

      <div className="w-[1144px] mx-auto flex items-end justify-between">

        {/* ================= LEFT FORM ================= */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[762px] h-[565px] bg-[#EDE3D2] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >

          {/* EDIT BUTTON */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#9CB261] text-white px-4 py-1 rounded-md text-sm font-['Poppins',sans-serif] flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-[14px]" />
              Edit
            </button>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-2 gap-6 text-[#5E2B16] text-sm">

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">First Name</label>
              <input
                readOnly={!isEditing}
                className={`w-full mt-1 p-2 rounded-md ${isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
                defaultValue="Lorem"
              />
            </div>

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">Last Name</label>
              <input
                readOnly={!isEditing}
                className={`w-full mt-1 p-2 rounded-md ${isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
                defaultValue="Ipsum"
              />
            </div>

            <div className="col-span-2">
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">Email ID</label>
              <input
                readOnly={!isEditing}
                className={`w-full mt-1 p-2 rounded-md ${isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
                defaultValue="loremipsum@gmail.com"
              />
            </div>

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">Contact Number</label>
              <input
                readOnly={!isEditing}
                className={`w-full mt-1 p-2 rounded-md ${isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
                defaultValue="+917873686593"
              />
            </div>

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">Alternate Number</label>
              <input
                readOnly={!isEditing}
                className={`w-full mt-1 p-2 rounded-md ${isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"}`}
              />
            </div>

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">
                Birth Date
              </label>
              <input
                type="date"
                readOnly={!isEditing}
                defaultValue="2004-06-16"
                className={`mt-1 w-[350px] p-2 rounded-md text-[#5E2B15] ${
                  isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">Gender</label>
              <div className="flex gap-4 mt-2 font-['Poppins',serif]">
                {["male", "female", "other"].map((g) => (
                  <label key={g} className="flex items-center gap-1">
                    <input
                      type="radio"
                      disabled={!isEditing}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="accent-[#5E2B15]"
                    />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* SAVE BUTTON */}
          {isEditing && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-[#9A5F2D] text-white px-10 py-3 rounded-full text-lg font-['Poppins',serif] hover:opacity-90 transition"
              >
                Save Details
              </button>
            </div>
          )}

        </motion.div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-[382px] h-[620px] bg-[#5E2B15] text-white shadow-xl flex flex-col -ml-6"
        >

          {/* TOP LEFT CUT */}
            <div className="absolute -top-0 -left-[60px] w-0 h-0 
            border-l-[60px] border-l-transparent 
            border-b-[60px] border-b-[#5E2B15]" />

            {/* BOTTOM LEFT CUT */}
            <div className="absolute -bottom-0 -left-[60px] w-0 h-0 
            border-l-[60px] border-l-transparent 
            border-t-[60px] border-t-[#5E2B15]" />

          {/* HEADER */}
          <div className="bg-[#4E2716] text-center py-6 text-[20px] font-semibold border-b border-white/20">
            Profile
          </div>

          {/* MENU */}
            <div className="flex flex-col flex-1 justify-around text-center text-[20px]">
            {[
                { name: "Order Track", href: "/order-track" },
                { name: "Order History", href: "/order-history" },
                { name: "Wishlist", href: "/wishlist" },
                { name: "Offer", href: "/offers" },
                { name: "Log out", href: "/" },
            ].map((item, i) => (
                <Link key={i} href={item.href}>
                <div className="py-6 border-b border-white/20 hover:bg-[#4a1f0f] transition cursor-pointer">
                    {item.name}
                </div>
                </Link>
            ))}
            </div>

        </motion.div>

      </div>
    </div>
  );
}