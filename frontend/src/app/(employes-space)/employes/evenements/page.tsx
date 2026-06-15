"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarPlus } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface CalEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: string | null;
    maxParticipants: number | null;
    icon: string | null;
    color: string | null;
    _count: { registrations: number };
    registrations: { userId: string }[];
}

interface EventStat {
    eventsThisMonth: number;
    totalRegistrations: number;
    budget: number;
}

interface RecentEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    icon: string | null;
    _count: { registrations: number };
}

// Jours de la semaine
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const EMPTY_STATS: EventStat = {
    eventsThisMonth: 0,
    totalRegistrations: 0,
    budget: 0,
};

export default function EvenementsPage() {
    const { user }  = useAuth();
    const router    = useRouter();

    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear]   = useState(now.getFullYear());

    const [events, setEvents]   = useState<CalEvent[]>([]);
    const [stats, setStats]     = useState<EventStat>(EMPTY_STATS);
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [registering, setRegistering] = useState<string | null>(null);

    // Formulaire création événement
    const [createForm, setCreateForm] = useState({
        title: "", description: "", startDate: "", endDate: "",
        location: "", maxParticipants: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [evRes, stRes, recentRes] = await Promise.all([
            employeeService.getEvents(currentMonth, currentYear),
            employeeService.getEventStats(),
            employeeService.getRecentEvents(),
        ]);
        setEvents(evRes);
        setStats(stRes);
        setRecentEvents(recentRes);
        } catch {
        toast.error("Erreur lors du chargement des événements");
        } finally {
        setLoading(false);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => { load(); }, [load]);

    // ── Calendrier ──────────────────────────────────────
    const getDaysInMonth = (month: number, year: number) =>
        new Date(year, month + 1, 0).getDate();

    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Lundi = 0
    };

    const daysInMonth  = getDaysInMonth(currentMonth, currentYear);
    const firstDay     = getFirstDayOfMonth(currentMonth, currentYear);

    // Événements indexés par jour
    const eventsByDay: Record<number, CalEvent[]> = {};
    events.forEach((ev) => {
        const d = new Date(ev.startDate).getDate();
        if (!eventsByDay[d]) eventsByDay[d] = [];
        eventsByDay[d].push(ev);
    });

    const handleRegister = async (eventId: string, isRegistered: boolean) => {
        setRegistering(eventId);
        try {
        if (isRegistered) {
            await employeeService.unregisterEvent(eventId);
            toast.success("Inscription annulée");
        } else {
            await employeeService.registerEvent(eventId);
            toast.success("Inscrit avec succès !");
        }
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setRegistering(null);
        }
    };

    const handleCreateEvent = async () => {
        if (!createForm.title || !createForm.startDate) {
        toast.error("Titre et date requis");
        return;
        }
        try {
        await employeeService.createEvent({
            ...createForm,
            maxParticipants: createForm.maxParticipants
            ? parseInt(createForm.maxParticipants) : undefined,
        });
        toast.success("Événement créé !");
        setShowCreate(false);
        load();
        } catch { toast.error("Erreur création"); }
    };

    const formatICSDate = (date: Date) =>
        date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const escapeICSText = (text: string) =>
        text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

    const handleAddToCalendar = (ev: CalEvent) => {
        const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AfrikCSE & AfrikVoyage//Events//FR",
        "BEGIN:VEVENT",
        `UID:${ev.id}@afrikcse`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(new Date(ev.startDate))}`,
        `DTEND:${formatICSDate(new Date(ev.endDate))}`,
        `SUMMARY:${escapeICSText(ev.title)}`,
        ...(ev.location ? [`LOCATION:${escapeICSText(ev.location)}`] : []),
        "END:VEVENT",
        "END:VCALENDAR",
        ].join("\r\n");

        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-")}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Événements CSE</h1>
            <p className="text-sm text-gray-500">
                Découvrez et participez aux événements organisés par votre CSE
            </p>
            </div>
            <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            >
            <Plus size={15} /> Créer un événement
            </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
            { label: "Événements ce mois",     value: stats.eventsThisMonth,  icon: "📅", color: "#0f766e", bg: "#f0fdf4" },
            { label: "Participants inscrits",  value: stats.totalRegistrations, icon: "👥", color: "#3b82f6", bg: "#eff6ff" },
            { label: "Taux de participation",  value: "87%",                  icon: "📈", color: "#f59e0b", bg: "#fffbeb" },
            { label: "Budget utilisé",         value: `€${stats.budget.toLocaleString()}`, icon: "💶", color: "#8b5cf6", bg: "#f5f3ff" },
            ].map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: s.bg }}>
                {s.icon}
                </div>
                <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                </div>
            </div>
            ))}
        </div>

        {/* Calendrier + Événements à venir */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Calendrier */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Calendrier des événements</h3>
                <div className="flex items-center gap-2">
                <button onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-28 text-center">
                    {MONTHS_FR[currentMonth]} {currentYear}
                </span>
                <button onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronRight size={16} />
                </button>
                </div>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                    {day}
                </div>
                ))}
            </div>

            {/* Cases du calendrier */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
                {/* Jours vides avant le 1er */}
                {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="bg-white min-h-16 p-1">
                    <span className="text-xs text-gray-300">
                    {getDaysInMonth(
                        currentMonth === 0 ? 11 : currentMonth - 1,
                        currentMonth === 0 ? currentYear - 1 : currentYear
                    ) - firstDay + i + 1}
                    </span>
                </div>
                ))}

                {/* Jours du mois */}
                {[...Array(daysInMonth)].map((_, i) => {
                const day      = i + 1;
                const isToday  = day === now.getDate() &&
                    currentMonth === now.getMonth() &&
                    currentYear === now.getFullYear();
                const dayEvents = eventsByDay[day] ?? [];

                return (
                    <div key={day}
                    className="bg-white min-h-16 p-1 hover:bg-gray-50 transition-colors">
                    <span
                        className="text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full"
                        style={isToday
                        ? { background: "#0f766e", color: "white" }
                        : { color: "#374151" }}
                    >
                        {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                        <div
                            key={ev.id}
                            className="text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                            style={{ background: ev.color ?? "#0f766e", fontSize: "10px" }}
                            title={ev.title}
                        >
                            {ev.icon} {ev.title}
                        </div>
                        ))}
                        {dayEvents.length > 2 && (
                        <p className="text-xs text-gray-400" style={{ fontSize: "10px" }}>
                            +{dayEvents.length - 2}
                        </p>
                        )}
                    </div>
                    </div>
                );
                })}

                {/* Jours vides après */}
                {[...Array(42 - daysInMonth - firstDay)].map((_, i) => (
                <div key={`after-${i}`} className="bg-white min-h-16 p-1">
                    <span className="text-xs text-gray-300">{i + 1}</span>
                </div>
                ))}
            </div>
            </div>

            {/* Événements à venir */}
            <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Événements à venir</h3>
            {!loading && events.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
                Aucun événement ce mois-ci.
                </div>
            )}
            {events.map((ev) => {
                const isRegistered = ev.registrations.some((r) => r.userId === user?.id);
                const isFull = ev.maxParticipants !== null &&
                ev._count.registrations >= ev.maxParticipants;
                const isLoading = registering === ev.id;

                return (
                <div key={ev.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                    <span className="text-xl shrink-0">{ev.icon ?? "📅"}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(ev.startDate).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short",
                        })} · {new Date(ev.startDate).toLocaleTimeString("fr-FR", {
                            hour: "2-digit", minute: "2-digit",
                        })} – {new Date(ev.endDate).toLocaleTimeString("fr-FR", {
                            hour: "2-digit", minute: "2-digit",
                        })}
                        </p>
                        {ev.maxParticipants && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            {ev._count.registrations} inscrits / {ev.maxParticipants}
                        </p>
                        )}
                    </div>
                    </div>

                    <button
                    onClick={() => !isFull && handleRegister(ev.id, isRegistered)}
                    disabled={isLoading || (isFull && !isRegistered)}
                    className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
                    style={isFull && !isRegistered
                        ? { background: "#f3f4f6", color: "#9ca3af" }
                        : isRegistered
                        ? { background: "#fee2e2", color: "#ef4444" }
                        : { background: ev.color ?? "#0f766e", color: "white" }}
                    >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isFull && !isRegistered
                        ? "Complet"
                        : isRegistered
                        ? "Se désinscrire"
                        : "S'inscrire"}
                    </button>

                    {isRegistered && (
                    <button
                        onClick={() => handleAddToCalendar(ev)}
                        className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <CalendarPlus size={14} /> Ajouter au calendrier
                    </button>
                    )}
                </div>
                );
            })}
            </div>
        </div>

        {/* Événements récents */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Événements récents</h3>
            </div>
            {recentEvents.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-6">
                Aucun événement passé pour le moment.
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentEvents.map((ev) => {
                const participants = ev._count.registrations;
                return (
                    <div key={ev.id}
                    className="rounded-xl overflow-hidden border border-gray-200">
                    <div
                        className="h-32 flex items-center justify-center text-5xl"
                        style={{ background: "#f0fdf4" }}
                    >
                        {ev.icon ?? "📅"}
                    </div>
                    <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(ev.startDate).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short", year: "numeric",
                        })} · {participants} participant{participants > 1 ? "s" : ""}
                        </p>
                        <div className="flex mt-2 -space-x-1">
                        {[...Array(Math.min(4, participants))].map((_, i) => (
                            <div
                            key={i}
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            style={{
                                background: ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6"][i],
                            }}
                            >
                            {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                        {participants > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                            +{participants - 4}
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>

        {/* Modal création événement */}
        {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="font-bold text-gray-900 mb-4">Créer un événement</h3>
                <div className="space-y-3">
                {[
                    { key: "title",    label: "Titre *",      placeholder: "Soirée Team Building" },
                    { key: "location", label: "Lieu",          placeholder: "Salle de conférence A" },
                ].map((f) => (
                    <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                        value={createForm[f.key as keyof typeof createForm]}
                        onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    />
                    </div>
                ))}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[
                    { key: "startDate", label: "Date début *" },
                    { key: "endDate",   label: "Date fin *" },
                    ].map((f) => (
                    <div key={f.key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                        <input type="datetime-local"
                        value={createForm[f.key as keyof typeof createForm]}
                        onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                        />
                    </div>
                    ))}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Capacité max (optionnel)
                    </label>
                    <input type="number"
                    value={createForm.maxParticipants}
                    onChange={(e) => setCreateForm({ ...createForm, maxParticipants: e.target.value })}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    />
                </div>
                </div>
                <div className="flex gap-2 mt-5">
                <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Annuler
                </button>
                <button onClick={handleCreateEvent}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "#0f766e" }}>
                    Créer
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}