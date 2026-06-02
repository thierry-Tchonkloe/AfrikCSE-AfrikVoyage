// import { NextRequest, NextResponse } from "next/server";
// import { decodeJwt, jwtVerify } from "jose";

// const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/", "/infos", "/activate", "/unauthorized"];

// // ── Payload JWT ─────────────────────────────────────────
// interface TokenPayload {
//     userId:         string;
//     role:           string;
//     organizationId: string | null;
//     isHost:      boolean;
// }

// export function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     const isPublicRoute = PUBLIC_ROUTES.some(
//         (prefix) => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")
//     );

//     if (isPublicRoute) {
//         return NextResponse.next();
//     }

//     const token = request.cookies.get("accessToken")?.value;

//     // 1. Gestion des accès sans token
//     if (!token) {
//         if (isPublicRoute) return NextResponse.next();
//         const url = new URL("/login", request.url);
//         url.searchParams.set("redirect", pathname);
//         return NextResponse.redirect(url);
//     }

//     const payload = decodeJwt(token);
//     const { role, isHost } = payload;


//     // --- LOGIQUE DE ROUTAGE PAR ESPACE ---

//     if (pathname.startsWith('/admin')) {
//         const canAccess = isHost && (role === 'SUPER_ADMIN' || role === 'MANAGER');
//         if (!canAccess) return NextResponse.redirect(new URL('/unauthorized', request.url));
//     }

//     if (pathname.startsWith('/companies')) {
//         const canAccess = (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER');

//         if (!canAccess) return NextResponse.redirect(new URL('/unauthorized', request.url));
//     }

//     if (pathname.startsWith('/employes')) {
//         // Optionnel : vérifier si l'utilisateur est bien actif
//         return NextResponse.next();
//     }

//     // D. Sécurité supplémentaire : Empêcher un client d'accéder aux routes /companies
//     // si celles-ci sont réservées à la gestion globale (Super Admin)
//     const superAdminOnlyFolders = ["/companies", "/billing-global"];
//     if (superAdminOnlyFolders.some(path => pathname.startsWith(path)) && !isHost) {
//         return NextResponse.redirect(new URL('/unauthorized', request.url));
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };




import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Routes publiques ───────────────────────────────────────
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/activate",
  "/infos",
  "/",
  "/unauthorized",
];

// ── Types ──────────────────────────────────────────────────
interface TokenPayload {
  userId:         string;
  role:           string;
  organizationId: string | null;
  isHost:         boolean; // ← isHost (même nom que le backend)
}

// ── Vérification JWT ───────────────────────────────────────
async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ── Rôles ──────────────────────────────────────────────────
const SUPER_ADMIN_ROLES   = ["SUPER_ADMIN", "MANAGER"];
// ADMIN (pas ADMIN_ENTREPRISE) + les autres rôles company
const COMPANY_ADMIN_ROLES = ["ADMIN", "MANAGER", "RH", "FINANCE"];

// ── Route par défaut ───────────────────────────────────────
function getDefaultRoute(role: string, isHost: boolean): string {
  if (isHost && SUPER_ADMIN_ROLES.includes(role)) {
    return "/admin/dashboard";
  }
  if (COMPANY_ADMIN_ROLES.includes(role)) {
    return "/companies/dashboard";
  }
  if (role === "EMPLOYE") {
  return "/employes/dashboard";
  }
  return "/hub";
}

// ── Middleware ─────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Routes publiques → laisse passer
  const isPublicRoute = PUBLIC_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(prefix + "/") ||
      pathname.startsWith(prefix + "?")
  );

  if (isPublicRoute) return NextResponse.next();

  // 2. Token
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Vérifie le token
  const payload = await verifyToken(token);

  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("accessToken");
    return res;
  }

  const { role, isHost } = payload;

  // 4. "/" → redirige vers l'espace approprié
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(getDefaultRoute(role, isHost), request.url)
    );
  }

  // 5. /admin/* → isHost + rôle élevé
  if (pathname.startsWith("/admin")) {
    if (!isHost || !SUPER_ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(
        new URL(getDefaultRoute(role, isHost), request.url)
      );
    }
    return NextResponse.next();
  }

  // 6. /companies/* → admins/managers/rh/finance
  if (pathname.startsWith("/companies")) {
    if (!COMPANY_ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(
        new URL("/employes/dashboard", request.url)
      );
    }
    return NextResponse.next();
  }

  // 7. /employes/* → tout utilisateur connecté
  if (pathname.startsWith("/employes")) {
    return NextResponse.next();
  }

  // 8. Autres → laisse passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};