import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Sidebar } from "@/components/sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden border-r md:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex w-full flex-1 flex-col">
            {/* Mobile Header with Menu */}
            <header className="flex h-14 items-center border-b px-4 lg:px-6">
              <MobileSidebar />
            </header>

            <main className="flex-1 p-5">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
