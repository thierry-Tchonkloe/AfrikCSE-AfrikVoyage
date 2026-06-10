"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { Image, BarChart2, CalendarDays, Heart, MessageCircle, MoreHorizontal, Loader2, Send } from "lucide-react";

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

interface UpcomingEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: string | null;
    color: string | null;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: { firstName: string; lastName: string };
}

const ACTIVITY_CONFIG: Record<string, { label: string; color: string }> = {
    ARTICLE:           { label: "a publié un article", color: "#0f766e" },
    POLL:              { label: "a lancé un sondage",  color: "#3b82f6" },
    EVENT_ANNOUNCEMENT:{ label: "a annoncé un événement", color: "#f59e0b" },
};

export default function CommunicationPage() {
    const router = useRouter();
    const { user }  = useAuth();
    const [posts, setPosts]       = useState<Post[]>([]);
    const [loading, setLoading]   = useState(true);
    const [newPost, setNewPost]   = useState("");
    const [postType, setPostType] = useState<"ARTICLE" | "POLL" | "EVENT_ANNOUNCEMENT">("ARTICLE");
    const [pollOptionInputs, setPollOptionInputs] = useState<string[]>(["", ""]);
    const [posting, setPosting] = useState(false);
    const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

    const composerRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [postsRes, eventsRes] = await Promise.all([
            employeeService.getPosts(),
            employeeService.getUpcomingEvents(),
        ]);
        setPosts(postsRes.posts);
        setUpcomingEvents(eventsRes);
        } catch {
        toast.error("Erreur lors du chargement du fil d'actualité");
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setPosting(true);
        try {
        const pollOptions = postType === "POLL"
            ? pollOptionInputs.map((o) => o.trim()).filter(Boolean)
            : undefined;
        if (postType === "POLL" && (!pollOptions || pollOptions.length < 2)) {
            toast.error("Ajoutez au moins 2 options de sondage");
            return;
        }
        await employeeService.createPost({ type: postType, content: newPost, pollOptions });
        toast.success("Publication créée !");
        setNewPost("");
        setPollOptionInputs(["", ""]);
        load();
        } catch { toast.error("Erreur publication"); }
        finally { setPosting(false); }
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

    const toggleComments = async (postId: string) => {
        const willOpen = !openComments[postId];
        setOpenComments((prev) => ({ ...prev, [postId]: willOpen }));
        if (willOpen && !comments[postId]) {
        setCommentLoading((prev) => ({ ...prev, [postId]: true }));
        try {
            const data = await employeeService.getComments(postId);
            setComments((prev) => ({ ...prev, [postId]: data }));
        } catch {
            toast.error("Erreur lors du chargement des commentaires");
        } finally {
            setCommentLoading((prev) => ({ ...prev, [postId]: false }));
        }
        }
    };

    const handleAddComment = async (postId: string) => {
        const content = (commentDrafts[postId] ?? "").trim();
        if (!content) return;
        try {
        const comment = await employeeService.addComment(postId, content);
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }));
        setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) => prev.map((p) =>
            p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p
        ));
        } catch { toast.error("Erreur lors de l'ajout du commentaire"); }
    };

    const formatTime = (iso: string) => {
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return "À l'instant";
        if (diff < 3600) return `il y a ${Math.round(diff / 60)} min`;
        if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
        return `il y a ${Math.round(diff / 86400)} j`;
    };

    const activePolls = posts
        .filter((p) => p.type === "POLL" && p.pollOptions.length > 0)
        .slice(0, 3);

    const recentActivity = posts.slice(0, 4);

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
            onClick={() => {
                setPostType("ARTICLE");
                composerRef.current?.focus();
            }}
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
                    ref={composerRef}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={postType === "POLL"
                        ? "Posez votre question de sondage..."
                        : "Partagez quelque chose avec vos collègues..."}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                />
                </div>

                {postType === "POLL" && (
                <div className="pl-12 space-y-2">
                    {pollOptionInputs.map((opt, i) => (
                    <input
                        key={i}
                        value={opt}
                        onChange={(e) => setPollOptionInputs((prev) =>
                        prev.map((o, idx) => idx === i ? e.target.value : o)
                        )}
                        placeholder={`Option ${i + 1}`}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    />
                    ))}
                    <button
                    onClick={() => setPollOptionInputs((prev) => [...prev, ""])}
                    className="text-xs hover:underline"
                    style={{ color: "#0f766e" }}
                    >
                    + Ajouter une option
                    </button>
                </div>
                )}

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
                    disabled={!newPost.trim() || posting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-40"
                    style={{ background: "#0f766e" }}
                >
                    {posting && <Loader2 size={12} className="animate-spin" />}
                    Publier
                </button>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-44 animate-pulse" />
                ))
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                Aucune publication pour le moment.
                </div>
            ) : (
                posts.map((post) => {
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
                        style={{ background: post.author.role === "ADMIN" ? "#1e3a5f" : "#0f766e" }}
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
                        <p className="text-xs text-gray-400">
                        {totalVotes} vote{totalVotes > 1 ? "s" : ""} · {formatTime(post.createdAt)}
                        </p>
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
                    <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: openComments[post.id] ? "#0f766e" : "#6b7280" }}
                    >
                        <MessageCircle size={15} />
                        {post._count.comments}
                    </button>
                    </div>

                    {/* Commentaires */}
                    {openComments[post.id] && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                        {commentLoading[post.id] ? (
                        <div className="flex justify-center py-3">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                        ) : (comments[post.id]?.length ?? 0) === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Aucun commentaire pour le moment.</p>
                        ) : (
                        comments[post.id]!.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                style={{ background: "#0f766e" }}
                            >
                                {c.author.firstName[0]}{c.author.lastName[0]}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5">
                                <p className="text-xs font-semibold text-gray-900">
                                {c.author.firstName} {c.author.lastName}
                                </p>
                                <p className="text-xs text-gray-700">{c.content}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(c.createdAt)}</p>
                            </div>
                            </div>
                        ))
                        )}
                        <div className="flex items-center gap-2 pt-1">
                        <input
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                            placeholder="Écrire un commentaire..."
                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                        />
                        <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!(commentDrafts[post.id] ?? "").trim()}
                            className="p-1.5 rounded-lg text-white disabled:opacity-40"
                            style={{ background: "#0f766e" }}
                        >
                            <Send size={13} />
                        </button>
                        </div>
                    </div>
                    )}
                </div>
                );
                })
            )}
            </div>

            {/* ── Sidebar droite ── */}
            <div className="space-y-4">
            {/* Événements à venir */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">Événements à venir</h3>
                <button
                    onClick={() => router.push("/employes/evenements")}
                    className="text-xs hover:underline" style={{ color: "#0f766e" }}>
                    Voir tout
                </button>
                </div>
                <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                    <p className="text-xs text-gray-400">Aucun événement à venir.</p>
                ) : (
                    upcomingEvents.map((ev) => {
                    const start = new Date(ev.startDate);
                    const end = new Date(ev.endDate);
                    const month = start.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase();
                    const time = `${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

                    return (
                        <div key={ev.id} className="flex gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: ev.color ?? "#0f766e" }}
                        >
                            <span style={{ fontSize: "9px" }}>{month}</span>
                            <span className="text-sm leading-none">{start.getDate()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{ev.title}</p>
                            <p className="text-xs text-gray-500">{time}</p>
                            <p className="text-xs text-gray-400">{ev.location ?? "—"}</p>
                        </div>
                        </div>
                    );
                    })
                )}
                </div>
            </div>

            {/* Sondages actifs */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">Sondages actifs</h3>
                {activePolls.length > 0 && (
                    <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#f59e0b" }}
                    >
                    {activePolls.length}
                    </span>
                )}
                </div>
                <div className="space-y-3">
                {activePolls.length === 0 ? (
                    <p className="text-xs text-gray-400">Aucun sondage actif.</p>
                ) : (
                    activePolls.map((poll) => {
                    const totalVotes = poll.pollOptions.reduce((s, o) => s + o._count.votes, 0);
                    const leadingVotes = Math.max(...poll.pollOptions.map((o) => o._count.votes));
                    const pct = totalVotes > 0 ? Math.round((leadingVotes / totalVotes) * 100) : 0;

                    return (
                        <div key={poll.id}>
                        <p className="text-xs font-medium text-gray-900">{poll.content}</p>
                        <div className="flex justify-between text-xs text-gray-500 mt-1 mb-1.5">
                            <span>{totalVotes} vote{totalVotes > 1 ? "s" : ""}</span>
                            <span>{formatTime(poll.createdAt)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full"
                            style={{ width: `${pct}%`, background: "#0f766e" }} />
                        </div>
                        </div>
                    );
                    })
                )}
                </div>
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Activité récente</h3>
                <div className="space-y-2.5">
                {recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-400">Aucune activité récente.</p>
                ) : (
                    recentActivity.map((post) => {
                    const { label, color } = ACTIVITY_CONFIG[post.type] ?? ACTIVITY_CONFIG.ARTICLE;
                    return (
                        <div key={post.id} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: color }} />
                        <div>
                            <p className="text-xs text-gray-700">
                            {post.author.firstName} {post.author.lastName} {label}
                            </p>
                            <p className="text-xs text-gray-400">{formatTime(post.createdAt)}</p>
                        </div>
                        </div>
                    );
                    })
                )}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}