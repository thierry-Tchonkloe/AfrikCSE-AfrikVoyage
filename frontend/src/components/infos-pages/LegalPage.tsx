"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Landmark, FileText, DollarSign, Hash, Zap, Scale, MailOpen, Mail, Lock, Phone, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const LEGAL_SECTIONS = [
  {
    title: "1. Éditeur du site et de la plateforme",
    body: `La plateforme unifiée AfrikVoyage & AfrikCSE (ci-après « la Plateforme ») est éditée par :

**Waxeho**
Société par actions simplifiée au capital de 150 000 €
Immatriculée au RCS de Paris sous le numéro 924 852 741
Numéro de TVA intracommunautaire : FR44924852741
Siège social : 15 rue de la Paix, 75002 Paris, France

**Directeur de la publication :** Richnel AGAZOUNON, Président

**Contact dédié conformité :** legal@afrikworkspace.com
**Téléphone :** +33 1 23 45 67 89

La Plateforme opère sous les marques déposées AfrikVoyage® et AfrikCSE®, enregistrées à l’INPI et à l’OAPI (Organisation Africaine de la Propriété Intellectuelle).`,
  },
  {
    title: "2. Hébergement et localisation des données",
    body: `Conformément à notre engagement de souveraineté numérique, les infrastructures sont réparties selon la nature des services :

**Infrastructure applicative principale**
• **Render, Inc.** (siège : 525 Brannan St, San Francisco, CA 94107, États-Unis)
• **Vercel Inc.** (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis)
→ Hébergement des sites vitrines, espaces clients authentifiés et APIs publiques.
→ Transferts encadrés par les Clauses Contractuelles Types (SCC) de la Commission Européenne.

**Hébergement des données personnelles et sensibles** (au choix du client)
• **Option Afrique** : Africa Data Centres (Johannesburg, Afrique du Sud ; Casablanca, Maroc)
• **Option Europe** : OVHcloud (Roubaix, France) – Data Center certifié ISO 27001, HDS, SecNumCloud

**Sécurité physique et logique**
• Chiffrement AES-256 au repos, TLS 1.3 en transit
• Contrôle d’accès par réseau privé virtuel (VPN) et authentification multi-facteurs pour les administrateurs
• Sauvegarde quotidienne avec rétention 30 jours

**Disponibilité contractuelle** : 99,9 % (SLA applicable aux offres Business et Enterprise).`,
  },
  {
    title: "3. Propriété intellectuelle et droits d’usage",
    body: `**Composition de la propriété intellectuelle**

L’intégralité des éléments composant la Plateforme et ses déclinaisons (sites web, applications mobiles, API, interfaces d’administration) sont protégés par le droit d’auteur, le droit des marques et le droit des brevets :

• **Logiciels et code source** : propriété exclusive de Waxeho – tout reverse engineering, décompilation ou extraction non autorisée est interdit (art. L122-6-1 du CPI).
• **Design UI/UX, charte graphique, icônes, typographies** : œuvres originales protégées.
• **Marques verbales et semi-figuratives** : AfrikVoyage®, AfrikCSE®, AfrikWorkspace®, le logo au « A » dynamique.
• **Contenus générés par l’IA** (rapports prédictifs, heatmaps) : appartiennent au client sous réserve du respect des droits de Waxeho sur l’outil.

**Licence d’utilisation concédée au client**
Dans le cadre d’un abonnement actif, Waxeho accorde une licence mondiale, non exclusive, non transférable et limitée dans le temps pour accéder et utiliser la Plateforme conformément à la documentation et aux politiques internes de l’organisation.

**Liens hypertextes** : autorisés vers la page d’accueil publique, sous réserve de mention claire de la source. Tout lien profond ou framing est interdit sans accord écrit préalable.`,
  },
  {
    title: "4. Conditions générales d’utilisation (CGU) applicables",
    body: `L’accès et l’utilisation de la Plateforme impliquent l’acceptation pleine et entière des présentes mentions légales ainsi que des documents contractuels suivants, accessibles sur demande ou dans l’espace dédié :

• **Conditions Générales de Service (CGS)** – applicables à toutes les organisations clientes.
• **Politique de Confidentialité** – traitement des données personnelles (RGPD, SOC 2).
• **Contrat de sous-traitance (DPA)** – encadrant les relations avec nos propres sous-traitants.
• **Politique de Sécurité** – mesures techniques et organisationnelles détaillées.

**Modifications** : Waxeho se réserve le droit de modifier à tout moment les présentes mentions légales. Les modifications sont opposables dès leur publication en ligne. Pour les clients sous contrat, une notification par email est adressée au moins 15 jours avant l’entrée en vigueur des changements substantiels.

**Suspension et résiliation** : En cas de violation grave des CGU ou des lois applicables (ex. fraude, accès non autorisé, mise en danger des données), Waxeho peut suspendre immédiatement l’accès à la Plateforme, sans préjudice des actions judiciaires.`,
  },
  {
    title: "5. Responsabilité légale et garanties",
    body: `**Responsabilité de Waxeho**
Waxeho s’engage à fournir la Plateforme conformément aux spécifications du contrat et aux meilleurs standards du marché SaaS. La responsabilité de Waxeho ne saurait être engagée en cas de :
• Force majeure telle que définie par la jurisprudence française et le droit OHADA.
• Utilisation anormale ou non conforme de la Plateforme par le client ou ses utilisateurs finaux.
• Interruption temporaire pour maintenance programmée (notifiée au moins 48h à l’avance) ou maintenance d’urgence pour raison de sécurité.
• Dommages indirects (perte d’exploitation, perte de clientèle, atteinte à l’image), sauf disposition impérative de la loi.

**Garantie légale de conformité** (art. L217-4 et suivants du Code de la consommation) : Waxeho garantit que la Plateforme est conforme à l’usage attendu et exempte de défauts cachés. Le client peut agir dans un délai de deux ans à compter de la découverte du défaut.

**Responsabilité du client**
Le client est seul responsable :
• De la confidentialité des identifiants de ses utilisateurs (authentification forte recommandée).
• De la légalité des données qu’il importe dans la Plateforme (ex. données personnelles des collaborateurs avec leur consentement).
• Du respect de ses propres obligations légales (droit du travail, fiscalité, conventions collectives).

**Limitation de responsabilité** : Sauf en cas de dommages corporels, de violation délibérée ou de faute lourde, la responsabilité totale de Waxeho est limitée au montant des frais payés par le client au cours des 12 mois précédant l’événement.`,
  },
  {
    title: "6. Droit applicable, médiation et juridictions compétentes",
    body: `**Droit applicable**
Les présentes mentions légales et les relations contractuelles avec nos clients sont régies par le droit français, à l’exclusion des règles de conflit de lois. Pour les clients ayant leur siège dans un État membre de l’OHADA, les dispositions du droit uniforme des affaires s’appliquent en complément.

**Médiation et règlement extrajudiciaire des litiges**
Avant toute action judiciaire, le client et Waxeho s’efforcent de résoudre leur différend à l’amiable.
• Médiateur de la consommation : CNPM – Médiation de la consommation (délai de saisine : un an à compter de la réclamation écrite).
• Plateforme de RLL en ligne : https://ec.europa.eu/consumers/odr (pour les consommateurs européens, le cas échéant).

**Juridictions compétentes**
À défaut d’accord amiable, tout litige relatif à la validité, l’interprétation ou l’exécution des présentes mentions légales sera soumis :
• Aux tribunaux de Paris (France) pour les clients basés dans l’Union européenne.
• À l’arbitrage selon le règlement du CCJA (Cour Commune de Justice et d’Arbitrage de l’OHADA) pour les clients basés en Afrique de l’Ouest ou Centrale.
• Pour les autres pays, le tribunal de Paris reste compétent nonobstant pluralité de défendeurs ou appel en garantie.`,
  },
  {
    title: "7. Entrée en vigueur et modifications",
    body: `Les présentes mentions légales sont entrées en vigueur le **15 juin 2026**. Elles remplacent et annulent toute version antérieure.

**Conservation et preuve** : Waxeho conserve un archivage électronique des versions successives des mentions légales, accessible sur demande. Cet archivage fait foi jusqu’à preuve du contraire.

Pour toute question relative à ces mentions légales ou pour exercer vos droits, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l’adresse dpo@afrikworkspace.com ou par courrier à l’adresse du siège social.`,
  },
];

