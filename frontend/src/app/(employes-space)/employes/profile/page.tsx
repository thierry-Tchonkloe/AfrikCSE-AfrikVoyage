"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { Save, Upload, Download, Trash2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/employes/UserAvatar";
import { DEPARTMENTS } from "@/lib/departments";

interface Document {
    id: string; name: string; url: string; size: string | null; createdAt: string;
}

const AIRLINES     = ["Aucune préférence", "Air Peace", "Ark Air", "Ethiopian Airlines", "Air France", "Kenya Airways"];
const SEAT_PREFS   = ["No Preference", "Aisle", "Window"];
const HOTEL_CHAINS = ["No Preference", "Marriott", "Hilton", "Radisson", "Accor"];
const ROOM_TYPES   = ["No Preference", "Single", "Double", "Suite"];

const EMPTY_FORM = {
    firstName: "", lastName: "", email: "", phone: "",
    employeeId: "", department: "", jobTitle: "",
    // Adresse — aucun champ backend équivalent aujourd'hui : purement local,
    // jamais envoyé par handleSave (voir updateProfile ci-dessous).
    homeAddress: "", city: "", country: "",
    emergencyContact: "", emergencyPhone: "",
    // Préférences voyage — idem, purement local pour l'instant.
    preferredAirline: AIRLINES[0], seatPref: SEAT_PREFS[0],
    hotelChain: HOTEL_CHAINS[0], roomType: ROOM_TYPES[0], dietaryReqs: "",
};

