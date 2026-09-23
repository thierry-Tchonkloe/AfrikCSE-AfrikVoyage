import type { routing } from "@/i18n/routing";
import type messages from "../messages/fr.json";

// Typage strict des clés de traduction : `t("common.typo")` échoue à la compilation.
declare module "next-intl" {
    interface AppConfig {
        Locale: (typeof routing.locales)[number];
        Messages: typeof messages;
    }
}
