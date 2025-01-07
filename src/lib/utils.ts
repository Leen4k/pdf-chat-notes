import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getRandomColor = () => {
  // Predefined set of colors that work well for cursors
  const colors = [
    "#E57373", // Red
    "#64B5F6", // Blue
    "#81C784", // Green
    "#FFB74D", // Orange
    "#BA68C8", // Purple
    "#4DB6AC", // Teal
    "#FF8A65", // Deep Orange
    "#A1887F", // Brown
    "#90A4AE", // Blue Grey
    "#4FC3F7", // Light Blue
    "#FFF176", // Yellow
    "#FF8A80", // Red Accent
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};