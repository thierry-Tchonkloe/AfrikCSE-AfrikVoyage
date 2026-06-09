import Link from "next/link";

export default function HeroSection() {
    return (
        <section
            className="relative w-full overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #0d2340 0%, #0e6e6e 60%, #00b894 100%)",
                minHeight: "calc(100vh - 64px)",
            }}
        >
        {/* Subtle ambient circles */}
        <div className="absolute inset-0 pointer-events-none">
            <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00cec9, transparent)" }}
            />
            <div
            className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #55efc4, transparent)" }}
            />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="flex flex-col gap-6">
                <h1 className="text-white font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Une plateforme pour gérer les voyages d&apos;affaires et les avantages employés
                </h1>
                <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-lg">
                AfrikVoyage &amp; AfrikCSE révolutionnent la gestion des déplacements professionnels et des
                comités sociaux et économiques pour les entreprises africaines et internationales.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link
                    href="/infos/demo"
                    className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-900 font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-colors duration-200 shadow-md whitespace-nowrap"
                >
                    Demander une démo
                </Link>
                <Link
                    href="/infos/platform"
                    className="inline-flex items-center justify-center border border-white/60 hover:border-white hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap"
                >
                    Découvrir la plateforme
                </Link>
                </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="flex justify-center lg:justify-end">
                <img src="/images/hero-home-image.png" alt="Dashboard mockup" className="max-w-full h-auto rounded-lg shadow-lg"/>
            </div>
            </div>
        </div>
        </section>
    );
}