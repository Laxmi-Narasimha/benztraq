import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Sales Performance Tracker | Manufacturing Dashboard",
  description: "Premium internal web application for tracking sales performance, quotations, and sales orders for manufacturing operations.",
  keywords: ["sales", "performance", "dashboard", "manufacturing", "quotations", "sales orders"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
