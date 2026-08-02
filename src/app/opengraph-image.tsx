import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Thrift Collision — Unisex Thrifted Streetwear";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  let logoSrc: string | null = null;
  try {
    const logoData = await readFile(
      join(process.cwd(), "public", "Ftc-logo.png"),
      "base64"
    );
    logoSrc = `data:image/png;base64,${logoData}`;
  } catch (e) {
    console.error("OG image: failed to read logo", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "60px",
        }}
      >
        {/* Logo */}
        {logoSrc && (
          <img
            src={logoSrc}
            width="300"
            height="300"
            style={{ objectFit: "contain", borderRadius: "24px" }}
          />
        )}

        {/* Tagline */}
        <div
          style={{
            marginTop: "30px",
            fontSize: "36px",
            color: "#ffffff",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textAlign: "center",
          }}
        >
          Unisex Thrifted Streetwear
        </div>

        {/* Phrase */}
        <div
          style={{
            marginTop: "16px",
            fontSize: "22px",
            color: "#bbbbbb",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Every drop hides a discovery.
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: "14px",
            fontSize: "18px",
            color: "#666666",
            letterSpacing: "0.1em",
          }}
        >
          thriftcollision.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
