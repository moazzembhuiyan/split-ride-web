import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n";
import GodProvider from "@/provider/god-provider";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Outfit({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Split-Ride",
  description:
    "A ride-sharing platform that connects passengers with drivers for convenient and affordable transportation.",
};

// The on-screen keyboard shrinks the page instead of covering inputs.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.className} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <TooltipProvider>
          <GodProvider>
            <I18nProvider>{children}</I18nProvider>
          </GodProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
