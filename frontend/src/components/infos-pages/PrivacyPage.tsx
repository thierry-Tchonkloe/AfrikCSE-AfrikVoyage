"use client";

import Link from "next/link";
import { useState } from "react";

const COOKIE_CATEGORIES = [
  {
    id: "necessary",
    title: "Strictement nécessaires",
    description:
      "Assurent le fonctionnement du Workspace Switcher, l’authentification sécurisée et la mémorisation de vos consentements. Ils ne peuvent être désactivés.",
    required: true,
  },
  {
    id: "performance",
    title: "Cookies de performance",
    description:
      "Nous aident à analyser l’utilisation anonyme de la plateforme (ex : pages visitées, ROI des administrateurs) pour améliorer nos services.",
    required: false,
  },
  {
    id: "personalization",
    title: "Cookies de personnalisation",
    description:
      "Adaptent automatiquement la Service Gallery et les avantages suggérés à vos préférences pour une expérience plus pertinente.",
    required: false,
  },
];

const FAQ = [
  {
    q: "AfrikVoyage et AfrikCSE sont-ils responsables conjoints du traitement de mes données ?",
    a: "Oui. AfrikVoyage et AfrikCSE agissent en tant que co‑responsables de traitement pour les finalités communes (ex. optimisation des dépenses, bien‑être des collaborateurs). Chaque entité reste responsable de ses traitements spécifiques.",
  },
  {
    q: "Où sont hébergées mes données ? Puis‑je choisir la localisation ?",
    a: "Vous avez le choix entre des datacenters souverains en Afrique (région Ouest/Afrique du Sud) ou en Europe (France). Ce choix est configurable lors de l’onboarding.",
  },
  {
    q: "Les justificatifs scannés par l’IA ont‑ils une valeur légale ?",
    a: "Oui. Notre archivage numérique respecte les normes eIDAS et la législation fiscale locale. Le justificatif scanné par l’IA a la même valeur probante que l’original papier.",
  },
  {
    q: "Puis‑je refuser le partage de mes données avec des partenaires (compagnies, Netflix, etc.) ?",
    a: "Le partage minimal est nécessaire à la fourniture des services (réservation, activation des avantages). Vous pouvez cependant vous opposer à tout partage à des fins marketing via votre dashboard de conformité.",
  },
];

const SECTIONS = [
  {
    title: "1. Collecte et nature des données",
    body: `Chez AfrikVoyage & AfrikCSE, nous collectons uniquement les données nécessaires à l’excellence de nos services, segmentées selon votre utilisation.

• AfrikVoyage : identité (nom, prénom, email, poste, département), préférences de voyage, passeports/visas, données de paiement, tickets de frais scannés par IA (OCR).
• AfrikCSE : choix d’avantages (ex. chèques resto, abonnements sportifs), utilisation de la billetterie, réponses aux sondages de satisfaction.
• Données de performance : calcul d’empreinte carbone, KPI de conformité RSE, analyse des flux budgétaires.

Nous ne collectons jamais de données sensibles sans consentement explicite (ex. santé sauf pour assurance voyage spécifique).`,
  },
  {
    title: "2. Finalités : comment vos données alimentent l’intelligence de la plateforme",
    body: `Vos données sont le carburant de nos algorithmes, toujours dans votre intérêt :

• Moteur IA « Sam » : anticipe les perturbations de vols, reprogramme automatiquement itinéraires et hôtels, et met à jour vos agendas.
• Gestion des dépenses : automatisation du flux de données vers votre ERP (SAP, Oracle, Odoo) pour un reporting financier en temps réel.
• Bien-être & RSE : suivi des indicateurs de santé des voyageurs (alertes anonymisées) et réduction de l’empreinte carbone via des recommandations d’itinéraires sobres.
• Sécurité : analyse comportementale pour détecter et bloquer les accès anormaux.`,
  },
  {
    title: "3. Base légale et transparence",
    body: `Nous traitons vos données sur les bases suivantes :
• Exécution du contrat entre votre organisation et AfrikVoyage/AfrikCSE (obligatoire pour fournir le service).
• Intérêt légitime : assurer la sécurité, améliorer nos algorithmes (avec minimisation), et prévenir la fraude.
• Consentement pour les cookies de personnalisation, le partage marketing, ou l’activation de fonctionnalités beta.
• Obligations légales (conservation des justificatifs fiscaux, etc.).`,
  },
  {
    title: "4. Durée de conservation",
    body: `• Données de compte actif : toute la durée de la relation contractuelle + 3 mois (pré‑archivage).
• Justificatifs de frais (scannés) : 10 ans fiscaux (conformément aux législations locales).
• Données anonymisées ou pseudonymisées : conservées indéfiniment à des fins statistiques.
• Cookies : 13 mois maximum (sauf nécessaires, supprimés en fin de session).`,
  },
  {
    title: "5. Partage et transfert – Votre écosystème maîtrisé",
    body: `Nous ne vendons jamais vos données personnelles. Les seuls partages sont :
• Avec les fournisseurs de voyages (compagnies aériennes, hôtels, GDS) pour effectuer vos réservations.
• Avec les plateformes d’avantages (Netflix, Amazon, Sodexo) pour activer vos crédits CSE.
• Avec vos administrateurs internes (accès restreint sur le principe du need‑to‑know).
• Transferts hors UE encadrés par des Clauses Contractuelles Types (SCC) et une analyse de protection des données.

Tout partage est chiffré de bout en bout et soumis à un accord de confidentialité.`,
  },
  {
    title: "6. Sécurité et conformité – Le socle de confiance absolue",
    body: `• Certifications : RGPD (conformité intégrée) et SOC 2 Type II (audit annuel indépendant).
• Hébergement souverain au choix : OVHcloud (France) ou Africa Data Centres (Johannesburg, Casablanca).
• Chiffrement : AES‑256 au repos, TLS 1.3 en transit. Clés gérées par un HSM (Hardware Security Module).
• Contrôle d’accès : zéro accès humain par défaut. Les données sensibles (passeports) ne sont visibles que par des algorithmes, sauf support client avec authentification forte et session dédiée.
• Archivage probant : nos justificatifs numériques sont horodatés et signés électroniquement, conformément à la loi n° 2000‑230 du 13 mars 2000 (France) et aux législations UEMOA.`,
  },
  {
    title: "7. Gestion des cookies et consentement",
    body: `Vous maîtrisez totalement vos préférences via notre bannière de consentement (accessible à tout moment en bas de page). Les catégories sont détaillées ci‑contre. Vous pouvez retirer votre consentement à tout moment.`,
    isCookieSection: true,
  },
  {
    title: "8. Vos droits – Accès, contrôle et portabilité",
    body: `Vous disposez des droits suivants, que vous pouvez exercer directement depuis votre tableau de bord ou en nous contactant :
• Droit d’accès et de rectification : visualisez et corrigez vos données en temps réel.
• Droit à l’effacement : demandez la suppression de vos données après la relation contractuelle.
• Droit à la limitation : suspendez certains traitements (ex. cookies de personnalisation).
• Droit à la portabilité : récupérez une copie structurée de vos données (JSON/CSV).
• Droit d’opposition : refusez le partage marketing ou l’utilisation à des fins d’IA prédictive (sans impact sur le service de base).
• Droit de ne pas faire l’objet d’une décision automatisée : vous pouvez demander une révision humaine pour toute réservation annulée automatiquement.`,
  },
];

