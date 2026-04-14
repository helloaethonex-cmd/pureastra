import { SkeletonGrid, SkeletonLine } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 py-10 md:px-12">
      <SkeletonLine className="mx-auto mb-6 h-9 w-56" />
      <div className="mx-auto mb-8 max-w-sm">
        <SkeletonLine className="h-10 w-full rounded-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <SkeletonLine className="mb-4 h-4 w-28" />
          <SkeletonLine className="mb-2 h-4 w-full" />
          <SkeletonLine className="mb-2 h-4 w-4/5" />
          <SkeletonLine className="h-4 w-3/4" />
        </div>
        <SkeletonGrid
          count={6}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          cardClassName="h-[280px] rounded-[16px]"
        />
      </div>
    </section>
  );
}
