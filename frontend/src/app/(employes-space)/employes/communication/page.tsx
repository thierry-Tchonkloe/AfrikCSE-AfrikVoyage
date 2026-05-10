"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { Image, BarChart2, CalendarDays, Send, Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";

interface PollOption {
    id: string;
    label: string;
    _count: { votes: number };
}

interface Post {
    id: string;
    type: string;
    title: string | null;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    author: { firstName: string; lastName: string; role: string; jobTitle: string | null };
    _count: { likes: number; comments: number };
    likes: { userId: string }[];
    pollOptions: PollOption[];
}

// Mock posts riches
const MOCK_POSTS: Post[] = [
    {
        id: "1", type: "ARTICLE",
        title: "🎉 Lancement d'un nouveau programme de bien-être",
        content: "Nous sommes ravis d'annoncer notre nouveau programme de bien-être complet, qui débutera le mois prochain. Il comprend des abonnements à une salle de sport, un soutien psychologique et des bilans de santé trimestriels pour tous les employés. Votre bien-être est notre priorité.",
        imageUrl: "wellness",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        author: { firstName: "Sarah", lastName: "Mensah", role: "RH", jobTitle: "HR Manager" },
        _count: { likes: 42, comments: 18 },
        likes: [],
        pollOptions: [],
    },
    {
        id: "2", type: "POLL",
        title: null,
        content: "Quelle activité de team building préférez-vous pour le deuxième trimestre ?",
        imageUrl: null,
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        author: { firstName: "Marcus", lastName: "Diallo", role: "MANAGER", jobTitle: "CSE Committee" },
        _count: { likes: 0, comments: 0 },
        likes: [],
        pollOptions: [
        { id: "p1", label: "Journée d'aventure en plein air", _count: { votes: 70 } },
        { id: "p2", label: "Atelier de cuisine",             _count: { votes: 44 } },
        { id: "p3", label: "Tournoi de jeux vidéo",          _count: { votes: 42 } },
        ],
    },
    {
        id: "3", type: "ARTICLE",
        title: "Résultats et reconnaissance du Q1",
        content: "Bravo à toute l'équipe ! Nous avons dépassé nos objectifs du premier trimestre de 23 %. Un grand bravo aux équipes des ventes, de l'ingénierie et du service client. Votre dévouement et votre esprit d'innovation sont les moteurs de notre succès. Nous espérons une deuxième trimestre encore plus performant !",
        imageUrl: null,
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        author: { firstName: "David", lastName: "Okonkwo", role: "ADMIN_ENTREPRISE", jobTitle: "CEO" },
        _count: { likes: 89, comments: 34 },
        likes: [],
        pollOptions: [],
    },
];

// Événements à venir (sidebar)
const UPCOMING_EVENTS = [
    { date: "MAR 28", title: "Journée de team building", time: "10:00AM – 6:00 PM", loc: "Adventure Park, Accra", color: "#0f766e" },
    { date: "AVR 05", title: "Atelier de bien-être",     time: "2:00 PM – 3:30 PM", loc: "Conference Room A",     color: "#3b82f6" },
    { date: "AVR 12", title: "Anniversaire de l'entreprise", time: "6:00 PM – 9:00 PM", loc: "Grand Ballroom",    color: "#f59e0b" },
];

// Sondages actifs (sidebar)
const ACTIVE_POLLS = [
    { question: "Service traiteur pour le déjeuner préféré ?", votes: 98,  timeLeft: "2 days left", color: "#0f766e" },
    { question: "Flexibilité des horaires de bureau ?",         votes: 142, timeLeft: "3 days left", color: "#3b82f6" },
    { question: "Priorités budgétaires du CSE ?",               votes: 57,  timeLeft: "1 week left", color: "#f59e0b" },
];