export default function ProfilePage() {
    const { user, reload } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [docs, setDocs]       = useState<Document[]>([]);

    const [form, setForm] = useState(EMPTY_FORM);

    const upd = (k: keyof typeof form, v: string) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    useEffect(() => {
        setLoading(true);
        employeeService.getProfile()
        .then((p) => {
            setForm((f) => ({
                ...f,
                firstName:  p.firstName  ?? "",
                lastName:   p.lastName   ?? "",
                email:      p.email      ?? "",
                phone:      p.phone      ?? "",
                employeeId: p.employee?.matricule ?? "",
                department: p.department ?? "",
                jobTitle:   p.jobTitle   ?? "",
            }));
        })
        .catch(() => toast.error("Impossible de charger le profil"))
        .finally(() => setLoading(false));

        employeeService.getDocuments()
        .then(setDocs)
        .catch(() => {
            setDocs([]);
            toast.error("Impossible de charger les documents");
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
        await employeeService.updateProfile({
            firstName: form.firstName,
            lastName:  form.lastName,
            phone:     form.phone,
            jobTitle:  form.jobTitle,
            department: form.department,
        });
        toast.success("Profil mis à jour !");
        } catch { toast.error("Erreur sauvegarde"); }
        finally { setSaving(false); }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadingAvatar(true);
        try {
            await employeeService.uploadAvatar(file);
            await reload();
            toast.success("Photo de profil mise à jour");
        } catch {
            toast.error("Erreur lors de l'envoi de la photo");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteDoc = async (id: string) => {
        try {
        await employeeService.deleteDocument(id);
        setDocs((prev) => prev.filter((d) => d.id !== id));
        toast.success("Document supprimé");
        } catch { toast.error("Erreur suppression"); }
    };

    return (
        <div className="space-y-5 px-4">
        {/* En-tête */}
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <UserAvatar
                avatar={user?.avatar}
                firstName={user?.firstName}
                lastName={user?.lastName}
                className="w-14 h-14 text-xl"
                />
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gray-700 border-2 border-white flex items-center justify-center">
                {uploadingAvatar
                    ? <Loader2 size={10} className="text-white animate-spin" />
                    : <Upload size={10} className="text-white" />}
                </div>
                <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                />
            </div>
            <div>
                <h1 className="text-lg font-bold text-gray-900">
                {form.firstName} {form.lastName}
                </h1>
                <p className="text-sm text-gray-500">{form.jobTitle || "—"}</p>
                <p className="text-xs text-gray-400">
                🏢 {user?.organization?.name}
                </p>
            </div>
            </div>
            <div className="flex gap-2">
            <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-70"
                style={{ background: "#0f766e" }}
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
            </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── Gauche ── */}
            <div className="space-y-5">
            {/* Informations personnelles */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                👤 Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                {[
                    { key: "firstName",  label: "First Name" },
                    { key: "lastName",   label: "Last Name"  },
                ].map((f) => (
                    <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <input value={form[f.key as keyof typeof form]}
                        onChange={(e) => upd(f.key as keyof typeof form, e.target.value)}
                        className={inp} />
                    </div>
                ))}
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                    <input value={form.email} disabled className={inp + " bg-gray-50 text-gray-400"} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                    <input value={form.phone}
                    onChange={(e) => upd("phone", e.target.value)}
                    placeholder="+234 801 234 5678" className={inp} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Employee ID</label>
                    <input value={form.employeeId} disabled className={inp + " bg-gray-50 text-gray-400"} />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                    <select value={form.department}
                    onChange={(e) => upd("department", e.target.value)}
                    disabled={loading}
                    className={inp}>
                    <option value="">{loading ? "Chargement..." : "Sélectionner..."}</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
                    <input value={form.jobTitle}
                    onChange={(e) => upd("jobTitle", e.target.value)}
                    className={inp} />
                </div>
                </div>
            </div>

            {/* Préférences voyage */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                ✈️ Travel Preferences
                </h3>
                <div className="grid grid-cols-2 gap-3">
                {[
                    { key: "preferredAirline", label: "Preferred Airline", opts: AIRLINES },
                    { key: "seatPref",         label: "Seat Preference",   opts: SEAT_PREFS },
                    { key: "hotelChain",       label: "Hotel Chain",        opts: HOTEL_CHAINS },
                    { key: "roomType",         label: "Room Type",          opts: ROOM_TYPES },
                ].map((f) => (
                    <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <select value={form[f.key as keyof typeof form]}
                        onChange={(e) => upd(f.key as keyof typeof form, e.target.value)}
                        className={inp}>
                        {f.opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    </div>
                ))}
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                    Dietary Requirements
                    </label>
                    <textarea value={form.dietaryReqs}
                    onChange={(e) => upd("dietaryReqs", e.target.value)}
                    rows={2}
                    placeholder="Any special dietary requirements or allergies..."
                    className={inp + " resize-none"} />
                </div>
                </div>
            </div>
            </div>

            {/* ── Droite ── */}
            <div className="space-y-5">
            {/* Contact Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                📋 Contact Details
                </h3>
                <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Home Address</label>
                    <input value={form.homeAddress}
                    onChange={(e) => upd("homeAddress", e.target.value)}
                    className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <input value={form.city}
                        onChange={(e) => upd("city", e.target.value)}
                        className={inp} />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                    <input value={form.country}
                        onChange={(e) => upd("country", e.target.value)}
                        className={inp} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Emergency Contact</label>
                    <input value={form.emergencyContact}
                    onChange={(e) => upd("emergencyContact", e.target.value)}
                    className={inp} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Emergency Phone</label>
                    <input value={form.emergencyPhone}
                    onChange={(e) => upd("emergencyPhone", e.target.value)}
                    className={inp} />
                </div>
                </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                📂 Documents
                </h3>
                <div className="space-y-2">
                {docs.map((doc) => (
                    <div key={doc.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                    <span className="text-xl shrink-0">📄</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                        {doc.size} · Uploaded {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                        <Download size={14} />
                        </button>
                        <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-red-400"
                        >
                        <Trash2 size={14} />
                        </button>
                    </div>
                    </div>
                ))}
                </div>
                <button
                onClick={() => toast.info("Upload document — à connecter à Cloudinary")}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                <Upload size={14} /> + Upload New Document
                </button>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={18} style={{ color: "#0f766e" }} /> Security
                </h3>
                {/* Les préférences de notification réelles (persistées) vivent sur
                    Paramètres — un toggle local ici serait un doublon non
                    sauvegardé, en désaccord avec l'état réel au moindre reload. */}
                <button
                onClick={() => router.push("/employes/parametres#notifications")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                🔔 Notification Preferences
                </button>
                <button
                onClick={() => router.push("/employes/parametres#security")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                🔑 Change Password
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";