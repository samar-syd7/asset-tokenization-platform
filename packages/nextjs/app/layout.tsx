import { Space_Grotesk } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { Web3Provider } from "~~/components/Web3Provider";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "Asset Registry",
  description: "Tokenize and manage real-world assets with a secure on-chain registry.",
  openGraph: {
    title: "Asset Registry",
    description: "Tokenize and manage real-world assets with a secure on-chain registry.",
    images: [{ url: "http://localhost:3000/thumbnail.png" }],
  },
  twitter: {
    title: "Asset Registry",
    description: "Tokenize and manage real-world assets with a secure on-chain registry.",
    images: [{ url: "http://localhost:3000/thumbnail.png" }],
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={`${spaceGrotesk.variable} font-space-grotesk`}>
      <body>
        <ThemeProvider enableSystem>
          <Web3Provider>{children}</Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
