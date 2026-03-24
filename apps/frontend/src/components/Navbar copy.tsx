import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart, faUser } from "@fortawesome/free-regular-svg-icons";

export default function Navbar() {
  const menuItems = [
    "Home",
    "Face",
    "Body",
    "Hair",
    "Miniz",
    "Combo",
    "Offer",
    "About",
    "Blog",
  ];

  return (
    <>
      {/* TOP BAR */}
      <div className="border-b border-gray-200 py-2 px-3 bg-white">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          {/* LEFT - Search */}
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

          {/* CENTER - Logo */}
          <div className="flex justify-center items-center">
            <Image
              src="/img/pureastra.png"
              alt="Pureastra Logo"
              className="w-[180px] h-auto object-contain"
              width={180}
              height={60}
              priority
            />
          </div>

          {/* RIGHT - Icons */}
          <div className="flex gap-5 text-lg [&>svg]:text-[#5E2B15] [&>svg]:cursor-pointer [&>svg]:transition-transform [&>svg:hover]:scale-110">
            <FontAwesomeIcon icon={faHeart} />
            <FontAwesomeIcon icon={faUser} />
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
        </div>
      </div>

      {/* MENU BAR */}
      <div className="border-b border-gray-200 py-2">
        <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-[30px]">
          {menuItems.map((item, index) => (
            <span
              key={index}
              className="cursor-pointer text-[#5E2B16] font-medium text-xl font-['Poppins',sans-serif] transition-all duration-200 hover:text-[#5E2B15] hover:border-b-2 hover:border-[#819744]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
