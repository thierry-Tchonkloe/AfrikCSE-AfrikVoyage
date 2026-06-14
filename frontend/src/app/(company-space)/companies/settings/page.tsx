"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { companyService } from "@/services/companies/company.service";
import { applyTheme } from "@/lib/theme";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

// ── Types ──────────────────────────────────────────────
interface CompanySettings {
    name: string;
    legalName: string;
    registrationNumber: string;
    vatNumber: string;
    industry: string;
    size: string;
    primaryEmail: string;
    phone: string;
    address: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
}

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const INDUSTRIES = [
    "Technology & Software", "Finance", "Santé", "Éducation",
    "Commerce", "Industrie", "Transport", "Agriculture", "Services",
];
const SIDEBAR_ITEMS = [
    { id: "info",      label: "Company Information" },
    { id: "branding",  label: "Branding" },
    { id: "modules",   label: "Modules" },
    { id: "users",     label: "User Management" },
    { id: "billing",   label: "Billing & Plan" },
];

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const router   = useRouter();
    const [activeSection, setActiveSection] = useState("info");
    const [saving, setSaving]   = useState(false);
    const [changed, setChanged] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState<CompanySettings>({
        name:               "",
        legalName:          "",
        registrationNumber: "",
        vatNumber:          "",
        industry:           "Technology & Software",
        size:               "51-200",
        primaryEmail:       "",
        phone:              "",
        address:            "",
        primaryColor:       "#0f766e",
        secondaryColor:     "#f480c0",
        accentColor:        "#f3007e",
        logoUrl:            null,
        faviconUrl:         null,
    });

    // Charger les données de l'organisation au montage
    useEffect(() => {
        companyService.getDashboard()
            .then(({ org }) => {
                if (!org) return;
                setSettings((prev) => ({
                    ...prev,
                    name:           org.name ?? prev.name,
                    phone:          org.phone ?? prev.phone,
                    primaryEmail:   org.businessEmail ?? prev.primaryEmail,
                    address:        org.address ?? prev.address,
                    industry:       org.industry ?? prev.industry,
                    size:           org.size ?? prev.size,
                    logoUrl:        org.logoUrl ?? prev.logoUrl,
                    primaryColor:   org.primaryColor ?? prev.primaryColor,
                    secondaryColor: org.secondaryColor ?? prev.secondaryColor,
                }));
            })
            .catch(() => {
                // Initialiser depuis useAuth comme fallback
                if (user?.organization) {
                    setSettings((prev) => ({ ...prev, name: user.organization!.name ?? "" }));
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const update = (key: keyof CompanySettings, value: string | null) => {
        setSettings((prev) => {
            const next = { ...prev, [key]: value };
            // Aperçu couleur en temps réel
            if (key === "primaryColor" || key === "secondaryColor") {
                applyTheme({ primaryColor: next.primaryColor, secondaryColor: next.secondaryColor });
            }
            return next;
        });
        setChanged(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await companyService.updateMyOrg({
                name:           settings.name || undefined,
                phone:          settings.phone || undefined,
                businessEmail:  settings.primaryEmail || undefined,
                address:        settings.address || undefined,
                industry:       settings.industry || undefined,
                size:           settings.size || undefined,
                primaryColor:   settings.primaryColor || undefined,
                secondaryColor: settings.secondaryColor || undefined,
            });
            toast.success("Paramètres enregistrés");
            setChanged(false);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur sauvegarde"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const { logoUrl } = await companyService.uploadLogo(file);
            setSettings((prev) => ({ ...prev, logoUrl }));
            toast.success("Logo mis à jour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'upload du logo"));
        } finally {
            e.target.value = "";
        }
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Company Administration</h1>
            <p className="text-sm text-gray-500">Company Settings</p>
            <p className="text-xs text-gray-400">
                Manage your organization&#39;s information, branding, and module configurations
            </p>
            </div>
            {changed && (
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70"
                style={{ background: "#0f766e" }}
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
            </button>
            )}
        </div>

        <div className="flex gap-5">
            {/* Sidebar navigation */}
            <div className="w-48 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {SIDEBAR_ITEMS.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left border-b border-gray-100 last:border-0 transition-colors"
                    style={activeSection === item.id
                    ? { background: "#f0fdf4", color: "#0f766e", fontWeight: 600 }
                    : { color: "#6b7280" }}
                >
                    {item.label}
                </button>
                ))}
                <button
                onClick={() => router.push("/billing")}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left border-t border-gray-200 mt-2"
                style={{ color: "#0f766e", background: "#f0fdf4" }}
                >
                🔗 Integrations & API RH
                </button>
            </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 space-y-5">
            {/* ── Section : Company Information ── */}
            {activeSection === "info" && (
                <Section title="Company Information"
                desc="Basic details about your organisation">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Name *">
                    <input value={settings.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="TechCorp International" className={inp} />
                    </Field>
                    <Field label="Legal Name">
                    <input value={settings.legalName}
                        onChange={(e) => update("legalName", e.target.value)}
                        placeholder="TechCorp International SARL" className={inp} />
                    </Field>
                    <Field label="Registration Number">
                    <input value={settings.registrationNumber}
                        onChange={(e) => update("registrationNumber", e.target.value)}
                        placeholder="FR-2024-789456" className={inp} />
                    </Field>
                    <Field label="VAT Number">
                    <input value={settings.vatNumber}
                        onChange={(e) => update("vatNumber", e.target.value)}
                        placeholder="FR123456789021" className={inp} />
                    </Field>
                    <Field label="Industry">
                    <select value={settings.industry}
                        onChange={(e) => update("industry", e.target.value)}
                        className={inp}>
                        {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                    </Field>
                    <Field label="Company Size">
                    <div className="flex gap-2">
                        {SIZES.map((s) => (
                        <button key={s}
                            onClick={() => update("size", s)}
                            className="flex-1 py-2 text-xs rounded-lg border transition-colors font-medium"
                            style={settings.size === s
                            ? { background: "#0f766e", color: "white", borderColor: "#0f766e" }
                            : { color: "#6b7280", borderColor: "#e5e7eb" }}
                        >
                            {s}
                        </button>
                        ))}
                    </div>
                    </Field>
                    <Field label="Primary Contact Email">
                    <input value={settings.primaryEmail}
                        onChange={(e) => update("primaryEmail", e.target.value)}
                        type="email" placeholder="admin@techcorp.com" className={inp} />
                    </Field>
                    <Field label="Phone Number">
                    <input value={settings.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+33 1 23 45 67 89" className={inp} />
                    </Field>
                    <Field label="Headquarters Address" colSpan>
                    <input value={settings.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="123 Avenue des Champs-Élysées, 75008 Paris, France"
                        className={inp} />
                    </Field>
                </div>
                </Section>
            )}

            {/* ── Section : Branding ── */}
            {activeSection === "branding" && (
                <Section title="Image de marque et personnalisation"
                desc="Personnalisez l'apparence de votre plateforme">
                {/* Logo + Favicon */}
                <div className="grid grid-cols-2 gap-6 mb-5">
                    {/* Logo — fonctionnel (upload Cloudinary) */}
                    <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Company Logo</p>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                        <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-300 transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                        >
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="max-h-12 mx-auto object-contain" />
                        ) : (
                            <>
                            <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">
                                Recommandé : 260×56px
                            </p>
                            </>
                        )}
                        <button type="button" className="mt-2 text-xs text-teal-600 font-medium hover:underline">
                            Change Logo
                        </button>
                        </div>
                    </div>

                    {/* Favicon — non géré par cette section (hors périmètre) */}
                    <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Favicon</p>
                        <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-300 transition-colors"
                        onClick={() => toast.info("Upload d'image — à connecter à Cloudinary")}
                        >
                        {settings.faviconUrl ? (
                            <img src={settings.faviconUrl} alt="Favicon" className="max-h-12 mx-auto object-contain" />
                        ) : (
                            <>
                            <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">
                                Current: 128×128px
                            </p>
                            </>
                        )}
                        <button type="button" className="mt-2 text-xs text-teal-600 font-medium hover:underline">
                            Change Favicon
                        </button>
                        </div>
                    </div>
                </div>

                {/* Couleurs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    {[
                    { key: "primaryColor" as const,   label: "Primary Color" },
                    { key: "secondaryColor" as const, label: "Secondary Color" },
                    { key: "accentColor" as const,    label: "Accent Color" },
                    ].map((c) => (
                    <div key={c.key}>
                        <p className="text-xs font-medium text-gray-700 mb-2">{c.label}</p>
                        <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={settings[c.key]}
                            onChange={(e) => update(c.key, e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                        />
                        <input
                            type="text"
                            value={settings[c.key]}
                            onChange={(e) => update(c.key, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none"
                        />
                        </div>
                    </div>
                    ))}
                </div>

                {/* Aperçu email */}
                <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Email Footer Text</p>
                    <textarea
                    rows={2}
                    placeholder="Ce courriel a été envoyé par TechCorp International. Pour toute question, veuillez contacter support@techcorp.com"
                    className={inp + " resize-none"}
                    />
                </div>
                </Section>
            )}

            {/* ── Section : Modules ── */}
            {activeSection === "modules" && (
                <Section title="Activation du module"
                desc="Activez ou désactivez les modules de la plateforme pour votre organisation">
                <div className="space-y-4">
                    {[
                    {
                        label: "AfrikVoyage – Travel Management",
                        desc: "Réservations de vols, hôtels, trains, voitures et gestion travel management",
                        sub: "Actifs : 126 actifs",
                        active: user?.organization?.hasVoyage,
                        color: "#f59e0b",
                        icon: "✈️",
                    },
                    {
                        label: "AfrikCSE – Employee Benefits",
                        desc: "Manage employee benefits, avantages, and CSE programs",
                        sub: "Actifs : 213 bénéficiaires",
                        active: user?.organization?.hasCSE,
                        color: "#0f766e",
                        icon: "🎁",
                    },
                    {
                        label: "Expense Management",
                        desc: "Track and reimburse employee expenses",
                        sub: "Inactif · Available in Pro plan",
                        active: false,
                        color: "#6b7280",
                        icon: "💰",
                    },
                    {
                        label: "Time & Attendance",
                        desc: "Track employee time, attendance, and leave requests",
                        sub: "Inactif · Available in Enterprise plan",
                        active: false,
                        color: "#6b7280",
                        icon: "🕐",
                    },
                    ].map((mod) => (
                    <div key={mod.label}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl">
                        <span className="text-2xl mt-0.5">{mod.icon}</span>
                        <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{mod.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
                        <p className="text-xs mt-1" style={{ color: mod.active ? mod.color : "#9ca3af" }}>
                            {mod.sub}
                        </p>
                        </div>
                        <div className="shrink-0 flex items-center">
                        {mod.active !== undefined && (
                            <div
                            className="relative w-11 h-6 rounded-full cursor-not-allowed"
                            style={{ background: mod.active ? mod.color : "#d1d5db" }}
                            title={mod.active ? "Actif" : "Contactez le support pour activer"}
                            >
                            <span
                                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                                style={{ transform: mod.active ? "translateX(20px)" : "translateX(2px)" }}
                            />
                            </div>
                        )}
                        </div>
                    </div>
                    ))}
                </div>
                </Section>
            )}

            {/* ── Section : User Management ── */}
            {activeSection === "users" && (
                <Section title="Gestion des utilisateurs"
                desc="Configurez les rôles, les autorisations et gérez vos utilisateurs">
                <div className="flex items-center gap-3">
                    <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg"
                    style={{ background: "#0f766e" }}
                    >
                    👥
                    </div>
                    <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Gérer les utilisateurs</p>
                    <p className="text-xs text-gray-500">
                        Ajoutez, modifiez et gérez les accès de vos collaborateurs
                    </p>
                    </div>
                    <button
                    onClick={() => router.push("/companies/users")}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "#0f766e" }}
                    >
                    Gérer →
                    </button>
                </div>
                </Section>
            )}

            {/* ── Section : Billing (raccourci) ── */}
            {activeSection === "billing" && (
                <Section title="Facturation & Abonnement"
                desc="Gérez votre abonnement et votre historique de paiement">
                <button
                    onClick={() => router.push("/companies/billing")}
                    className="w-full py-3 rounded-xl text-white font-medium"
                    style={{ background: "#0f766e" }}
                >
                    Accéder à la facturation →
                </button>
                </Section>
            )}
            </div>
        </div>
        </div>
    );
}

// ── Utilitaires ──
const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";

function Section({ title, desc, children }: {
    title: string; desc: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        {children}
        </div>
    );
}

function Field({ label, children, colSpan = false }: {
    label: string; children: React.ReactNode; colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
        {children}
        </div>
    );
}