export default function PrivacyPage() {
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
            🔒 Confiance absolue
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Politique de confidentialité
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            AfrikVoyage & AfrikCSE : La protection de vos données n’est pas une
            contrainte, c’est le socle de notre plateforme d’excellence.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> RGPD
              compliant
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> SOC 2
              Type II
            </span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
              Hébergement souverain
            </span>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Dernière mise à jour : 15 juin 2026
          </p>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL (ACCORDÉON POUR LES SECTIONS) ── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
                        Catégories de cookies
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
                                  Obligatoire
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
                          Enregistrer mes préférences
                        </button>
                      </div>
                      <p className="mt-3 text-center text-[10px] text-slate-400">
                        Vous pouvez également exercer votre droit{" "}
                        <button className="text-indigo-500 underline">
                          « Do Not Sell »
                        </button>{" "}
                        pour refuser tout partage commercial.
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
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-indigo-600">
                ✨ Tableau de bord de conformité
              </h3>
              <p className="text-sm text-slate-600">
                Visualisez et contrôlez l’état de vos données en temps réel.
              </p>
            </div>
            <Link
              href="/infos/privacy/dashboard"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              Accéder à mon dashboard
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">12</span>
              <span className="text-slate-500">demandes traitées</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">48h</span>
              <span className="text-slate-500">délai moyen de réponse</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-emerald-600">100%</span>
              <span className="text-slate-500">des demandes abouties</span>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <span className="block font-black text-amber-600">AES-256</span>
              <span className="text-slate-500">chiffrement de bout en bout</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-slate-400">
            Vous pouvez également exercer vos droits (accès, rectification,
            effacement, portabilité) par email à{" "}
            <a
              href="mailto:dpo@afrikworkspace.com"
              className="text-indigo-500 underline"
            >
              dpo@afrikworkspace.com
            </a>{" "}
            ou via le formulaire de contact.
          </p>
        </div>
      </section>

      {/* ── FAQ ADDITIONNELLE (DIVULGATION PROGRESSIVE) ── */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">
          Questions fréquentes sur la confidentialité
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
            Nous utilisons des cookies essentiels au fonctionnement de la plateforme
            (authentification, Workspace Switcher) et, avec votre accord, des cookies
            analytiques et de personnalisation.{" "}
            <button
              onClick={() => setShowCookieBanner(false)}
              className="text-indigo-500 underline"
            >
              Personnaliser
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
              Refuser tout
            </button>
            <button
              onClick={() => {
                setCookieSettings({ necessary: true, performance: true, personalization: true });
                saveCookiePreferences();
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Accepter tout
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