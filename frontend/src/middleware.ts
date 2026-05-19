import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/", "/infos", "/activate"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("accessToken")?.value;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // 1. Gestion des accès sans token
    if (!token) {
        if (isPublicRoute) return NextResponse.next();
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    const payload = decodeJwt(token) as any;
    const { role, isHost } = payload;


    // --- LOGIQUE DE ROUTAGE PAR ESPACE ---

    if (pathname.startsWith('/admin')) {
        const canAccess = isHost && (role === 'SUPER_ADMIN' || role === 'MANAGER');
        if (!canAccess) return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/companies')) {
        const canAccess = (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER');

        if (!canAccess) return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/employes')) {
        // Optionnel : vérifier si l'utilisateur est bien actif
        return NextResponse.next();
    }

    // D. Sécurité supplémentaire : Empêcher un client d'accéder aux routes /companies
    // si celles-ci sont réservées à la gestion globale (Super Admin)
    const superAdminOnlyFolders = ["/companies", "/billing-global"];
    if (superAdminOnlyFolders.some(path => pathname.startsWith(path)) && !isHost) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};