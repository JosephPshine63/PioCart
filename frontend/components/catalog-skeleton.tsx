import { ProductGridSkeleton } from "@/components/product-grid";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-full max-w-md" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
