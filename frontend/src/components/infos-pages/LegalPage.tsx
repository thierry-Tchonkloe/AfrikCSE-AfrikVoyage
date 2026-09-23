"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { MapPin, Landmark, FileText, DollarSign, Hash, Zap, Scale, MailOpen, Mail, Lock, Phone, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"infos.legalPage">>;

const getLegalSections = (t: Translator) => ([
  {
    title: t("text1PublisherSitePlatform"),
    body: t("unifiedAfrikvoyageAfrikcse"),
  },
  {
    title: t("text2HostingDataLocation"),
    body: t("lineCommitmentDigital"),
  },
  {
    title: t("text3IntellectualPropertyUsage"),
    body: t("compositionIntellectual"),
  },
  {
    title: t("text4ApplicableTermsUse"),
    body: t("accessUsePlatformImply"),
  },
  {
    title: t("text5LegalLiabilityWarranties"),
    body: t("waxehoSLiabilityWaxeho"),
  },
  {
    title: t("text6GoverningLawMediation"),
    body: t("governingLawTheseLegal"),
  },
  {
    title: t("text7EntryIntoForce"),
    body: t("theseLegalNoticesEntered"),
  },
]);

const getHighlights = (t: Translator): { label: string; value: string; Icon: LucideIcon }[] => ([
  { label: t("registeredOffice"), value: "Paris, France", Icon: MapPin },
  { label: t("rcs"), value: "924 852 741", Icon: Landmark },
  { label: t("siret"), value: "924 852 741 00012", Icon: FileText },
  { label: t("shareCapital"), value: "150 000 €", Icon: DollarSign },
  { label: t("vat"), value: "FR44924852741", Icon: Hash },
  { label: t("warranty"), value: t("text999Sla"), Icon: Zap },
]);

export default function LegalPage() {
  const t = useTranslations("infos.legalPage");
  const LEGAL_SECTIONS = useMemo(() => getLegalSections(t), [t]);
  const HIGHLIGHTS = useMemo(() => getHighlights(t), [t]);
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
      {/* ── HERO AVEC EFFET ELECTRIC INDIGO ── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent" />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 backdrop-blur-sm">
            <Scale className="w-3.5 h-3.5" />
            {t("legalFrameworkCompliance")}
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t("legalNotices")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            {t("fullTransparencyIdentity")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {t("gdprCompliant")}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {t("soc2TypeIi")}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              {t("sovereignHosting")}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              {t("ohadaLaw")}
            </span>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            {t("lastUpdatedJune15")}
          </p>
        </div>
      </section>

      {/* ── CARTES D'IDENTITÉ JURIDIQUE (EFFET WOAH) ── */}
      <section className="mx-auto max-w-6xl px-4 -mt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:grid-cols-3 md:grid-cols-6">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center transition hover:border-indigo-200"
            >
              <item.Icon className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                {item.label}
              </span>
              <span className="text-[11px] font-medium text-slate-700">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL EN ACCORDÉON ── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {LEGAL_SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white transition-all hover:border-slate-300"
            >
              <button
                onClick={() => setOpenSection(openSection === idx ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <h2 className="text-base font-bold text-slate-900 lg:text-lg">
                  {section.title}
                </h2>
                <svg
                  className={`h-5 w-5 text-indigo-500 transition-transform duration-200 ${
                    openSection === idx ? "rotate-180" : ""
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
              {openSection === idx && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-2">
                  <div className="prose prose-sm prose-slate max-w-none">
                    {section.body.split("\n").map((line, i) => {
                      if (line.startsWith("**") && line.endsWith("**"))
                        return (
                          <h3
                            key={i}
                            className="mt-3 text-sm font-bold text-indigo-600 first:mt-0"
                          >
                            {line.replace(/\*\*/g, "")}
                          </h3>
                        );
                      if (line.startsWith("•"))
                        return (
                          <li key={i} className="ml-4 text-sm text-slate-600">
                            {line.substring(1)}
                          </li>
                        );
                      if (line.trim() === "") return <br key={i} />;
                      return (
                        <p key={i} className="text-sm leading-relaxed text-slate-600">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION CONTACT CONFORMITÉ ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/30 to-white p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-600">
                <MailOpen className="w-5 h-5 shrink-0" />
                {t("legalComplianceQuestions")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("legalTeamDpoDisposal")}
              </p>
            </div>
            <Link
              href="/infos/contact"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              {t("contactLegalDepartment")}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {t("legalAfrikworkspaceCom")}
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {t("dpoDpoAfrikworkspaceCom")}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {t("text3312345")}
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {t("text15RueDeLa")}
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTE SUR LES COOKIES (BANNIÈRE SIMULÉE) ── */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-sm sm:left-auto sm:right-4">
        <p className="text-slate-600">
          {t("useEssentialCookies")}{" "}
          <Link href="/infos/privacy" className="text-indigo-500 underline">
            {t("learnMore")}
          </Link>
        </p>
      </div>
    </main>
  );
}