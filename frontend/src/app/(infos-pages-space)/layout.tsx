import NavBar from "@/components/infos-pages/NavBar";
import Footer from "@/components/infos-pages/Footer";

import CTABanner from "@/components/infos-pages/CTABanner";

export default function InfosPagesLayout({children,}: {children: React.ReactNode;}) {
    return(
        <>
            <NavBar />
            {children}
            <CTABanner/>
            <Footer/>
        </>
    );
}