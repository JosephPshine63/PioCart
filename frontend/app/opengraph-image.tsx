import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "PioCart: tutto quello che ti serve, in un unico carrello";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    title: "Tutto quello che ti serve, in un unico carrello",
    subtitle: "Elettronica, libri e casa dai migliori marchi.",
  });
}
