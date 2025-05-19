import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import availSnap from "../assets/images/availsnap.png";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const ASSETS_PATH = {
  fonts: {
    PPMoriRegular: "../assets/fonts/PPMori-Regular.otf",
    PPMoriSemiBold: "../assets/fonts/PPMori-SemiBold.otf",
    ThicccboiBold: "../assets/fonts/THICCCBOI-Bold.woff2",
    ThicccboiMedium: "../assets/fonts/THICCCBOI-Medium.woff2",
    ThicccboiRegular: "../assets/fonts/THICCCBOI-Regular.otf",
    ThicccboiSemiBold: "../assets/fonts/THICCCBOI-SemiBold.otf",
  },
  images: {
    availSnap,
  },
};
