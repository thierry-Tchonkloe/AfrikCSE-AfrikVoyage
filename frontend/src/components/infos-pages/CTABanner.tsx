import Link from "next/link";

interface CTABannerProps {
    title?: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
}

export default function CTABanner({
    title = "Commencez votre transformation digitale dès aujourd'hui",
    subtitle = "Rejoignez les centaines d'entreprises qui optimisent déjà leurs voyages d'affaires et avantages employés avec notre solution",
    primaryLabel = "Demander une démo gratuite",
    primaryHref = "/infos/demo",
    secondaryLabel = "Parler à un expert",
    secondaryHref = "/infos/contact",
}: CTABannerProps) {
    return (
        <section
        className="relative w-full overflow-hidden"
        style={{
            background: "linear-gradient(135deg, #0d2340 0%, #0e6e6e 50%, #00b894 100%)",
        }}
        >
        {/* Subtle texture overlay */}
        <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
            backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center">
            {/* Title */}
            <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl leading-snug mb-4 sm:mb-6">
            {title}
            </h2>

            {/* Subtitle */}
            <p className="text-white/80 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
                href={primaryHref}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-900 font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-colors duration-200 whitespace-nowrap shadow-md"
            >
                {primaryLabel}
            </Link>
            <Link
                href={secondaryHref}
                className="w-full sm:w-auto border border-white/70 hover:border-white hover:bg-white/10 active:bg-white/20 text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap"
            >
                {secondaryLabel}
            </Link>
            </div>
        </div>
        </section>
    );
}