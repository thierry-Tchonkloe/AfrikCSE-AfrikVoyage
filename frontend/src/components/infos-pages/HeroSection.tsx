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
                    href="/demo"
                    className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-900 font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-colors duration-200 shadow-md whitespace-nowrap"
                >
                    Demander une démo
                </Link>
                <Link
                    href="/platform"
                    className="inline-flex items-center justify-center border border-white/60 hover:border-white hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap"
                >
                    Découvrir la plateforme
                </Link>
                </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="flex justify-center lg:justify-end">
                <div
                className="relative w-full max-w-130 rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "#f5f0eb" }}
                >
                {/* Mock dashboard */}
                <div className="bg-[#2d3250] rounded-xl m-3 overflow-hidden">
                    {/* Top bar */}
                    <div className="bg-[#1e2340] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-teal-400 font-bold text-xs">aisa</span>
                        <div className="flex gap-1">
                        {["Q List", "Coach", "Forecasting"].map((t) => (
                            <span key={t} className="bg-[#2d3250] text-gray-300 text-[9px] px-2 py-0.5 rounded">
                            {t}
                            </span>
                        ))}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {["Sign", "Sign Up", "Service"].map((t) => (
                        <span key={t} className="bg-teal-500 text-white text-[9px] px-2 py-0.5 rounded">
                            {t}
                        </span>
                        ))}
                    </div>
                    </div>

                    {/* Sub nav */}
                    <div className="bg-[#252a48] px-3 py-1.5 flex gap-1.5 flex-wrap">
                    {["Finances", "Rapports", "Budgets", "Planning", "Données"].map((t) => (
                        <span key={t} className="text-gray-400 text-[9px] px-2 py-0.5 rounded bg-[#1e2340]">
                        {t}
                        </span>
                    ))}
                    <div className="ml-auto flex gap-1">
                        {["Last Trade", "Cognitly", "Create Source"].map((t) => (
                        <span key={t} className="text-teal-300 text-[9px] px-2 py-0.5 rounded border border-teal-700">
                            {t}
                        </span>
                        ))}
                    </div>
                    </div>

                    {/* Charts grid */}
                    <div className="p-3 grid grid-cols-2 gap-2">
                    {/* Travel Wallet */}
                    <div className="bg-[#1e2340] rounded-lg p-2">
                        <p className="text-gray-300 text-[9px] mb-1 font-semibold">Travel Wallet</p>
                        <div className="flex items-end gap-0.5 h-10">
                        {[30, 50, 40, 60, 45, 70, 55, 80].map((h, i) => (
                            <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                                height: `${h}%`,
                                background: i === 5 ? "#00cec9" : "#3d4470",
                            }}
                            />
                        ))}
                        </div>
                    </div>

                    {/* Employee Benefits */}
                    <div className="bg-[#1e2340] rounded-lg p-2">
                        <p className="text-gray-300 text-[9px] mb-1 font-semibold">Employee Benefits</p>
                        <div className="flex items-end gap-0.5 h-10">
                        {[40, 60, 50, 70, 55, 80, 65, 90, 75].map((h, i) => (
                            <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                                height: `${h}%`,
                                background: i % 2 === 0 ? "#00b894" : "#fdcb6e",
                            }}
                            />
                        ))}
                        </div>
                    </div>

                    {/* Coordinates - line chart */}
                    <div className="bg-[#1e2340] rounded-lg p-2">
                        <p className="text-gray-300 text-[9px] mb-1 font-semibold">Coordination</p>
                        <svg viewBox="0 0 80 32" className="w-full h-10">
                        <polyline
                            points="0,28 10,22 20,25 30,15 40,18 50,8 60,12 70,6 80,10"
                            fill="none"
                            stroke="#00cec9"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                        </svg>
                    </div>

                    {/* EmployeInfo - bar */}
                    <div className="bg-[#1e2340] rounded-lg p-2">
                        <p className="text-gray-300 text-[9px] mb-1 font-semibold">EmployeInfo</p>
                        <div className="flex items-end gap-0.5 h-10">
                        {[60, 80, 50, 90, 65].map((h, i) => (
                            <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                                height: `${h}%`,
                                background: i % 2 === 0 ? "#e17055" : "#fdcb6e",
                            }}
                            />
                        ))}
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        </section>
    );
}