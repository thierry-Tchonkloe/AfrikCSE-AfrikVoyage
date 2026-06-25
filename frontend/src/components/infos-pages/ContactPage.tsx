"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Globe, Zap, Lock, Users, Phone, Mail, MapPin, Copy, MessageCircle, ChevronDown, Settings } from "lucide-react";

// ─── Types & Data ────────────────────────────────────────────────────────────

interface FormData {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  companySize: string;
  workspace: "voyage" | "cse";
  message: string;
  acceptMarketing: boolean;
}

interface FormErrors {
  fullName?: string;
  company?: string;
  email?: string;
  message?: string;
}

type Status = "idle" | "loading" | "success" | "error";

const contactPhone = "+33 1 84 17 36 85";
const contactPhoneCompact = contactPhone.replace(/[^\d+]/g, "");
const whatsappPhone = contactPhone.replace(/\D/g, "");
const contactEmails = ["corp@afrikvoyage.com", "support@afrikcse.com"];

const companySizes = [
  "1 – 10 employés",
  "11 – 50 employés",
  "51 – 200 employés",
  "201 – 500 employés",
  "500+ employés",
];

const faqs = [
  {
    question: "Comment l'IA d'AfrikVoyage réduit-elle mes dépenses de 30% ?",
    answer:
      "Notre algorithme prédictif analyse les flux de voyages historiques et applique des tarifs négociés en temps réel avec des hubs locaux. Il bloque automatiquement les anomalies hors-politique RH avant achat.",
  },
  {
    question: "Peut-on personnaliser le catalogue d'avantages AfrikCSE style B2C ?",
    answer:
      "Absolument. La plateforme génère une Service Gallery immersive calquée sur l'expérience Netflix, segmentée par subvention disponible immédiatement en FCFA.",
  },
  {
    question: "La plateforme gère-t-elle les régulations locales africaines ?",
    answer:
      "Oui, un système de conformité automatisé intègre les règles fiscales UEMOA, CEMAC et les standards internationaux pour certifier instantanément vos rapports comptables et audits RH.",
  },
  {
    question: "Où nos données d'entreprise et de voyage sont-elles hébergées ?",
    answer:
      "Nous offrons une infrastructure souveraine au choix : Datacenters africains premium (Afrique du Sud, Nigeria) ou infrastructures européennes, chiffrées de bout en bout et 100% conformes RGPD.",
  },
  {
    question: "Quels modes de paiement locaux et internationaux intégrez-vous ?",
    answer:
      "Nous prenons en charge nativement les réseaux Mobile Money régionaux (Orange Money, MTN MoMo, Wave, Moov), les cartes bancaires locales, ainsi que les virements SWIFT et Stripe pour l'international.",
  },
];

// ─── Validate ─────────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Le nom complet est requis";
  if (!data.company.trim()) errors.company = "L'entreprise est requise";
  if (!data.email.trim()) {
    errors.email = "L'email professionnel est requis";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format d'email invalide";
  }
  if (!data.message.trim()) errors.message = "Le message est requis";
  return errors;
}

// ─── Contact Popover ──────────────────────────────────────────────────────────

