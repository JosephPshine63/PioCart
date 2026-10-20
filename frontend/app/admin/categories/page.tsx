import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryRow, CreateCategoryForm } from "@/components/admin/category-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "Categorie",
};

export default function AdminCategoriesPage() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Categorie</h2>
      <p className="text-sm text-muted-foreground">
        Le categorie compaiono nel menu del negozio. Un prodotto può anche creare una categoria nuova dal suo modulo.
      </p>
      <CreateCategoryForm />
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
        <CategoryList />
      </Suspense>
    </section>
  );
}

async function CategoryList() {
  const categories = (await getCategories()).toSorted((a, b) => a.name.localeCompare(b.name, "it"));

  if (categories.length === 0) {
    return <p className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">Nessuna categoria.</p>;
  }
  return (
    <ul className="max-w-xl divide-y rounded-lg border">
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </ul>
  );
}
