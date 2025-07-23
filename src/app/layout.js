import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Screen Sharer",
  },
  description: "App to share your screen with any friend",
  authors: [
    {
      name: "Diego Torres",
      url: "https://diegotorres-portfoliodev.vercel.app",
    },
  ],
  openGraph: {
    title: "Screen Sharer",
    description: "App to share your screen with any friend",
    url: "https://dev-screenshare.vercel.app",
    siteName: "Screen Sharer",
    images: [
      {
        url: "/icon.webp",
        width: 1200,
        height: 630,
        alt: "Share screen logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image", // Tipo de tarjeta (puede ser `summary` o `summary_large_image`).
    title: "Screen Sharer", // Título para la tarjeta de Twitter.
    description: "App to share your screen with any friend", // Breve descripción.
    images: ["/icon.webp"], // Imagen que se mostrará.
  },
  robots: {
    index: true, // Permite que los motores de búsqueda indexen la página.
    follow: true, // Permite que los motores sigan los enlaces de la página.
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased  h-screen w-screen`}
      >
        <div className="h-full  w-full grid grid-rows-[1fr_8fr_1fr] ">
          <header className="h-full w-screen flex items-center justify-center">
            <p className="flex h-full text-4xl items-center text-white">
              Screen Sharer
            </p>
          </header>
          <main className="h-full">
          <AppRouterCacheProvider>{children} </AppRouterCacheProvider></main>
          <footer className="h-full w-screen font-bold flex items-center px-20 py-10 gap-2 justify-end   ">
           
              <p className="">Created by: </p>
              <a
                className="text-red-500 hover:scale-110 transition duration-300"
                target="_blank"
                rel="noopener noreferrer"
                href="https://diegotorres-portfoliodev.vercel.app"
              >
                Diego Torres
              </a>
            
          </footer>
        </div>
      </body>
    </html>
  );
}
