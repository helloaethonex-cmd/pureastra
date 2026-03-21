"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faFlask,
  faLeaf,
  faSeedling,
  faSpa,
} from "@fortawesome/free-solid-svg-icons";

export default function ConcernStrip() {
  return (
    <section className="bg-[#7C8F45] overflow-hidden whitespace-nowrap">
      <div className="inline-flex gap-[60px] py-[14px] animate-[scrollLeft_18s_linear_infinite] will-change-transform">
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faLeaf} className="text-sm opacity-90" /> Freshly Made
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faSeedling} className="text-sm opacity-90" /> 100% Natural
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faFlask} className="text-sm opacity-90" /> No Harsh Chemicals
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faSpa} className="text-sm opacity-90" /> Organic Ingredients
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faBan} className="text-sm opacity-90" /> No Parabens
        </span>

        {/* repeat for smooth loop */}
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faLeaf} className="text-sm opacity-90" /> Freshly Made
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faSeedling} className="text-sm opacity-90" /> 100% Natural
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faFlask} className="text-sm opacity-90" /> No Harsh Chemicals
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faSpa} className="text-sm opacity-90" /> Organic Ingredients
        </span>
        <span className="text-white font-medium text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faBan} className="text-sm opacity-90" /> No Parabens
        </span>
      </div>
    </section>
  );
}
