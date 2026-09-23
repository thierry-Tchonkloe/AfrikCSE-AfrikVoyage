"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { Image, BarChart2, CalendarDays, Heart, MessageCircle, MoreHorizontal, Loader2, Send } from "lucide-react";
import { UserAvatar } from "@/components/employes/UserAvatar";
import { useTranslations } from "next-intl";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"employee.communication">>;

interface PollOption {
    id: string;
    label: string;
    _count: { votes: number };
    // Vote(s) de L'UTILISATEUR COURANT uniquement pour cette option (filtré
    // côté serveur) — présence d'une entrée = "j'ai déjà voté cette option".
    votes: { id: string }[];
}

interface Post {
    id: string;
    type: string;
    title: string | null;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    author: { firstName: string; lastName: string; avatar?: string | null; role: string; jobTitle: string | null };
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
    author: { firstName: string; lastName: string; avatar?: string | null };
}

const getActivityConfig = (t: Translator): Record<string, { label: string; color: string }> => ({
    ARTICLE:           { label: t("publishedArticle"), color: "#0f766e" },
    POLL:              { label: t("launchedPoll"),  color: "#3b82f6" },
    EVENT_ANNOUNCEMENT:{ label: t("announcedEvent"), color: "#f59e0b" },
});

/** Dérive l'état "j'ai déjà liké / déjà voté" de l'utilisateur courant depuis
 *  le payload réel de l'API, au lieu de partir d'un état local vide qui
 *  contredit la vérité serveur après un rechargement de page. */
function deriveLikeVoteState(posts: Post[], userId: string | undefined) {
    const liked: Record<string, boolean> = {};
    const voted: Record<string, string> = {};
    for (const post of posts) {
        if (userId && post.likes.some((l) => l.userId === userId)) liked[post.id] = true;
        const myOption = post.pollOptions.find((o) => o.votes.length > 0);
        if (myOption) voted[post.id] = myOption.id;
    }
    return { liked, voted };
}

