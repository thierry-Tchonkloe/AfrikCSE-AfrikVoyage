"use client";

import { useState } from "react";
import {
    Plane, Shield, MapPin, Phone,
    AlertTriangle, CheckCircle,
} from "lucide-react";

// Données mock Duty of Care
const STATS = [
    { label: "Employees Traveling", value: "127", sub: "+12% vs last month", icon: Plane, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Lieux sûrs",          value: "89",  sub: "All Clear",          icon: CheckCircle, color: "#10b981", bg: "#f0fdf4" },
    { label: "Zones à risque",      value: "38",  sub: "Monitoring",         icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Alertes actives",     value: "3",   sub: "Requires attention", icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2" },
];

const ALERTS = [
    {
        type: "error", title: "Security Alert – Lagos",
        desc: "Political unrest reported in Victoria Island area",
        affected: "3 employees affected", color: "#ef4444", bg: "#fef2f2",
        action: "Contact",
    },
    {
        type: "warning", title: "Weather Warning",
        desc: "Severe Storms expected in Nairobi",
        affected: "7 employees", color: "#f59e0b", bg: "#fffbeb",
        action: "Notify",
    },
    {
        type: "info", title: "Travel Advisory",
        desc: "New visa requirements for Morocco",
        affected: "Info only", color: "#3b82f6", bg: "#eff6ff",
        action: "View",
    },
];

const EMPLOYEES = [
    { name: "John Okafor",   role: "Sales Manager",  location: "Lagos, Nigeria",   status: "High Risk", statusColor: "#ef4444" },
    { name: "Sarah Mbeki",   role: "Cape Town, SA",  location: "Cape Town, SA",    status: "Safe",      statusColor: "#10b981" },
    { name: "Ahmed Hassan",  role: "Consultant",     location: "Nairobi, Kenya",   status: "Caution",   statusColor: "#f59e0b" },
];

const EMERGENCY_CONTACTS = [
    { label: "Global Emergency", sub: "24/7 Crisis Response", action: "Call Now", color: "#ef4444", icon: Phone },
    { label: "Travel Support",   sub: "Travel assistance hotline", action: "Contact", color: "#3b82f6", icon: Phone },
    { label: "Security Team",    sub: "Internal security desk", action: "Message", color: "#10b981", icon: Shield },
];

// Carte du monde simplifiée avec points (SVG)
const WORLD_PINS = [
    { x: 210, y: 130, risk: "safe" },    // Europe
    { x: 270, y: 180, risk: "caution" }, // Moyen-Orient
    { x: 230, y: 200, risk: "high" },    // Afrique de l'Ouest
    { x: 290, y: 210, risk: "safe" },    // Afrique de l'Est
    { x: 350, y: 160, risk: "safe" },    // Asie du Sud
    { x: 420, y: 180, risk: "safe" },    // Asie du Sud-Est
    { x: 100, y: 140, risk: "safe" },    // Amérique du Nord
];

const RISK_COLOR = { safe: "#10b981", caution: "#f59e0b", high: "#ef4444" };

export default function ReportingPage() {
    const [emergencyOpen, setEmergencyOpen] = useState(false);

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Surveillance du devoir de diligence</h1>
            <p className="text-sm text-gray-500">
                Suivi en temps réel de la sécurité et de la localisation des employés
            </p>
            </div>
            <button
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-red-500 hover:bg-red-600"
            >
            <AlertTriangle size={15} /> Emergency Protocol
            </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.bg }}>
                <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</p>
                </div>
            </div>
            ))}
        </div>

        {/* Carte + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Carte monde SVG */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                Lieux d&#39;affectation des employés dans le monde
                </h3>
                <span className="text-xs text-red-500 font-medium">● Live</span>
            </div>

            {/* Légende */}
            <div className="flex gap-4 mb-3">
                {[
                { label: "Safe (89)",    color: "#10b981" },
                { label: "Caution (38)", color: "#f59e0b" },
                { label: "High Risk (3)",color: "#ef4444" },
                ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                    {l.label}
                </div>
                ))}
            </div>

            {/* SVG carte simplifiée */}
            <div className="bg-gray-50 rounded-xl overflow-hidden" style={{ height: "220px" }}>
                <svg viewBox="0 0 500 250" className="w-full h-full">
                {/* Fond océan */}
                <rect width="500" height="250" fill="#dbeafe" />
                {/* Continents simplifiés */}
                <path d="M60,60 Q120,40 180,60 Q220,80 200,130 Q160,160 100,140 Q50,120 60,60Z"
                    fill="#d1fae5" opacity="0.8" />
                <path d="M190,50 Q280,30 380,50 Q440,70 460,120 Q430,160 350,170 Q270,165 210,140 Q170,110 190,50Z"
                    fill="#d1fae5" opacity="0.8" />
                <path d="M200,140 Q260,130 300,160 Q320,200 280,230 Q230,240 200,210 Q180,180 200,140Z"
                    fill="#d1fae5" opacity="0.8" />
                <path d="M320,80 Q400,60 460,90 Q480,130 450,170 Q410,200 360,180 Q310,150 320,80Z"
                    fill="#d1fae5" opacity="0.8" />
                <path d="M390,120 Q430,110 470,130 Q480,160 450,190 Q410,200 380,175 Q360,145 390,120Z"
                    fill="#d1fae5" opacity="0.8" />

                {/* Pins employés */}
                {WORLD_PINS.map((pin, i) => (
                    <g key={i}>
                    <circle cx={pin.x} cy={pin.y} r="8"
                        fill={RISK_COLOR[pin.risk as keyof typeof RISK_COLOR]}
                        opacity="0.3" />
                    <circle cx={pin.x} cy={pin.y} r="4"
                        fill={RISK_COLOR[pin.risk as keyof typeof RISK_COLOR]} />
                    </g>
                ))}
                </svg>
            </div>
            </div>

            {/* Alertes actives */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Alertes actives</h3>
            </div>
            <div className="space-y-3">
                {ALERTS.map((alert) => (
                <div key={alert.title}
                    className="p-3 rounded-xl"
                    style={{ background: alert.bg }}>
                    <div className="flex items-start gap-2">
                    <AlertTriangle size={14} style={{ color: alert.color }} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: alert.color }}>
                        {alert.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{alert.desc}</p>
                        <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{alert.affected}</span>
                        <button
                            className="text-xs px-2 py-1 rounded font-medium text-white"
                            style={{ background: alert.color }}
                        >
                            {alert.action}
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            <button className="text-xs mt-3 w-full text-center"
                style={{ color: "#0f766e" }}>
                View all alerts →
            </button>
            </div>
        </div>

        {/* Statut employés + Contacts urgence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Employee Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Employee Status</h3>
                <input placeholder="Search employees..."
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none" />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100">
                    {["Employee", "Location", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium pb-2">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {EMPLOYEES.map((emp) => (
                    <tr key={emp.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5">
                        <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                            {emp.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.role}</p>
                        </div>
                        </div>
                    </td>
                    <td className="py-2.5">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={11} />
                        {emp.location}
                        </div>
                    </td>
                    <td className="py-2.5">
                        <span className="text-xs font-medium" style={{ color: emp.statusColor }}>
                        {emp.status}
                        </span>
                    </td>
                    <td className="py-2.5">
                        <button className="text-xs font-medium hover:underline"
                        style={{ color: "#0f766e" }}>
                        {emp.status === "High Risk" ? "Contact" : emp.status === "Safe" ? "View" : "Monitor"}
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            </div>

            {/* Contacts urgence + Quick actions */}
            <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Contacts d&#39;urgence</h3>
                <div className="space-y-3">
                {EMERGENCY_CONTACTS.map((c) => (
                    <div key={c.label}
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ borderColor: c.color + "40", background: c.color + "08" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: c.color + "20" }}>
                        <c.icon size={16} style={{ color: c.color }} />
                        </div>
                        <div>
                        <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                        <p className="text-xs text-gray-500">{c.sub}</p>
                        </div>
                    </div>
                    <button
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                        style={{ background: c.color }}
                    >
                        {c.action}
                    </button>
                    </div>
                ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                {["Send Alert", "Mass Notify", "Evacuation", "Check-in"].map((action) => (
                    <button key={action}
                    className="py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 font-medium">
                    {action}
                    </button>
                ))}
                </div>
            </div>
            </div>
        </div>

        {/* Modal Emergency Protocol */}
        {emergencyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-red-500" />
                <h3 className="font-bold text-gray-900">Emergency Protocol</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                Activez le protocole d&acute;urgence pour alerter tous les voyageurs actuellement en déplacement.
                </p>
                <div className="flex gap-2">
                <button onClick={() => setEmergencyOpen(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Annuler
                </button>
                <button
                    onClick={() => { setEmergencyOpen(false); alert("Protocole d'urgence activé !"); }}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-semibold bg-red-500">
                    Activer
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}