function ContactPopover({
  type,
  value,
  label,
}: {
  type: "email" | "phone";
  value: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {/* noop */}
  }

  const actions =
    type === "email"
      ? [
          {
            Icon: Copy,
            label: copied ? "Copié !" : "Copier l'adresse",
            onClick: copy,
          },
          {
            Icon: Mail,
            label: "Ouvrir dans l'app Mail",
            href: `mailto:${value}`,
          },
          {
            Icon: MessageCircle,
            label: "Envoyer un message",
            href: `mailto:${value}?subject=${encodeURIComponent("Contact AfrikVoyage / AfrikCSE")}`,
          },
        ]
      : [
          {
            Icon: Copy,
            label: copied ? "Copié !" : "Copier le numéro",
            onClick: copy,
          },
          {
            Icon: Phone,
            label: "Appeler directement",
            href: `tel:${contactPhoneCompact}`,
          },
          {
            Icon: MessageCircle,
            label: "WhatsApp",
            href: `https://wa.me/${whatsappPhone}`,
            external: true,
          },
        ];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-mono text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-4 transition-colors"
      >
        {label ?? value}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {type === "email" ? value : contactPhone}
            </p>
          </div>
          {actions.map((action, i) => {
            const cls =
              "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-lg mx-auto";
            return action.href ? (
              <a
                key={i}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                className={cls}
                onClick={() => setOpen(false)}
              >
                <action.Icon className="w-4 h-4 text-slate-400 shrink-0" />
                {action.label}
              </a>
            ) : (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={cls}
              >
                <action.Icon className="w-4 h-4 text-slate-400 shrink-0" />
                {action.label}
              </button>
            );
          })}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ faq }: { faq: (typeof faqs)[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-2xl overflow-hidden bg-white transition-all duration-200 shadow-sm hover:shadow-md ${open ? "border-indigo-200" : "border-slate-200 hover:border-slate-300"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors"
      >
        <span>{faq.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ml-4 shrink-0 ${open ? "rotate-180 text-indigo-500" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-48 border-t border-slate-100" : "max-h-0"}`}
      >
        <div className="px-6 py-4 text-sm leading-relaxed text-slate-600">
          {faq.answer}
        </div>
      </div>
    </div>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    companySize: "",
    workspace: "voyage",
    message: "",
    acceptMarketing: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({
        fullName: "",
        company: "",
        email: "",
        phone: "",
        companySize: "",
        workspace: "voyage",
        message: "",
        acceptMarketing: false,
      });
    } catch {
      setStatus("error");
    }
  }

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-white outline-none transition duration-200 focus:ring-2";
  const inputNormal = `${inputBase} border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-400`;
  const inputError = `${inputBase} border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400`;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
      <h2 className="mb-1 text-2xl font-black text-slate-900 tracking-tight">
        Lancez votre transformation
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        Notre équipe vous répond sous 24h ouvrées.
      </p>

      {status === "success" && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium flex items-center gap-3">
          <ChevronDown className="w-4 h-4 text-emerald-500 rotate-[-90deg] shrink-0" />
          <span>
            Votre demande a bien été enregistrée ! Traitement prioritaire actif.
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-3">
          <Settings className="w-4 h-4 text-red-400 shrink-0" />
          <span>Échec du routage. Veuillez réessayer.</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Workspace selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Solution ciblée
          </label>
          <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => set("workspace", "voyage")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all ${form.workspace === "voyage" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              🌐 AfrikVoyage
            </button>
            <button
              type="button"
              onClick={() => set("workspace", "cse")}
              className={`py-2.5 rounded-lg text-xs font-bold transition-all ${form.workspace === "cse" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              🎁 AfrikCSE
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Nom complet <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Jean Kouassi"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={errors.fullName ? inputError : inputNormal}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Entreprise <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="TechAfrik Holding"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className={errors.company ? inputError : inputNormal}
            />
            {errors.company && (
              <p className="mt-1 text-xs text-red-500">{errors.company}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Email professionnel <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              placeholder="j.kouassi@entreprise.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={errors.email ? inputError : inputNormal}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Téléphone
            </label>
            <input
              type="tel"
              placeholder="+229 01 XX XX XX"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputNormal}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Taille de l&apos;organisation
          </label>
          <div className="relative">
            <select
              value={form.companySize}
              onChange={(e) => set("companySize", e.target.value)}
              className={`${inputNormal} appearance-none pr-10`}
            >
              <option value="">Sélectionnez l&apos;effectif</option>
              {companySizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              ▾
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Expression des besoins <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Décrivez vos enjeux ou objectifs (ex: centralisation RH, réduction de 30% des coûts...)"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            className={`${errors.message ? inputError : inputNormal} resize-none`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-500">{errors.message}</p>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.acceptMarketing}
            onChange={(e) => set("acceptMarketing", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-500 accent-indigo-500"
          />
          <span className="text-[11px] text-slate-500 leading-relaxed">
            J&apos;autorise AfrikVoyage &amp; AfrikCSE à traiter mes données
            pour me soumettre des propositions budgétaires conformément à la
            charte de confidentialité.
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "loading" ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Traitement en cours…
            </>
          ) : (
            <>Demander une démo →</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <div className="space-y-5">
      {/* Coordonnées avec popover */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm">Canaux officiels</h3>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Mail className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Relations commerciales
            </p>
            <div className="space-y-1">
              {contactEmails.map((email) => (
                <div key={email}>
                  <ContactPopover type="email" value={email} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Phone className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Téléphonie
            </p>
            <ContactPopover type="phone" value={contactPhone} />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lun–Ven 8h–18h GMT
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <MapPin className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hub principal
            </p>
            <p className="text-sm text-slate-700 font-medium">
              123 Avenue des Champs-Élysées
            </p>
            <p className="text-sm text-slate-500">75008 Paris, France</p>
          </div>
        </div>
      </div>

      {/* SLA badge */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Settings className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-bold text-indigo-800">
            Engagement SLA & Réactivité
          </p>
        </div>
        <p className="text-xs leading-relaxed text-indigo-600">
          Routage intelligent sur toutes les demandes. Rapport d&apos;éligibilité
          fourni sous{" "}
          <span className="font-bold text-indigo-700">24h ouvrées max</span>.
        </p>
      </div>

      {/* Expert call card — déplacé en bas */}
      <div className="rounded-2xl bg-slate-900 p-5 text-white border border-slate-800 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Ligne directe experts</p>
            <p className="text-slate-400 text-xs">Cadrage de projet immédiat</p>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100 transition-colors active:scale-[0.97]">
          <Phone className="w-4 h-4" />
          Programmer un appel
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
      {/* ── HERO RECENTRÉE ── */}
      <section className="border-b border-slate-100 bg-linear-to-b from-slate-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            Connectivité Souveraine B2B
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.1]">
            Une expertise locale,{" "}
            <span className="text-indigo-600">une plateforme globale</span>
          </h1>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Déployez la puissance d&apos;AfrikVoyage &amp; AfrikCSE dans
            votre organisation. Nos équipes régionales vous assurent un
            support de proximité et un déploiement sur-mesure.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#contact-form"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            >
              Prendre contact
            </a>
            <a
              href="/infos/about"
              className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 px-8 py-3.5 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            >
              Découvrir la plateforme
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { Icon: Globe, label: "8 hubs panafricains" },
              { Icon: Zap, label: "Déploiement 48h" },
              { Icon: Lock, label: "RGPD & UEMOA" },
              { Icon: Users, label: "Support 7j/7" },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ── */}
      <section id="contact-form" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <ContactForm />
          <Sidebar />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Questions fréquentes
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Tout ce qu&apos;il faut savoir pour aligner vos processus RH et
              financiers.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}