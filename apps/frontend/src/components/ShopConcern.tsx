"use client";

export default function ShopConcern() {
  const concerns = [
    { name: "Body Care", icon: "/img/body-care.png" },
    { name: "Lip Care", icon: "/img/lip-care.png" },
    { name: "Hair Care", icon: "/img/hair-care.png" },
    { name: "Skin Care", icon: "/img/skin-care.png" },
  ];

  return (
    <section className="bg-[#E9E2D8] text-center pb-[30px]">
      <h2 className="text-[32px] text-[#8B5E4A] font-['Marko_One',serif] py-5">
        Shop By Concern
      </h2>

      {/* LEAF BANNER */}
      <div className="relative w-full h-[160px] overflow-hidden">
        <img
          src="/img/leaves-bg.jpg"
          alt="leaves"
          className="w-full h-full object-cover blur-[1px] brightness-[0.85]"
        />

        {/* LIGHT OVERLAY */}
        <div className="absolute inset-0 bg-white/30" />

        {/* OVERLAY ITEMS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-[50px] z-[2]">
          {concerns.map((item, index) => (
            <div
              className="text-center px-[15px] py-[10px] rounded-xl bg-white/40 backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-[6px] hover:scale-105 hover:bg-white/60"
              key={index}
            >
              <img
                src={item.icon}
                alt={item.name}
                className="w-[45px] h-[45px] mb-[6px] brightness-[0.3]"
              />
              <p className="text-sm text-[#5e2b15] font-semibold font-['Poppins',sans-serif]">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
