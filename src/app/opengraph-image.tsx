import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

export const alt = "Thrift Collision — Unisex Thrifted Streetwear";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  // Fetch logo from public URL — reliable on Vercel serverless
  const logoRes = await fetch("https://thriftcollision.com/Ftc-logo.png");
  const logoBuffer = await logoRes.arrayBuffer();
  const logoBase64 = Buffer.from(logoBuffer).toString("base64");
  const logoSrc = `data:image/png;base64,${logoBase64}`;

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
        <img
          src={logoSrc}
          width="280"
          height="280"
          style={{ objectFit: "contain", borderRadius: "20px" }}
        />

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
