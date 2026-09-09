import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Akşam Ne Yesem?",
    short_name: "Akşam Ne Yesem",
    description: "Malzemelerine ve tercihlerine göre yemek önerileri.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#ea580c",
    lang: "tr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