const HIGHLIGHTS: { label: string; value: string; Icon: LucideIcon }[] = [
  { label: "Siège social", value: "Paris, France", Icon: MapPin },
  { label: "RCS", value: "924 852 741", Icon: Landmark },
  { label: "SIRET", value: "924 852 741 00012", Icon: FileText },
  { label: "Capital", value: "150 000 €", Icon: DollarSign },
  { label: "TVE", value: "FR44924852741", Icon: Hash },
  { label: "Garantie", value: "99,9% SLA", Icon: Zap },
];

export default function LegalPage() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
      {/* ── HERO AVEC EFFET ELECTRIC INDIGO ── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent" />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 backdrop-blur-sm">
            <Scale className="w-3.5 h-3.5" />
            Cadre juridique et conformité
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Mentions légales
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Transparence totale sur l’identité, l’hébergement et les règles
            applicables à la plateforme AfrikVoyage & AfrikCSE.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              ✓ Conforme RGPD
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              ✓ SOC 2 Type II
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              ✓ Hébergement souverain
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              ✓ Droit OHADA
            </span>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Dernière mise à jour : 15 juin 2026
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
                Questions juridiques ou conformité ?
              </h3>
              <p className="text-sm text-slate-600">
                Notre équipe juridique et notre DPO sont à votre disposition.
              </p>
            </div>
            <Link
              href="/infos/contact"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              Contacter le service juridique
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              legal@afrikworkspace.com
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              DPO : dpo@afrikworkspace.com
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              +33 1 23 45 67 89 (standard)
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              15 rue de la Paix, 75002 Paris
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTE SUR LES COOKIES (BANNIÈRE SIMULÉE) ── */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-sm sm:left-auto sm:right-4">
        <p className="text-slate-600">
          Nous utilisons des cookies essentiels.{" "}
          <Link href="/infos/privacy" className="text-indigo-500 underline">
            En savoir plus
          </Link>
        </p>
      </div>
    </main>
  );
}