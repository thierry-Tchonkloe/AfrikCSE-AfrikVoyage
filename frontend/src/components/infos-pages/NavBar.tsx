"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
    { label: "Home", href: "/infos" },
    { label: "About", href: "/infos/about" },
    { label: "How it works", href: "/infos/how-it-works" },
    { label: "Contact", href: "/infos/contact" },
    { label: "Join us", href: "/infos/join-us" }
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [lang, setLang] = useState<"EN" | "FR">("EN");

    return (
        <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
                </div>
                <span className="text-teal-800 font-bold text-base sm:text-lg whitespace-nowrap">
                AfrikCSE &amp; AfrikVoyage
                </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                {NAV_LINKS.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-600 hover:text-teal-700 text-sm font-medium transition-colors duration-200"
                >
                    {link.label}
                </Link>
                ))}
            </nav>

            {/* Right: Lang + CTA */}
            <div className="hidden md:flex items-center gap-4">
                {/* Language switcher */}
                <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                <button
                    onClick={() => setLang("EN")}
                    className={`px-1 transition-colors ${lang === "EN" ? "text-teal-700 font-semibold" : "hover:text-teal-600"}`}
                >
                    EN
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => setLang("FR")}
                    className={`px-1 transition-colors ${lang === "FR" ? "text-teal-700 font-semibold" : "hover:text-teal-600"}`}
                >
                    FR
                </button>
                </div>

                <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors"
                >
                My Spaces
                </Link>

                <Link
                href="/infos/demo"
                className="bg-teal-900 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                Request a demo
                </Link>
            </div>

            {/* Mobile: lang + burger */}
            <div className="flex md:hidden items-center gap-3">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                <button
                    onClick={() => setLang("EN")}
                    className={`px-1 ${lang === "EN" ? "text-teal-700 font-semibold" : ""}`}
                >
                    EN
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => setLang("FR")}
                    className={`px-1 ${lang === "FR" ? "text-teal-700 font-semibold" : ""}`}
                >
                    FR
                </button>
                </div>

                <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
                >
                {menuOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
                </button>
            </div>
            </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1 animate-fade-in">
            {NAV_LINKS.map((link) => (
                <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                {link.label}
                </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block py-2 px-3 text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors"
                >
                My Spaces
                </Link>
                <Link
                href="/infos/demo"
                onClick={() => setMenuOpen(false)}
                className="block text-center bg-teal-900 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                Request a demo
                </Link>
            </div>
            </div>
        )}
        </header>
    );
}