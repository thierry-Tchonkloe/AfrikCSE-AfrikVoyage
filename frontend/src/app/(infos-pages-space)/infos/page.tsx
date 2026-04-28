import HeroSection from "@/components/infos-pages/HeroSection";
import ChallengesAndSolutions from "@/components/infos-pages/ChallengesAndSolutions";
import BenefitsAndTrust from "@/components/infos-pages/BenefitsAndTrust";


export default function InfosPage() {
    return (
        <div className="bg-white">
            <HeroSection />
            <ChallengesAndSolutions />
            <BenefitsAndTrust />
        </div>
    );
}