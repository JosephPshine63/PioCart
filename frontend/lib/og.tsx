import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEVELOPER } from "@/lib/contacts";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Social preview card in the brand colors, shared by the site and the category images. */
export async function ogCard({ title, subtitle }: { title: string; subtitle: string }) {
  const logo = await readFile(join(process.cwd(), "public/brand/logo-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "linear-gradient(135deg, #009faa 0%, #05616b 55%, #0a1113 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", padding: 16, borderRadius: 24, background: "white" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
            <img src={logoSrc} width={124} height={74} alt="" />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 32, opacity: 0.85, maxWidth: 1000 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>{`Progetto portfolio · ${DEVELOPER.name}`}</div>
      </div>
    ),
    OG_SIZE,
  );
}
