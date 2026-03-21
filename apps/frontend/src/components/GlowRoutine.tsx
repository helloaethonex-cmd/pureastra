"use client";

export default function GlowRoutine() {
  const steps = [
    {
      title: "Refresh",
      desc: "Start your day by cleansing your face to remove overnight oil and toxins",
      img: "/img/routine-1.png",
    },
    {
      title: "Tone",
      desc: "Apply a natural toner to shrink pores and restore pH balance",
      img: "/img/routine-2.png",
    },
    {
      title: "Nourish",
      desc: "Use a lightweight serum or essence packed with natural extracts",
      img: "/img/routine-3.png",
    },
    {
      title: "Moisturize",
      desc: "Keep your skin hydrated and smooth with a moisturizer",
      img: "/img/routine-4.png",
    },
    {
      title: "Shield",
      desc: "Apply sunscreen to protect from sun damage and pollution",
      img: "/img/routine-5.png",
    },
  ];

  return (
    <section className="bg-[#EBF1DC] px-[60px] py-[80px] relative">
      <h2 className="text-center text-[#9E6E5B] font-['Marko_One',serif] text-[28px] mb-[40px]">
        Your Daily Organic Glow Routine
      </h2>

      <div className="relative w-full before:absolute before:top-0 before:bottom-0 before:left-1/2 before:w-[6px] before:-translate-x-1/2 before:rounded-[10px] before:bg-[linear-gradient(to_bottom,#819743_0%,#B0900F_51%,#5E2B16_100%)] before:bg-[length:100%_200%] before:content-[''] before:animate-[flow_4s_linear_infinite] max-md:before:left-[20px] max-md:before:translate-x-0">
        {steps.map((step, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div key={index} className="mb-[50px] grid grid-cols-[1fr_60px_1fr] items-center max-md:mb-10 max-md:grid-cols-1">
              {/* LEFT SIDE */}
              <div className="px-5 max-md:pl-10 max-md:pr-0">
                {isLeft ? (
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full rounded-md transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div>
                    <h4 className="text-[#3B7509] font-semibold mb-2 font-['Poppins',sans-serif]">
                      {step.title}
                    </h4>
                    <p className="text-sm text-[#3B7509] font-['Poppins',sans-serif]">
                      {step.desc}
                    </p>
                  </div>
                )}
              </div>

              {/* CENTER DOT */}
              <div className="z-[2] m-auto h-5 w-5 rounded-full border-4 border-[#B0900F] bg-white max-md:hidden" />

              {/* RIGHT SIDE */}
              <div className="px-5 max-md:pl-10 max-md:pr-0">
                {isLeft ? (
                  <div>
                    <h4 className="text-[#3B7509] font-semibold mb-2 font-['Poppins',sans-serif]">
                      {step.title}
                    </h4>
                    <p className="text-sm text-[#3B7509] font-['Poppins',sans-serif]">
                      {step.desc}
                    </p>
                  </div>
                ) : (
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full rounded-md transition-transform duration-300 hover:scale-105"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