export default function CommunicationPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("employee.communication");
    const formatTime = useRelativeTime();
    const ACTIVITY_CONFIG = useMemo(() => getActivityConfig(t), [t]);
    const router = useRouter();
    const { user }  = useAuth();
    const [posts, setPosts]       = useState<Post[]>([]);
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
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
        setPage(postsRes.page ?? 1);
        setTotalPages(postsRes.totalPages ?? 1);
        setUpcomingEvents(eventsRes);

        // Réhydrate l'état "j'ai déjà liké / déjà voté" depuis le payload réel
        // — on REMPLACE ici (chargement initial), jamais sur une simple mise à
        // jour locale de `posts` (ex: compteur de commentaires bumpé), pour ne
        // pas écraser un like/vote optimiste pas encore reflété dans `posts`.
        const { liked, voted } = deriveLikeVoteState(postsRes.posts, user?.id);
        setLikedPosts(liked);
        setVotedPolls(voted);
        } catch {
        toast.error(t("errorLoadingNewsFeed"));
        } finally {
        setLoading(false);
        }
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const handleLoadMore = async () => {
        if (loadingMore || page >= totalPages) return;
        setLoadingMore(true);
        try {
        const nextPage = page + 1;
        const postsRes = await employeeService.getPosts(nextPage);
        setPosts((prev) => [...prev, ...postsRes.posts]);
        setPage(postsRes.page ?? nextPage);
        setTotalPages(postsRes.totalPages ?? totalPages);

        // Fusionne (n'écrase pas) l'état liké/voté des posts nouvellement
        // chargés avec celui déjà en place pour les posts existants.
        const { liked, voted } = deriveLikeVoteState(postsRes.posts, user?.id);
        setLikedPosts((prev) => ({ ...prev, ...liked }));
        setVotedPolls((prev) => ({ ...prev, ...voted }));
        } catch {
        toast.error(t("errorLoadingPosts"));
        } finally {
        setLoadingMore(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setPosting(true);
        try {
        const pollOptions = postType === "POLL"
            ? pollOptionInputs.map((o) => o.trim()).filter(Boolean)
            : undefined;
        if (postType === "POLL" && (!pollOptions || pollOptions.length < 2)) {
            toast.error(t("addLeast2Poll"));
            return;
        }
        await employeeService.createPost({ type: postType, content: newPost, pollOptions });
        toast.success(t("postCreated"));
        setNewPost("");
        setPollOptionInputs(["", ""]);
        load();
        } catch { toast.error(t("errorWhilePosting")); }
        finally { setPosting(false); }
    };

    const handleLike = async (postId: string) => {
        const wasLiked = !!likedPosts[postId];
        const nextLiked = !wasLiked;
        setPosts((prev) => prev.map((p) =>
            p.id === postId ? { ...p, _count: { ...p._count, likes: p._count.likes + (nextLiked ? 1 : -1) } } : p
        ));
        setLikedPosts((prev) => ({ ...prev, [postId]: nextLiked }));
        try {
            // Action explicite (like/unlike) plutôt qu'un bascule ambigu côté
            // serveur — évite qu'un double-clic ou un retry réseau ne bascule
            // deux fois et fausse le compteur.
            await employeeService.toggleLike(postId, nextLiked ? "like" : "unlike");
        } catch {
            setPosts((prev) => prev.map((p) =>
                p.id === postId ? { ...p, _count: { ...p._count, likes: p._count.likes + (nextLiked ? -1 : 1) } } : p
            ));
            setLikedPosts((prev) => ({ ...prev, [postId]: wasLiked }));
            toast.error(t("errorWhileLiking"));
        }
    };

    const handleVote = async (postId: string, optionId: string) => {
        if (votedPolls[postId]) return;
        setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));
        try {
            await employeeService.vote(optionId);
        } catch {
            setVotedPolls((prev) => {
                const next = { ...prev };
                delete next[postId];
                return next;
            });
            toast.error(t("errorWhileVoting"));
        }
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
            toast.error(t("errorLoadingComments"));
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
        } catch { toast.error(t("errorWhileAddingComment")); }
    };

    const activePolls = posts
        .filter((p) => p.type === "POLL" && p.pollOptions.length > 0)
        .slice(0, 3);

    const recentActivity = posts.slice(0, 4);

    return (
        <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("cseCommunication")}</h1>
            <p className="text-sm text-gray-500">
                {t("stayInformedAboutCompany")}
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
            {t("createArticle")}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Feed principal ── */}
            <div className="lg:col-span-2 space-y-4">
            {/* Zone de publication */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-3">
                <UserAvatar
                    avatar={user?.avatar}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    className="w-9 h-9 text-xs"
                />
                <input
                    ref={composerRef}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={postType === "POLL"
                        ? t("askPollQuestion")
                        : t("shareSomethingColleagues")}
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
                        placeholder={t("option", { p1: i + 1 })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                    />
                    ))}
                    <button
                    onClick={() => setPollOptionInputs((prev) => [...prev, ""])}
                    className="text-xs hover:underline"
                    style={{ color: "#0f766e" }}
                    >
                    {t("addOption")}
                    </button>
                </div>
                )}

                <div className="flex items-center justify-between">
                <div className="flex gap-1">
                    {[
                    { icon: Image,        label: t("photo"), type: "ARTICLE" as const },
                    { icon: BarChart2,    label: t("poll"),  type: "POLL" as const },
                    { icon: CalendarDays, label: t("event"), type: "EVENT_ANNOUNCEMENT" as const },
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
                    {t("publish")}
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
                {t("noPostsMoment")}
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
                        <UserAvatar
                        avatar={post.author.avatar}
                        firstName={post.author.firstName}
                        lastName={post.author.lastName}
                        background={post.author.role === "ADMIN" ? "#1e3a5f" : "#0f766e"}
                        className="w-10 h-10 text-xs"
                        />
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
                            onClick={() => handleVote(post.id, option.id)}
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
                        {t("vote", { totalVotes, p2: totalVotes > 1 ? "s" : "", p3: formatTime(post.createdAt) })}
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
                        {post._count.likes}
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
                        <p className="text-xs text-gray-400 text-center py-2">{t("noCommentsMoment")}</p>
                        ) : (
                        comments[post.id]!.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                            <UserAvatar
                                avatar={c.author.avatar}
                                firstName={c.author.firstName}
                                lastName={c.author.lastName}
                                className="w-7 h-7 text-[10px]"
                            />
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
                            placeholder={t("writeComment")}
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

            {/* Charger plus */}
            {!loading && page < totalPages && (
                <div className="flex justify-center pt-2">
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                    {loadingMore && <Loader2 size={12} className="animate-spin" />}
                    {t("loadMore")}
                </button>
                </div>
            )}
            </div>

            {/* ── Sidebar droite ── */}
            <div className="space-y-4">
            {/* Événements à venir */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900">{t("upcomingEvents")}</h3>
                <button
                    onClick={() => router.push("/employes/evenements")}
                    className="text-xs hover:underline" style={{ color: "#0f766e" }}>
                    {t("seeAll")}
                </button>
                </div>
                <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                    <p className="text-xs text-gray-400">{t("noUpcomingEvents")}</p>
                ) : (
                    upcomingEvents.map((ev) => {
                    const start = new Date(ev.startDate);
                    const end = new Date(ev.endDate);
                    const month = start.toLocaleDateString(dateLocale, { month: "short" }).replace(".", "").toUpperCase();
                    const time = `${start.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}`;

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
                <h3 className="font-semibold text-sm text-gray-900">{t("activePolls")}</h3>
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
                    <p className="text-xs text-gray-400">{t("noActivePolls")}</p>
                ) : (
                    activePolls.map((poll) => {
                    const totalVotes = poll.pollOptions.reduce((s, o) => s + o._count.votes, 0);
                    const leadingVotes = Math.max(...poll.pollOptions.map((o) => o._count.votes));
                    const pct = totalVotes > 0 ? Math.round((leadingVotes / totalVotes) * 100) : 0;

                    return (
                        <div key={poll.id}>
                        <p className="text-xs font-medium text-gray-900">{poll.content}</p>
                        <div className="flex justify-between text-xs text-gray-500 mt-1 mb-1.5">
                            <span>{t("vote2", { totalVotes, p2: totalVotes > 1 ? "s" : "" })}</span>
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
                <h3 className="font-semibold text-sm text-gray-900 mb-3">{t("recentActivity")}</h3>
                <div className="space-y-2.5">
                {recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-400">{t("noRecentActivity")}</p>
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