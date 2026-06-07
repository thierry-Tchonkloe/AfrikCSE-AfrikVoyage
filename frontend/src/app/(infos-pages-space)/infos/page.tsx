import HeroSection from "@/components/infos-pages/HeroSection";
import ChallengesAndSolutions from "@/components/infos-pages/ChallengesAndSolutions";
import PartnerMarquee from "@/components/infos-pages/PartnerMarquee";
import BenefitsAndTrust from "@/components/infos-pages/BenefitsAndTrust";


export default function InfosPage() {
    return (
        <div className="bg-white">
            <HeroSection />
            <ChallengesAndSolutions />
            <PartnerMarquee />
            <BenefitsAndTrust />
        </div>
    );
}