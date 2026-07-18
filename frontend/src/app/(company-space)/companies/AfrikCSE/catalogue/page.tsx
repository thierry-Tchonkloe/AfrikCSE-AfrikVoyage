"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, History, X, Search } from "lucide-react";
import { catalogService } from "@/services/employes/catalog.service";
import { toast } from "sonner";
import { CatalogItem } from "@/types";

interface AuditEntry {
    id: string;
    action: string;
    changedBy: string;
    version: number;
    createdAt: string;
    snapshot: Record<string, unknown>;
}

const OFFER_TYPES = ["VOUCHER", "BOOKING", "DISCOUNT_CODE"] as const;
const EMPTY_FORM = {
    title: "", description: "", imageUrl: "", category: "",
    subsidyPct: 0, employeePrice: 0, companyPrice: 0,
    isActive: true, offerType: "VOUCHER" as string,
    city: "", region: "", country: "", partnerId: "",
};

export default function CataloguePage() {
    const [items, setItems]           = useState<CatalogItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState("");
    const [modal, setModal]           = useState<"create" | "edit" | null>(null);
    const [editItem, setEditItem]     = useState<CatalogItem | null>(null);
    const [form, setForm]             = useState<typeof EMPTY_FORM & Record<string, unknown>>(EMPTY_FORM);
    const [saving, setSaving]         = useState(false);
    const [deleteId, setDeleteId]     = useState<string | null>(null);
    const [auditItem, setAuditItem]   = useState<CatalogItem | null>(null);
    const [auditLog, setAuditLog]     = useState<AuditEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await catalogService.getAllAdmin();
            setItems(data);
        } catch { toast.error("Erreur chargement catalogue"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditItem(null);
        setModal("create");
    };

    const openEdit = (item: CatalogItem) => {
        setEditItem(item);
        setForm({
            title:         item.title ?? "",
            description:   item.description ?? "",
            imageUrl:      item.imageUrl ?? "",
            category:      item.category ?? "",
            subsidyPct:    item.subsidyPct ?? 0,
            employeePrice: item.employeePrice ?? 0,
            companyPrice:  item.companyPrice ?? 0,
            isActive:      item.isActive ?? true,
            offerType:     item.offerType ?? "VOUCHER",
            city:          (item as Record<string, unknown>).city as string ?? "",
            region:        (item as Record<string, unknown>).region as string ?? "",
            country:       (item as Record<string, unknown>).country as string ?? "",
            partnerId:     (item as Record<string, unknown>).partnerId as string ?? "",
        });
        setModal("edit");
    };

    const openAudit = async (item: CatalogItem) => {
        setAuditItem(item);
        setAuditLoading(true);
        try {
            const log = await catalogService.getAuditHistory(item.id);
            setAuditLog(log as AuditEntry[]);
        } catch { toast.error("Erreur chargement historique"); }
        finally { setAuditLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title || !form.category) {
            toast.error("Titre et catégorie sont obligatoires");
            return;
        }
        setSaving(true);
        try {
            if (modal === "create") {
                await catalogService.createItem(form);
                toast.success("Offre créée");
            } else if (editItem) {
                await catalogService.updateItem(editItem.id, form);
                toast.success("Offre mise à jour");
            }
            setModal(null);
            load();
        } catch { toast.error("Erreur lors de la sauvegarde"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await catalogService.deleteItem(deleteId);
            toast.success("Offre supprimée");
            setDeleteId(null);
            load();
        } catch { toast.error("Erreur lors de la suppression"); }
    };

    const filtered = items.filter((i) =>
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.category?.toLowerCase().includes(search.toLowerCase())
    );

    const field = (key: string, label: string, type = "text") => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                value={String(form[key] ?? "")}
                onChange={(e) => setForm((f) => ({
                    ...f,
                    [key]: type === "number" ? Number(e.target.value) : e.target.value,
                }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-500"
            />
        </div>
    );

    const ACTION_COLOR: Record<string, string> = {
        CREATED: "#10b981", UPDATED: "#3b82f6", DELETED: "#ef4444",
        PUBLISHED: "#8b5cf6", UNPUBLISHED: "#f59e0b",
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Catalogue d&#39;offres</h1>
                    <p className="text-sm text-gray-500">Gérez les offres du catalogue CSE</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "#0f766e" }}
                >
                    <Plus size={16} /> Nouvelle offre
                </button>
            </div>

            {/* Barre de recherche */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher une offre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {["Titre", "Catégorie", "Type", "Prix employé", "Subvention %", "Statut", "Actions"].map((h) => (
                                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="border-b">
                                        <td colSpan={7} className="px-4 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                                        Aucune offre trouvée
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {item.imageUrl && (
                                                    <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                )}
                                                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
                                                {item.offerType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {item.employeePrice?.toLocaleString("fr-FR")} XOF
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#0f766e" }}>
                                            {item.subsidyPct ?? 0}%
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                item.isActive
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {item.isActive ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-1.5 rounded hover:bg-teal-50 text-teal-600"
                                                    title="Modifier"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openAudit(item)}
                                                    className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                                    title="Historique"
                                                >
                                                    <History size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-red-500"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Créer / Modifier */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900">
                                {modal === "create" ? "Nouvelle offre" : "Modifier l'offre"}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {field("title", "Titre *")}
                            {field("category", "Catégorie *")}
                            {field("description", "Description")}
                            {field("imageUrl", "URL image")}
                            <div className="grid grid-cols-2 gap-3">
                                {field("employeePrice", "Prix employé (XOF)", "number")}
                                {field("companyPrice", "Prix entreprise (XOF)", "number")}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {field("subsidyPct", "Subvention (%)", "number")}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type d&#39;offre</label>
                                    <select
                                        value={String(form.offerType)}
                                        onChange={(e) => setForm((f) => ({ ...f, offerType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                    >
                                        {OFFER_TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {field("city", "Ville")}
                                {field("region", "Région")}
                                {field("country", "Pays")}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={Boolean(form.isActive)}
                                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    className="w-4 h-4"
                                    style={{ accentColor: "#0f766e" }}
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">Offre active</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setModal(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                                style={{ background: "#0f766e" }}
                            >
                                {saving ? "Sauvegarde…" : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal suppression */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-2">Supprimer cette offre ?</h3>
                        <p className="text-sm text-gray-500 mb-5">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg text-white text-sm bg-red-500"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer historique */}
            {auditItem && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setAuditItem(null)} />
                    <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">Historique</h3>
                                <p className="text-xs text-gray-500">{auditItem.title}</p>
                            </div>
                            <button onClick={() => setAuditItem(null)} className="text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {auditLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                ))
                            ) : auditLog.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center pt-10">Aucun historique</p>
                            ) : (
                                auditLog.map((entry) => (
                                    <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: `${ACTION_COLOR[entry.action]}18`,
                                                    color: ACTION_COLOR[entry.action] ?? "#6b7280",
                                                }}
                                            >
                                                {entry.action}
                                            </span>
                                            <span className="text-xs text-gray-400">v{entry.version}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Par {entry.changedBy} — {new Date(entry.createdAt).toLocaleString("fr-FR")}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
