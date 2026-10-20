import { getCategories } from "@/lib/api/catalog";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Categoria del catalogo PioCart";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ name: category.name }));
}

export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  return ogCard({ title: name, subtitle: `Scopri i prodotti ${name} nel catalogo di PioCart.` });
}
