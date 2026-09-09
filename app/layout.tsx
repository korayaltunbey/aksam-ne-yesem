// Kök düzen (layout): her sayfanın ortak iskeleti.
// - Font ayarları
// - Sayfa başlığı/açıklaması ve favicon
// - Tema başlatma senaryosu (boyanmadan önce)
// - Sabit üst bar ve içerik alanı

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { themeInitScript } from "@/lib/theme"; // ilk boyamadan önce temayı uygulayan kod
import Header from "@/components/Header"; // her sayfada görünen üst bar
import { InlineScript } from "@/app/components/InlineScript"; // hydration-güvenli inline script
import { ServiceWorkerRegistration } from "@/app/components/ServiceWorkerRegistration";
import "./globals.css";

// Tüm sayfaların ortak meta verisi (tarayıcı sekmesi + arama motorları)
export const metadata: Metadata = {
  title: "Akşam Ne Yesem?",
  description: "Dolaptakilerle ya da keyfine göre yemek önerisi ve ölçekli tarif.",
  icons: {
    icon: "/icon.svg", // yemek temalı favicon
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: tema script'i hydration'dan önce <html> sınıfını
    // değiştirdiği için React'e bu öğeyi karşılaştırmamasını söyler.
    // Bu olmazsa hydration uyuşmazlığı tüm uygulamanın çökmesine yol açar.
    <html
      lang="tr"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Kayıtlı temayı sayfa boyanmadan önce uygular (yanıp sönmeyi engeller) */}
        <InlineScript html={themeInitScript()} />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {/* Üst bar her sayfada sabittir */}
        <Header />
        {children}
      </body>
    </html>
  );
}
