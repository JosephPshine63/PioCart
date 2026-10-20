import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLORS } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "it",
    start_url: "/",
    display: "standalone",
    theme_color: THEME_COLORS.light,
    background_color: "#ffffff",
    icons: [
      { src: "/icon.png", sizes: "450x450", type: "image/png" },
    ],
  };
}
