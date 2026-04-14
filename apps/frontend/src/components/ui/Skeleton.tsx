type SkeletonLineProps = {
  className?: string;
};

export function SkeletonLine({ className = "" }: SkeletonLineProps) {
  return <div className={`animate-pulse rounded-md bg-[#E6DCCF] ${className}`} />;
}

type SkeletonCardProps = {
  className?: string;
};

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div
      className={`h-[280px] w-full animate-pulse rounded-[20px] bg-[#D9D9D9] ${className}`}
    />
  );
}

type SkeletonGridProps = {
  count?: number;
  className?: string;
  cardClassName?: string;
};

export function SkeletonGrid({
  count = 3,
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  cardClassName = "",
}: SkeletonGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} className={cardClassName} />
      ))}
    </div>
  );
}
