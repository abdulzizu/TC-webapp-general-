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
  const logoData = await readFile(
    join(process.cwd(), "public", "Ftc-logo-og.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
          padding: 60,
        }}
      >
        <img
          src={logoSrc}
          style={{ width: 240, height: 240, objectFit: "contain" }}
        />

        <div
          style={{
            marginTop: 30,
            fontSize: 36,
            color: "#ffffff",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textAlign: "center",
          }}
        >
          Unisex Thrifted Streetwear
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            color: "#bbbbbb",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Every drop hides a discovery.
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 18,
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
