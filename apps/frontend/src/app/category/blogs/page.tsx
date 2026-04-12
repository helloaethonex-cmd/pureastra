"use client";

import Image from "next/image";
import Link from "next/link";

export default function BlogPage() {
  const blogs = [
    {
      slug: "vitamin-c-benefits",
      title: "Benefits of Vitamin C for Skin",
      img: "/img/vitamin-c-blog.png",
      desc: "Learn how Vitamin C boosts glow and reduces pigmentation.",
    },
    {
      slug: "daily-skincare-routine",
      title: "Daily Skincare Routine",
      img: "/img/daily-routine-blog.png",
      desc: "Step-by-step routine for healthy skin.",
    },
    {
      slug: "natural-ingredients",
      title: "Natural Ingredients Guide",
      img: "/img/natural-ingredients-blog.png",
      desc: "Explore the power of natural skincare ingredients.",
    },
  ];

  return (
    <section className="bg-[#FAF3E2] min-h-screen">

      {/*  HERO SECTION */}
      <div className="relative h-[260px] flex items-center justify-center text-center">
        <Image
          src="/img/blogs-banner.webp"
          alt="blog banner"
          fill
          className="object-cover opacity-30"
        />

        <div className="relative z-10">
          <h1 className="text-[40px] font-bold text-[#5E2B16]">
            Our Blogs
          </h1>
          <p className="text-[#7a5a4a] mt-2 text-sm">
            Discover skincare tips, routines & natural beauty secrets ✨
          </p>
        </div>
      </div>

      {/*  BLOG GRID */}
      <div className="px-6 md:px-12 py-12 grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {blogs.map((blog) => (
          <Link
            key={blog.slug}
            href={`/blogs/${blog.slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300"
          >

            {/* IMAGE */}
            <div className="relative h-[220px] overflow-hidden">
              <Image
                src={blog.img}
                alt={blog.title}
                fill
                className="object-cover group-hover:scale-110 transition duration-500"
              />

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            {/* CONTENT */}
            <div className="p-5">

              <h3 className="font-semibold text-lg text-[#819744] mb-2 group-hover:text-[#819744] transition">
                {blog.title}
              </h3>

              <p className="text-sm text-[#5e2b16] mb-4 leading-relaxed">
                {blog.desc}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[#819744] text-sm font-medium group-hover:underline">
                  Read More →
                </span>

                {/* SMALL TAG */}
                <span className="text-xs bg-[#EBF1DC] text-[#5E2B16] px-3 py-1 rounded-full">
                  Skincare
                </span>
              </div>

            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}