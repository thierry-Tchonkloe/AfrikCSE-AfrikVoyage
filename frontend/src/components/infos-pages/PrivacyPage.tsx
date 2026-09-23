"use client";

import { Link } from "@/i18n/navigation";
import { useState, useMemo } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.privacyPage">>;

const getCookieCategories = (t: Translator) => ([
  {
    id: "necessary",
    title: t("strictlyNecessary"),
    description:
      t("ensureWorkspaceSwitcherWorks"),
    required: true,
  },
  {
    id: "performance",
    title: t("performanceCookies"),
    description:
      t("helpUsAnalyzeAnonymous"),
    required: false,
  },
  {
    id: "personalization",
    title: t("personalizationCookies"),
    description:
      t("automaticallyAdaptService"),
    required: false,
  },
]);

const getFaq = (t: Translator) => ([
  {
    q: t("afrikvoyageAfrikcseJoint"),
    a: t("yesAfrikvoyageAfrikcseAct"),
  },
  {
    q: t("whereMyDataHosted"),
    a: t("canChooseBetweenSovereign"),
  },
  {
    q: t("doReceiptsScannedAi"),
    a: t("yesDigitalArchivingComplies"),
  },
  {
    q: t("canIRefuseHave"),
    a: t("minimalSharingNecessary"),
  },
]);

const getSections = (t: Translator) => ([
  {
    title: t("text1DataCollectionNature"),
    body: t("afrikvoyageAfrikcseOnly"),
  },
  {
    title: t("text2PurposesHowData"),
    body: t("dataFuelAlgorithmsAlways"),
  },
  {
    title: t("text3LegalBasisTransparency"),
    body: t("processDataFollowingBases"),
  },
  {
    title: t("text4RetentionPeriod"),
    body: t("activeAccountDataEntire"),
  },
  {
    title: t("text5SharingTransferControlled"),
    body: t("neverSellPersonalData"),
  },
  {
    title: t("text6SecurityCompliance"),
    body: t("certificationsGdprBuilt"),
  },
  {
    title: t("text7CookieManagementConsent"),
    body: t("haveFullControlOver"),
    isCookieSection: true,
  },
  {
    title: t("text8RightsAccessControl"),
    body: t("haveFollowingRightsWhich"),
  },
]);

export default function PrivacyPage() {
  const tr = useTranslations("infos.privacyPage");
  const t = useTranslations("infos.privacyPage");
  const COOKIE_CATEGORIES = useMemo(() => getCookieCategories(t), [t]);
  const FAQ = useMemo(() => getFaq(t), [t]);
  const SECTIONS = useMemo(() => getSections(t), [t]);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    performance: false,
    personalization: false,
  });
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleCookieChange = (id: string, value: boolean) => {
    setCookieSettings((prev) => ({ ...prev, [id]: value }));
  };

  const saveCookiePreferences = () => {
    localStorage.setItem("cookieConsent", JSON.stringify(cookieSettings));
    setShowCookieBanner(false);
    // Ici, vous pouvez également implémenter l'activation/désactivation réelle des cookies
  };

  return (
    <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
      {/* ── HERO AVEC EFFET WOAH ── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white py-20 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/30 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 backdrop-blur-sm">
            <Lock className="w-3.5 h-3.5" />
            {t("absoluteTrust")}
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t("privacyPolicy")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            {t("afrikvoyageAfrikcse")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("gdprCompliant")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("soc2TypeIi")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
              {t("sovereignHosting")}
            </span>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            {t("lastUpdatedJune15")}
          </p>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL (ACCORDÉON POUR LES SECTIONS) ── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white transition-all hover:border-slate-300"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <h2 className="text-base font-bold text-slate-900 lg:text-lg">
                  {section.title}
                </h2>
                <svg
                  className={`h-5 w-5 text-indigo-500 transition-transform duration-200 ${
                    openFaqIndex === idx ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openFaqIndex === idx && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-2">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {section.body}
                  </p>

                  {/* Section spécifique des cookies en Bento Grid */}
                  {section.isCookieSection && (
                    <div className="mt-6">
                      <h3 className="mb-3 text-sm font-bold text-indigo-600">
                        {t("cookieCategories")}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {COOKIE_CATEGORIES.map((cat) => (
                          <div
                            key={cat.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/40 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                {cat.title}
                              </span>
                              {cat.required ? (
                                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                  {t("required")}
                                </span>
                              ) : (
                                <label className="relative inline-flex cursor-pointer items-center">
                                  <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={
                                      cookieSettings[
                                        cat.id as keyof typeof cookieSettings
                                      ]
                                    }
                                    onChange={(e) =>
                                      handleCookieChange(cat.id, e.target.checked)
                                    }
                                  />
                                  <div className="peer h-4 w-7 rounded-full bg-slate-300 after:absolute after:start-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-500 peer-checked:after:translate-x-3"></div>
                                </label>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {cat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={saveCookiePreferences}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          {t("saveMyPreferences")}
                        </button>
                      </div>
                      <p className="mt-3 text-center text-[10px] text-slate-400">
                        {t("canAlsoExerciseRight")}{" "}
                        <button className="text-indigo-500 underline">
                          {t("doNotSell")}
                        </button>{" "}
                        {t("refuseAnyCommercialSharing")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION SPÉCIFIQUE : DROITS DES UTILISATEURS (AVEC DASHBOARD) ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-600">
                <Sparkles className="w-5 h-5 shrink-0" />
                {t("complianceDashboard")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("viewControlStatusData")}
              </p>
            </div>
            <Link
              href="/infos/privacy/dashboard"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              {t("goMyDashboard")}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">12</span>
              <span className="text-slate-500">{t("requestsProcessed")}</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">48h</span>
              <span className="text-slate-500">{t("averageResponseTime")}</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">100%</span>
              <span className="text-slate-500">{t("successfulRequests")}</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-amber-600">AES-256</span>
              <span className="text-slate-500">{t("endEndEncryption")}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-slate-400">
            {tr.rich("canAlsoExerciseRights", { a1: (chunks) => <a
              href="mailto:dpo@afrikworkspace.com"
              className="text-indigo-500 underline"
            >{chunks}</a> })}
          </p>
        </div>
      </section>

      {/* ── FAQ ADDITIONNELLE (DIVULGATION PROGRESSIVE) ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">
          {t("frequentlyAskedQuestions")}
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx + 100 ? null : idx + 100)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-slate-800">{item.q}</span>
                <svg
                  className={`h-4 w-4 text-indigo-500 transition-transform ${
                    openFaqIndex === idx + 100 ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openFaqIndex === idx + 100 && (
                <div className="border-t border-slate-100 px-4 pb-4">
                  <p className="text-sm text-slate-600">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── BANNIÈRE COOKIES (SIMULÉE) ── */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:right-auto">
          <p className="text-xs text-slate-600">
            {t("useCookiesEssentialPlatform")}{" "}
            <button
              onClick={() => setShowCookieBanner(false)}
              className="text-indigo-500 underline"
            >
              {t("customize")}
            </button>
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setCookieSettings({ necessary: true, performance: false, personalization: false });
                saveCookiePreferences();
              }}
              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {t("refuseAll")}
            </button>
            <button
              onClick={() => {
                setCookieSettings({ necessary: true, performance: true, personalization: true });
                saveCookiePreferences();
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
            >
              {t("acceptAll")}
            </button>
          </div>
        </div>
      )}

      {/* ── MICRO-INTERACTIONS (SCRIPT PERSO POUR L'EFFET WOAH) ── */}
      <style jsx global>{`
        .accordion-content {
          transition: max-height 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}