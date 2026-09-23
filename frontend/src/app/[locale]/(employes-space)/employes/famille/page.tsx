"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Plus, Pencil, Trash2, X, Loader2, AlertCircle, Baby, Heart, UserRound } from "lucide-react";
import { toast } from "sonner";
import { familyService, FamilyMemberInput } from "@/services/employes/family.service";
import { FamilyMember, FamilyRelationship } from "@/types";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"employee.famille">>;

const getRelationshipLabels = (t: Translator): Record<FamilyRelationship, string> => ({
    SPOUSE:  t("spouse"),
    CHILD:   t("child"),
    PARENT:  t("parent"),
    SIBLING: t("sibling"),
    OTHER:   t("other"),
});

const RELATIONSHIP_ICONS: Record<FamilyRelationship, React.ReactNode> = {
    SPOUSE:  <Heart size={14} className="text-rose-400" />,
    CHILD:   <Baby size={14} className="text-blue-400" />,
    PARENT:  <UserRound size={14} className="text-amber-400" />,
    SIBLING: <Users size={14} className="text-green-400" />,
    OTHER:   <UserRound size={14} className="text-gray-400" />,
};

const EMPTY_FORM: FamilyMemberInput = {
    firstName:    "",
    lastName:     "",
    relationship: "SPOUSE",
    birthDate:    "",
    documentUrl:  "",
};

export default function FamillePage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("employee.famille");
    const RELATIONSHIP_LABELS = useMemo(() => getRelationshipLabels(t), [t]);
    const [members, setMembers]         = useState<FamilyMember[]>([]);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [editing, setEditing]         = useState<FamilyMember | null>(null);
    const [form, setForm]               = useState<FamilyMemberInput>(EMPTY_FORM);
    const [submitting, setSubmitting]   = useState(false);
    const [deleteId, setDeleteId]       = useState<string | null>(null);
    const [deleting, setDeleting]       = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await familyService.getAll();
            setMembers(data);
        } catch {
            toast.error(t("unableLoadFamilyMembers"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (m: FamilyMember) => {
        setEditing(m);
        setForm({
            firstName:    m.firstName,
            lastName:     m.lastName,
            relationship: m.relationship,
            birthDate:    m.birthDate ? m.birthDate.slice(0, 10) : "",
            documentUrl:  m.documentUrl ?? "",
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: FamilyMemberInput = {
                firstName:    form.firstName,
                lastName:     form.lastName,
                relationship: form.relationship,
                birthDate:    form.birthDate || undefined,
                documentUrl:  form.documentUrl || undefined,
            };
            if (editing) {
                await familyService.update(editing.id, payload);
                toast.success(t("memberUpdated"));
            } else {
                await familyService.create(payload);
                toast.success(t("memberAdded"));
            }
            closeForm();
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? t("errorOccurred"));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await familyService.remove(deleteId);
            toast.success(t("memberRemoved"));
            setDeleteId(null);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? t("unableDelete"));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                        <Users size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t("myFamily")}</h1>
                        <p className="text-sm text-gray-500">{t("registeredMember", { length: members.length, p2: members.length !== 1 ? "s" : "" })}</p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Plus size={16} /> {t("add")}
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-900">
                            {editing ? t("editMember") : t("newFamilyMember")}
                        </h2>
                        <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("firstName")}</label>
                                <input
                                    required
                                    value={form.firstName}
                                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    placeholder={t("firstName2")}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("lastName")}</label>
                                <input
                                    required
                                    value={form.lastName}
                                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    placeholder={t("lastName2")}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t("relationship")}</label>
                            <select
                                required
                                value={form.relationship}
                                onChange={e => setForm(f => ({ ...f, relationship: e.target.value as FamilyRelationship }))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                {(Object.keys(RELATIONSHIP_LABELS) as FamilyRelationship[]).map(r => (
                                    <option key={r} value={r}>{RELATIONSHIP_LABELS[r]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("dateBirth")}</label>
                                <input
                                    type="date"
                                    value={form.birthDate ?? ""}
                                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("supportingDocumentUrl")}</label>
                                <input
                                    type="url"
                                    value={form.documentUrl ?? ""}
                                    onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeForm}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                {t("cancel")}
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60"
                                style={{ background: "var(--color-primary)" }}>
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {editing ? t("save") : t("add")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : members.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">{t("noFamilyMemberRegistered")}</p>
                    <p className="text-sm text-gray-400 mt-1">{t("addLovedOnesAccess")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {members.map(m => (
                        <div key={m.id}
                            className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm hover:border-gray-200 transition">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-lg font-bold text-gray-600">
                                {m.firstName[0]}{m.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{m.firstName} {m.lastName}</p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                    {RELATIONSHIP_ICONS[m.relationship]}
                                    <span>{RELATIONSHIP_LABELS[m.relationship]}</span>
                                    {m.birthDate && (
                                        <span className="text-gray-400">
                                            {t("born", { p1: new Date(m.birthDate).toLocaleDateString(dateLocale) })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => openEdit(m)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => setDeleteId(m.id)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation suppression */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{t("removeMember")}</p>
                                <p className="text-sm text-gray-500">{t("existingTicketsRemainValid")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} disabled={deleting}
                                className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                {t("cancel")}
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
