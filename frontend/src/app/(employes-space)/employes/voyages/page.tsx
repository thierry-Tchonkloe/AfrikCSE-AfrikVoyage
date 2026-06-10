"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Plane, MapPin, Calendar } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface Travel {
    id: string;
    destination: string;
    purpose: string | null;
    departureDate: string;
    returnDate: string;
    estimatedCost: number | null;
    status: string;
    department: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:  { label: "En attente",  color: "#f59e0b", bg: "#fffbeb" },
    APPROVED: { label: "Approuvé",    color: "#10b981", bg: "#f0fdf4" },
    REJECTED: { label: "Rejeté",      color: "#ef4444", bg: "#fef2f2" },
    CANCELLED:{ label: "Annulé",      color: "#6b7280", bg: "#f9fafb" },
};

export default function VoyagesPage() {
    const router = useRouter();
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        destination: "", purpose: "", departureDate: "",
        returnDate: "", estimatedCost: "", department: "",
    });

    const load = () => {
        setLoading(true);
        employeeService.getMyTravels()
        .then((data) => setTravels(data))
        .catch(() => toast.error("Erreur lors du chargement des voyages"))
        .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!form.destination || !form.departureDate || !form.returnDate) {
        toast.error("Destination et dates requises");
        return;
        }
        try {
        await employeeService.createTravel({
            ...form,
            estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        });
        toast.success("Demande de voyage soumise");
        setShowCreate(false);
        setForm({ destination: "", purpose: "", departureDate: "", returnDate: "", estimatedCost: "", department: "" });
        load();
        } catch { toast.error("Erreur soumission"); }
    };

    const getDuration = (dep: string, ret: string) => {
        const days = Math.ceil(
        (new Date(ret).getTime() - new Date(dep).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${days} day${days > 1 ? "s" : ""}`;
    };

    return (
        <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Mes voyages</h1>
            <p className="text-sm text-gray-500">Gérez vos voyages d&#39;affaires</p>
            </div>
            <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            >
            <Plus size={15} /> Nouveau voyage
            </button>
        </div>

        {/* Liste */}
        <div className="space-y-3">
            {loading ? (
            [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse" />
            ))
            ) : travels.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                Aucun voyage pour le moment.
            </div>
            ) : (
            travels.map((t) => {
                const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PENDING;
                return (
                <div key={t.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#eff6ff" }}
                    >
                    <Plane size={20} style={{ color: "#3b82f6" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                        <p className="font-semibold text-gray-900">{t.destination}</p>
                        <p className="text-xs text-gray-500">{t.purpose}</p>
                        </div>
                        <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ color: st.color, background: st.bg }}
                        >
                        {st.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(t.departureDate).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(t.returnDate).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                        <MapPin size={12} /> {t.department ?? "—"}
                        </span>
                        {t.estimatedCost && (
                        <span className="font-medium text-gray-700">
                            €{t.estimatedCost.toLocaleString()}
                        </span>
                        )}
                        <span>{getDuration(t.departureDate, t.returnDate)}</span>
                    </div>
                    </div>
                </div>
                );
            })
            )}
        </div>

        {/* Bouton vers réservation */}
        <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
            <div>
            <p className="text-sm font-semibold text-gray-900">Réserver un nouveau voyage</p>
            <p className="text-xs text-gray-500">Recherchez vols, hôtels, trains et voitures</p>
            </div>
            <button
            onClick={() => router.push("/employes/reserver")}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            >
            Réserver →
            </button>
        </div>

        {/* Modal création */}
        {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="font-bold text-gray-900 mb-4">Nouvelle demande de voyage</h3>
                <div className="space-y-3">
                {[
                    { key: "destination", label: "Destination *", placeholder: "Paris → London" },
                    { key: "purpose",     label: "Objet du voyage", placeholder: "Conférence, réunion..." },
                    { key: "department",  label: "Département", placeholder: "Sales, Engineering..." },
                    { key: "estimatedCost", label: "Coût estimé (€)", placeholder: "1500", type: "number" },
                ].map((f) => (
                    <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                        type={f.type ?? "text"}
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    />
                    </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                    {[
                    { key: "departureDate", label: "Départ *" },
                    { key: "returnDate",    label: "Retour *" },
                    ].map((f) => (
                    <div key={f.key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                        <input type="date"
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                    ))}
                </div>
                </div>
                <div className="flex gap-2 mt-5">
                <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Annuler
                </button>
                <button onClick={handleCreate}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "#0f766e" }}>
                    Soumettre
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}