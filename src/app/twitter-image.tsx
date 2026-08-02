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
    join(process.cwd(), "public/Ftc-logo.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

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
        <img src={logoSrc} height="280" alt="" />

        <div
          style={{
            marginTop: "40px",
            fontSize: "32px",
            color: "#ffffff",
            fontWeight: 400,
            letterSpacing: "0.05em",
            textAlign: "center",
          }}
        >
          Unisex Thrifted Streetwear
        </div>

        <div
          style={{
            marginTop: "20px",
            fontSize: "22px",
            color: "#bbbbbb",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Every drop hides a discovery.
        </div>

        <div
          style={{
            marginTop: "16px",
            fontSize: "20px",
            color: "#888888",
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
