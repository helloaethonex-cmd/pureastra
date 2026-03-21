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

export default function Footer() {
  return (
    <footer className="bg-[#8B543E] text-white px-10 pt-17.5 pb-7.5 font-sans">
      <div className="max-w-300 mx-auto">
        {/* TOP GRID */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {/* BRAND + NEWSLETTER */}
          <div>
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
              <FontAwesomeIcon icon={faFacebookF} />
              <FontAwesomeIcon icon={faXTwitter} />
              <FontAwesomeIcon icon={faInstagram} />
              <FontAwesomeIcon icon={faPinterest} />
              <FontAwesomeIcon icon={faYoutube} />
            </div>
          </div>

          {/* LINKS */}
          <div>
            <h4 className="mb-3.75 text-lg">Top Categories</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>Face Care</li>
              <li>Hair Care</li>
              <li>Body Care</li>
              <li>Combos</li>
              <li>Mini Products</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Policies</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>Privacy Policy</li>
              <li>Terms &amp; Conditions</li>
              <li>Shipping &amp; Cancellation</li>
              <li>Returns &amp; Refund</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Best Sellers</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>Vitamin C Face Wash</li>
              <li>Brightening Serum</li>
              <li>Hair Growth Oil</li>
              <li>Face Mask</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.75 text-lg">Info</h4>
            <ul className="list-none p-0 space-y-2 text-sm text-[#f1f1f1] [&>li]:cursor-pointer">
              <li>About Us</li>
              <li>Contact Us</li>
              <li>Track Order</li>
              <li>Blogs</li>
              <li>Careers</li>
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
            <FontAwesomeIcon icon={faPhone} className="mr-2" /> +91 98765 43210
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
