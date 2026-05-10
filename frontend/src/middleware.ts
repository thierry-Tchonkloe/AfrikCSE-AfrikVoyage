import { NextRequest, NextResponse } from "next/server";

// Routes accessibles sans authentification
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/", "/infos"];

// Routes réservées au Super Admin uniquement
const SUPER_ADMIN_ROUTES = ["/admin", "/companies", "/companies/*/*", "/companies/*"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Récupère le token depuis les cookies
    // (on va stocker le token dans un cookie httpOnly en plus du localStorage)
    const token = request.cookies.get("accessToken")?.value;

    const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
    const isAdminRoute = SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r));

    // ── Pas de token + route protégée → login ──
    if (!token && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // ── Token présent + route publique → hub ──
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL("/hub", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Applique le middleware sur toutes les routes sauf assets statiques
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};