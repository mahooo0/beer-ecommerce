import localFont from "next/font/local";
import { Montserrat, Poppins } from "next/font/google";

export const mursGothic = localFont({
  src: "../../public/fonts/mursgothic-widedark.otf",
  variable: "--font-murs-gothic",
  weight: "800",
  style: "normal",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-poppins",
  display: "swap",
});
