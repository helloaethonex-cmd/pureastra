"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

export default function AuthModal() {
  const [open, setOpen] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={() => setOpen(false)} 
    >
      {/* MODAL BOX */}
      <div
        className="w-[900px] max-w-[95%] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex animate-[fadeIn_0.3s_ease]"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
        >
          <FontAwesomeIcon icon={faTimes} className="text-lg" />
        </button>

        {/* LEFT SIDE */}
        <div className="w-1/2 relative">
          <img
            src="/img/login.png"
            alt="login"
            className="w-full h-full object-cover"
          />

          {/* Overlay text */}
          {/* <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-white text-3xl font-bold text-center">
              {isLogin ? "WELCOME BACK!" : "HELLO FRIEND!"}
            </h2>
          </div> */}
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 p-10 bg-[#FAF3E2]">
          <h2 className="text-2xl font-semibold mb-6 text-[#5e6d2f]">
            {isLogin ? "Login" : "Sign Up"}
          </h2>

          <div className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
              />
            )}

            <input
              type="text"
              placeholder="Email / Username"
              className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
            />

            <button className="w-full bg-[#8FA64C] text-white py-3 rounded-full hover:bg-[#7a923f] transition">
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </div>

          {/* SWITCH */}
          <p className="mt-5 text-sm text-center">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#8FA64C] ml-1 cursor-pointer font-semibold hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}