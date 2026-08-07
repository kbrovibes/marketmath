import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MarketMath",
    short_name: "MarketMath",
    description:
      "Long-horizon fundamentals, valuation math, and quality screens for US companies. Data from SEC filings.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfd",
    theme_color: "#fcfcfd",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
