import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine et déduplique les classes Tailwind CSS.
 * Utilisation : cn("px-4 py-2", isActive && "bg-blue-500", "py-3")
 * → "px-4 bg-blue-500 py-3" (py-2 est remplacé par py-3)
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}