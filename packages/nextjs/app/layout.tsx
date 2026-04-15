import { Space_Grotesk } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
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

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={`${spaceGrotesk.variable} font-space-grotesk`}>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
