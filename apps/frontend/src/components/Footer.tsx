"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faPinterest,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#8B543E] text-white px-10 pt-17.5 pb-7.5 font-sans">
      <div className="max-w-300 mx-auto">
        {/* TOP GRID */}
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* BRAND + NEWSLETTER */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold">Pureastra</h2>

            <p className="my-5 text-lg">
              Sign up to get 10% off on your first order
            </p>

            {/* EMAIL BOX */}
            <div className="flex bg-white/10 rounded-full overflow-hidden w-65 max-sm:w-full">
              <input
                type="email"
                placeholder="E-mail"
                className="border-0 px-3.75 py-2.5 flex-1 bg-transparent text-white outline-none placeholder:text-[#ddd]"
              />
              <button className="bg-white/20 border-0 px-3.75 py-2.5 text-white cursor-pointer">
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>

            {/* Social Icons */}
            <div className="mt-5 flex gap-3.75 [&>svg]:text-lg [&>svg]:cursor-pointer">
              <a
                href="https://www.facebook.com/share/1CPTr3QAcQ/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a
                href="https://www.instagram.com/pureastra.in?igsh=aWExMTVwamJraWNx"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:scale-110 transition"
              >
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <FontAwesomeIcon icon={faXTwitter} />
              <FontAwesomeIcon icon={faPinterest} />
              <FontAwesomeIcon icon={faYoutube} />
            </div>
          </div>

          {/* LINKS */}
          <div>
            <h4 className="mb-3.75 text-lg">Top Categories</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">

              <li>
                <Link href="/category/face-care">Face Care</Link>
              </li>

              <li>
                <Link href="/category/hair-care">Hair Care</Link>
              </li>

              <li>
                <Link href="/category/body-care">Body Care</Link>
              </li>

              <li>
                <Link href="/category/combos">Combos</Link>
              </li>

              <li>
                <Link href="/category/mini-products">Mini Products</Link>
              </li>

            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Policies</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              
              <li>
                <Link href="/privacy-policy" className="cursor-pointer">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="cursor-pointer">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="cursor-pointer">
                  Shipping &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link href="/returns" className="cursor-pointer">
                  Returns &amp; Refund
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Best Sellers</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>
                <Link href="/product/vitamin-c-face-wash" className="cursor-pointer">
                  Vitamin C Face Wash
                </Link>
              </li>
              <li>
                <Link href="/product/brightening-serum" className="cursor-pointer">
                  Brightening Serum
                </Link>
              </li>
              <li>
                <Link href="/product/hair-growth-oil" className="cursor-pointer">
                  Hair Growth Oil
                </Link>
              </li>
              <li>
                <Link href="/product/face-mask" className="cursor-pointer">
                  Face Mask
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Info</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>
                <Link href="/about" className="cursor-pointer">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="cursor-pointer">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="cursor-pointer">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="cursor-pointer">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href="/careers" className="cursor-pointer">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* CONTACT SECTION */}
        <div className="mt-10 flex gap-7.5 text-sm">
          <p>
            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />{" "}
            support@pureastra.com
          </p>
          <p>
            <FontAwesomeIcon icon={faPhone} className="mr-2" /> +91 94002 06479
          </p>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-7.5 text-center text-sm opacity-80">
          © 2026 Pureastra. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