export default function CommunicationPage() {
    const { user }  = useAuth();
    const [posts, setPosts]       = useState<Post[]>([]);
    const [loading, setLoading]   = useState(true);
    const [newPost, setNewPost]   = useState("");
    const [postType, setPostType] = useState<"ARTICLE" | "POLL" | "EVENT_ANNOUNCEMENT">("ARTICLE");
    const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const res = await employeeService.getPosts();
        setPosts(res.posts.length ? res.posts : MOCK_POSTS);
        } catch {
        setPosts(MOCK_POSTS);
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        try {
        await employeeService.createPost({ type: postType, content: newPost });
        toast.success("Publication créée !");
        setNewPost("");
        load();
        } catch { toast.error("Erreur publication"); }
    };

    const handleLike = async (postId: string) => {
        setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
        try { await employeeService.toggleLike(postId); }
        catch { setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] })); }
    };

    const handleVote = async (postId: string, optionId: string, totalVotes: number) => {
        if (votedPolls[postId]) return;
        setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));
        try { await employeeService.vote(optionId); }
        catch { toast.error("Erreur vote"); }
    };

    const formatTime = (iso: string) => {
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 3600) return `${Math.round(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
        return `${Math.round(diff / 86400)} days ago`;
    };

    return (
        <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Communication CSE</h1>
            <p className="text-sm text-gray-500">
                Restez informé(e) des actualités, événements et sondages de l&#39;entreprise.
            </p>
            </div>
            <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            onClick={() => toast.info("Créer un article — fonctionnalité admin")}
            >
            + Créer un article
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Feed principal ── */}
            <div className="lg:col-span-2 space-y-4">
            {/* Zone de publication */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "#0f766e" }}
                >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <input
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with your colleagues..."
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                />
                </div>
                <div className="flex items-center justify-between">
                <div className="flex gap-1">
                    {[
                    { icon: Image,        label: "Photo", type: "ARTICLE" as const },
                    { icon: BarChart2,    label: "Poll",  type: "POLL" as const },
                    { icon: CalendarDays, label: "Event", type: "EVENT_ANNOUNCEMENT" as const },
                    ].map((btn) => (
                    <button
                        key={btn.label}
                        onClick={() => setPostType(btn.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                        style={postType === btn.type
                        ? { background: "#f0fdf4", color: "#0f766e" }
                        : { color: "#6b7280" }}
                    >
                        <btn.icon size={14} /> {btn.label}
                    </button>
                    ))}
                </div>
                <button
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    className="px-4 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-40"
                    style={{ background: "#0f766e" }}
                >
                    Post
                </button>
                </div>
            </div>

            {/* Posts */}
            {(loading ? MOCK_POSTS : posts).map((post) => {
                const isLiked = likedPosts[post.id];
                const totalVotes = post.pollOptions.reduce((s, o) => s + o._count.votes, 0);

                return (
                <div key={post.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    {/* Auteur */}
                    <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: post.author.role === "ADMIN_ENTREPRISE" ? "#1e3a5f" : "#0f766e" }}
                        >
                        {post.author.firstName[0]}{post.author.lastName[0]}
                        </div>
                        <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                            {post.author.firstName} {post.author.lastName}
                            </p>
                            {post.type === "POLL" && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#eff6ff", color: "#3b82f6" }}>
                                POLL
                            </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {post.author.jobTitle ?? post.author.role} · {formatTime(post.createdAt)}
                        </p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={18} />
                    </button>
                    </div>

                    {/* Titre */}
                    {post.title && (
                    <h3 className="font-semibold text-gray-900">{post.title}</h3>
                    )}

                    {/* Contenu */}
                    <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

                    {/* Image placeholder */}
                    {post.imageUrl && (
                    <div
                        className="rounded-xl h-40 flex items-center justify-center text-5xl"
                        style={{ background: "#f0fdf4" }}
                    >
                        🧘‍♀️
                    </div>
                    )}

                    {/* Sondage */}
                    {post.type === "POLL" && post.pollOptions.length > 0 && (
                    <div className="space-y-2">
                        {post.pollOptions.map((option) => {
                        const pct = totalVotes > 0
                            ? Math.round((option._count.votes / totalVotes) * 100)
                            : 0;
                        const isVoted = votedPolls[post.id] === option.id;
                        const hasVoted = !!votedPolls[post.id];

                        return (
                            <button
                            key={option.id}
                            onClick={() => handleVote(post.id, option.id, totalVotes)}
                            disabled={hasVoted}
                            className="w-full text-left px-3 py-2.5 rounded-lg border transition-all overflow-hidden relative"
                            style={{
                                borderColor: isVoted ? "#0f766e" : "#e5e7eb",
                                background: hasVoted ? "transparent" : "#f9fafb",
                            }}
                            >
                            {hasVoted && (
                                <div
                                className="absolute inset-0 rounded-lg transition-all"
                                style={{
                                    width: `${pct}%`,
                                    background: isVoted ? "#f0fdf4" : "#f3f4f6",
                                }}
                                />
                            )}
                            <div className="relative flex justify-between items-center">
                                <span className="text-sm text-gray-700">{option.label}</span>
                                {hasVoted && (
                                <span className="text-xs font-bold"
                                    style={{ color: isVoted ? "#0f766e" : "#6b7280" }}>
                                    {pct}%
                                </span>
                                )}
                            </div>
                            </button>
                        );
                        })}
                        <p className="text-xs text-gray-400">{totalVotes} votes · Ends in 2 days</p>
                    </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: isLiked ? "#ef4444" : "#6b7280" }}
                    >
                        <Heart size={15} fill={isLiked ? "#ef4444" : "none"} />
                        {post._count.likes + (isLiked ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MessageCircle size={15} />
                        {post._count.comments}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Send size={15} />
                        3
                    </button>
                    <button className="ml-auto text-gray-400 hover:text-gray-600">
                        <Bookmark size={15} />
                    </button>
                    </div>
                </div>
                );
            })}
            </div>

            {/* ── Sidebar droite ── */}
            <div className="space-y-4">
            {/* Événements à venir */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">Événements à venir</h3>
                <button className="text-xs hover:underline" style={{ color: "#0f766e" }}>
                    View All
                </button>
                </div>
                <div className="space-y-3">
                {UPCOMING_EVENTS.map((ev) => (
                    <div key={ev.title} className="flex gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: ev.color }}
                    >
                        <span style={{ fontSize: "9px" }}>{ev.date.split(" ")[0]}</span>
                        <span className="text-sm leading-none">{ev.date.split(" ")[1]}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500">{ev.time}</p>
                        <p className="text-xs text-gray-400">{ev.loc}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Sondages actifs */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">Sondages actifs</h3>
                <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#f59e0b" }}
                >
                    3
                </span>
                </div>
                <div className="space-y-3">
                {ACTIVE_POLLS.map((poll) => (
                    <div key={poll.question}>
                    <p className="text-xs font-medium text-gray-900">{poll.question}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-1 mb-1.5">
                        <span>{poll.votes} votes</span>
                        <span>{poll.timeLeft}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full"
                        style={{ width: "60%", background: poll.color }} />
                    </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Activité récente</h3>
                <div className="space-y-2.5">
                {[
                    { action: "Sarah M. liked your post",  time: "5 minutes ago",  color: "#ef4444" },
                    { action: "Marcus D. commented on poll", time: "1 hour ago",   color: "#3b82f6" },
                    { action: "New event: Team Building Day", time: "3 hours ago", color: "#10b981" },
                    { action: "12 colleagues joined the platform", time: "Yesterday", color: "#f59e0b" },
                ].map((act) => (
                    <div key={act.action} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: act.color }} />
                    <div>
                        <p className="text-xs text-gray-700">{act.action}</p>
                        <p className="text-xs text-gray-400">{act.time}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}