import { blogs } from "@/data/blogs";
import Image from "next/image";

// ✅ required for static export
export async function generateStaticParams() {
  return blogs.map((b) => ({
    slug: b.slug,
  }));
}

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailsPage(props: PageProps) {
  const params = await props.params;
  const blog = blogs.find((b) => b.slug === params.slug);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Blog not found
      </div>
    );
  }

  return (
    <section className="bg-[#FAF3E2] min-h-screen px-6 md:px-20 py-10">

      {/* TITLE */}
      <h1 className="text-3xl md:text-4xl font-bold text-center text-[#5E2B16] mb-6">
        {blog.title}
      </h1>

      {/* IMAGE */}
      <div className="max-w-4xl mx-auto mb-8">
        <Image
          src={blog.img}
          alt={blog.title}
          width={800}
          height={400}
          className="w-full rounded-xl object-cover"
        />
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto text-gray-700 text-[16px] leading-relaxed text-center">
        {blog.content}
      </div>

    </section>
  );
}