import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// THIS IS FOR ACETERNITY UI COMPONENTS

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
