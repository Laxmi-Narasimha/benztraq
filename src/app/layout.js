import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "BENZERP | Sales Performance Dashboard",
  description: "Premium internal application for tracking sales performance, quotations, and sales orders.",
  keywords: ["benzerp", "sales", "performance", "dashboard", "quotations", "sales orders"],
  icons: {
    icon: "/assets/blue-logo.png",
    shortcut: "/assets/blue-logo.png",
    apple: "/assets/blue-logo.png",
  },
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
