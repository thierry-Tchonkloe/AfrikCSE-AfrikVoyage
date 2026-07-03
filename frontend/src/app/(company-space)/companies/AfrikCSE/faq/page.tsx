"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Archive, Loader2, GripVertical } from "lucide-react";
import { faqService, FaqInput } from "@/services/employes/faq.service";
import { FaqEntry, FaqStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_LABELS: Record<FaqStatus, { label: string; color: string; bg: string }> = {
    DRAFT:     { label: "Brouillon",  color: "#6b7280", bg: "#f3f4f6" },
    PUBLISHED: { label: "Publié",     color: "#059669", bg: "#d1fae5" },
    ARCHIVED:  { label: "Archivé",   color: "#d97706", bg: "#fef3c7" },
};

const EMPTY_FORM: FaqInput = { question: "", answer: "", category: "", order: 0, status: "DRAFT" };

export default function AdminFaqPage() {
    const [entries, setEntries]   = useState<FaqEntry[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]   = useState<FaqEntry | null>(null);
    const [form, setForm]         = useState<FaqInput>(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await faqService.getAll();
            setEntries(data);
        } catch {
            toast.error("Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (entry: FaqEntry) => {
        setEditing(entry);
        setForm({
            question: entry.question,
            answer:   entry.answer,
            category: entry.category ?? "",
            order:    entry.order,
            status:   entry.status,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.question.trim() || !form.answer.trim()) {
            toast.error("Question et réponse sont obligatoires");
            return;
        }
        setSaving(true);
        try {
            const payload: FaqInput = {
                ...form,
                category: form.category?.trim() || undefined,
                order: Number(form.order) || 0,
            };
            if (editing) {
                await faqService.update(editing.id, payload);
                toast.success("Entrée mise à jour");
            } else {
                await faqService.create(payload);
                toast.success("Entrée créée");
            }
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette entrée ?")) return;
        setDeleting(id);
        try {
            await faqService.remove(id);
            toast.success("Entrée supprimée");
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleStatus = async (entry: FaqEntry) => {
        const next: FaqStatus = entry.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
        try {
            await faqService.update(entry.id, { status: next });
            setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: next } : e));
            toast.success(next === "PUBLISHED" ? "Publié" : "Dépublié");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleArchive = async (entry: FaqEntry) => {
        try {
            await faqService.update(entry.id, { status: "ARCHIVED" });
            setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "ARCHIVED" } : e));
            toast.success("Archivé");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const published = entries.filter((e) => e.status === "PUBLISHED").length;
    const drafts    = entries.filter((e) => e.status === "DRAFT").length;

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion de la FAQ</h1>
                    <p className="text-sm text-gray-500">
                        {published} publiée{published > 1 ? "s" : ""} · {drafts} en brouillon
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Plus size={15} /> Nouvelle entrée
                </button>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-400">
                        Aucune entrée — créez la première question.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 w-8"></th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500">Question</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Catégorie</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Ordre</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const s = STATUS_LABELS[entry.status];
                                return (
                                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-300">
                                            <GripVertical size={14} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 line-clamp-1">{entry.question}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{entry.answer}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-xs text-gray-500">{entry.category ?? "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="text-xs text-gray-500">{entry.order}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={{ color: s.color, background: s.bg }}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => handleToggleStatus(entry)}
                                                    title={entry.status === "PUBLISHED" ? "Dépublier" : "Publier"}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    {entry.status === "PUBLISHED"
                                                        ? <EyeOff size={14} />
                                                        : <Eye size={14} />}
                                                </button>
                                                {entry.status !== "ARCHIVED" && (
                                                    <button
                                                        onClick={() => handleArchive(entry)}
                                                        title="Archiver"
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
                                                    >
                                                        <Archive size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEdit(entry)}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    disabled={deleting === entry.id}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                >
                                                    {deleting === entry.id
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal création / édition */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-gray-900 mb-5">
                            {editing ? "Modifier l'entrée" : "Nouvelle entrée FAQ"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Question *</label>
                                <input
                                    value={form.question}
                                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                                    placeholder="Comment puis-je soumettre une demande ?"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Réponse *</label>
                                <textarea
                                    value={form.answer}
                                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                    rows={5}
                                    placeholder="Réponse détaillée…"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                                    <input
                                        value={form.category ?? ""}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="Voyage, Avantages…"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Ordre d&apos;affichage</label>
                                    <input
                                        type="number"
                                        value={form.order ?? 0}
                                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as FaqStatus })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                                >
                                    <option value="DRAFT">Brouillon</option>
                                    <option value="PUBLISHED">Publié</option>
                                    <option value="ARCHIVED">Archivé</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "var(--color-primary)" }}
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {editing ? "Enregistrer" : "Créer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
