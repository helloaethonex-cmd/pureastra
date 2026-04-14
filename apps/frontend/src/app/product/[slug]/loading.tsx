import { SkeletonGrid, SkeletonLine } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <SkeletonLine className="mb-6 h-8 w-2/5" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SkeletonLine className="h-[360px] w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <SkeletonLine className="h-8 w-3/4" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-5/6" />
            <SkeletonLine className="h-10 w-1/3 rounded-lg" />
            <SkeletonLine className="h-12 w-full rounded-lg" />
          </div>
        </div>
        <div className="mt-10">
          <SkeletonGrid
            count={3}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            cardClassName="h-[220px] rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
