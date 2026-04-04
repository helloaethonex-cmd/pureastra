"use client";

import Image from "next/image";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faEnvelopeCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useSignIn, useSignUp, useGoogleSignIn } from "@/hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const signIn = useSignIn({ onSuccess: handleClose, onError: setError });
  const signUp = useSignUp({
    onSuccess: () => {
      setRegisteredEmail(email);
      setEmailSent(true);
    },
    onError: setError,
  });
  const googleSignIn = useGoogleSignIn();

  function handleClose() {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setEmailSent(false);
    setRegisteredEmail("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isLogin) {
      signIn.mutate({ email, password });
    } else {
      signUp.mutate({ name, email, password });
    }
  }

  function handleGoogle() {
    setError(null);
    googleSignIn.mutate();
  }

  const isLoading = signIn.isPending || signUp.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* MODAL BOX */}
      <div
        className="w-[900px] max-w-[95%] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex animate-[fadeIn_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition z-10"
        >
          <FontAwesomeIcon icon={faTimes} className="text-lg" />
        </button>

        {/* LEFT SIDE */}
        <div className="w-1/2 relative hidden sm:block">
          <Image
            src="/img/login.png"
            alt="Login visual"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 45vw, 400px"
            loading="lazy"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full sm:w-1/2 p-10 bg-[#FAF3E2] flex flex-col justify-center">

          {/* ── EMAIL SENT CONFIRMATION ── */}
          {emailSent ? (
            <div className="flex flex-col items-center text-center gap-4 animate-[fadeIn_0.3s_ease]">
              <div className="w-20 h-20 rounded-full bg-[#eef3da] flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faEnvelopeCircleCheck}
                  className="text-4xl text-[#8FA64C]"
                />
              </div>
              <h2 className="text-2xl font-semibold text-[#5e6d2f]">
                Check your inbox!
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We sent a verification link to
              </p>
              <p className="font-semibold text-[#5e6d2f] text-sm break-all">
                {registeredEmail}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Click the link in the email to activate your account.
                It may take a minute or two to arrive.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 w-full bg-[#8FA64C] text-white py-3 rounded-full text-sm font-semibold hover:bg-[#7a923f] transition"
              >
                Got it, close
              </button>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setIsLogin(true);
                }}
                className="text-xs text-[#8FA64C] hover:underline cursor-pointer"
              >
                Already verified? Log in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-[#5e6d2f]">
                {isLogin ? "Login" : "Sign Up"}
              </h2>

              {/* ERROR MESSAGE */}
              {error && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-full text-center">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
                  />
                )}

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full p-3 rounded-full bg-[#e5ecd0] outline-none focus:ring-2 focus:ring-[#8FA64C]"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#8FA64C] text-white py-3 rounded-full hover:bg-[#7a923f] transition disabled:opacity-60"
                >
                  {isLoading
                    ? isLogin
                      ? "Logging in..."
                      : "Signing up..."
                    : isLogin
                      ? "Login"
                      : "Sign Up"}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-px bg-[#c9d4a0]" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <span className="flex-1 h-px bg-[#c9d4a0]" />
              </div>

              {/* GOOGLE BUTTON */}
              <button
                onClick={handleGoogle}
                disabled={googleSignIn.isPending}
                className="w-full flex items-center justify-center gap-3 bg-white border border-[#c9d4a0] py-3 rounded-full hover:bg-[#f0f4e4] transition disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-[#5e6d2f] text-lg" />
                <span className="text-sm font-medium text-[#5e6d2f]">
                  {googleSignIn.isPending ? "Redirecting..." : "Continue with Google"}
                </span>
              </button>

              {/* SWITCH */}
              <p className="mt-5 text-sm text-center">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <span
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-[#8FA64C] ml-1 cursor-pointer font-semibold hover:underline"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
