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






// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// // ─────────────────────────────────────────────
// // CONFIG
// // ─────────────────────────────────────────────

// const PUBLIC_PREFIXES = [
//     "/login",
//     "/register",
//     "/forgot-password",
//     "/reset-password",
//     "/activate",
//     "/infos",
//     "/",
//     "/unauthorized",
// ];

// // ⚠️ UNIFIER LES ROLES (IMPORTANT)
// const SUPER_ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER"];
// const COMPANY_ROLES = ["ADMIN", "MANAGER", "RH", "FINANCE"];

// // ─────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────

// interface TokenPayload {
//     userId: string;
//     role: string;
//     organizationId: string | null;
//     isHost: boolean; // ⚠️ UNIFIER avec ton login
// }

// // ─────────────────────────────────────────────
// // VERIFY TOKEN
// // ─────────────────────────────────────────────

// async function verifyToken(token: string): Promise<TokenPayload | null> {
//     try {
//         const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
//         const { payload } = await jwtVerify(token, secret);
//         return payload as unknown as TokenPayload;
//     } catch {
//         return null;
//     }
// }

// // ─────────────────────────────────────────────
// // ROUTE PAR DÉFAUT
// // ─────────────────────────────────────────────

// function getDefaultRoute(role: string, isHost: boolean): string {
//     if (isHost && SUPER_ADMIN_ROLES.includes(role)) {
//         return "/admin/dashboard";
//     }

//     if (COMPANY_ROLES.includes(role)) {
//         return "/companies/dashboard";
//     }

//     return "/employes/dashboard";
// }

// // ─────────────────────────────────────────────
// // MIDDLEWARE
// // ─────────────────────────────────────────────

// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     // 1. PUBLIC
//     const isPublic = PUBLIC_PREFIXES.some(
//         (prefix) =>
//         pathname === prefix ||
//         pathname.startsWith(prefix + "/") ||
//         pathname.startsWith(prefix + "?")
//     );

//     if (isPublic) return NextResponse.next();

//     // 2. TOKEN
//     const token = request.cookies.get("accessToken")?.value;

//     if (!token) {
//         const url = new URL("/login", request.url);
//         url.searchParams.set("redirect", pathname);
//         return NextResponse.redirect(url);
//     }

//     const payload = await verifyToken(token);

//     if (!payload) {
//         const res = NextResponse.redirect(new URL("/login", request.url));
//         res.cookies.delete("accessToken");
//         return res;
//     }

//     const { role, isHost } = payload;

//     // 3. ROOT → redirection intelligente
//     if (pathname === "/") {
//         return NextResponse.redirect(
//         new URL(getDefaultRoute(role, isHost), request.url)
//         );
//     }

//     // ─────────────────────────────
//     // ESPACE ADMIN
//     // ─────────────────────────────
//     if (pathname.startsWith("/admin")) {
//         const allowed = isHost && SUPER_ADMIN_ROLES.includes(role);

//         if (!allowed) {
//         return NextResponse.redirect(
//             new URL(getDefaultRoute(role, isHost), request.url)
//         );
//         }

//         return NextResponse.next();
//     }

//     // ─────────────────────────────
//     // ESPACE COMPANIES
//     // ─────────────────────────────
//     if (pathname.startsWith("/companies")) {
//         const allowed = COMPANY_ROLES.includes(role);

//         if (!allowed) {
//         return NextResponse.redirect(
//             new URL("/employes/dashboard", request.url)
//         );
//         }

//         return NextResponse.next();
//     }

//     // ─────────────────────────────
//     // ESPACE EMPLOYE
//     // ─────────────────────────────
//     if (pathname.startsWith("/employes")) {
//         return NextResponse.next();
//     }

//     return NextResponse.next();
// }

// // ─────────────────────────────────────────────
// // MATCHER
// // ─────────────────────────────────────────────

// export const config = {
//     matcher: [
//         "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
//     ],
// };





// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// // ── Routes publiques (préfixes) ────────────────────────────
// const PUBLIC_PREFIXES = [
//   "/login",
//   "/register",
//   "/forgot-password",
//   "/reset-password",
//   "/activate",
//   "/infos",
//   "/",
//   "/unauthorized",
//   // NE PAS mettre "/" ici — géré séparément
// ];

// // ── Types ──────────────────────────────────────────────────
// interface TokenPayload {
//   userId:         string;
//   role:           string;
//   organizationId: string | null;
//   isHost:      boolean;
// }

// // ── Vérification JWT (Edge Runtime) ───────────────────────
// async function verifyToken(token: string): Promise<TokenPayload | null> {
//   try {
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
//     const { payload } = await jwtVerify(token, secret);
//     return payload as unknown as TokenPayload;
//   } catch {
//     return null;
//   }
// }

// // ── Rôles par espace ───────────────────────────────────────
// const SUPER_ADMIN_ROLES   = ["SUPER_ADMIN", "MANAGER"];
// const COMPANY_ADMIN_ROLES = ["ADMIN", "MANAGER", "RH", "FINANCE"];

// // ── Route par défaut selon le profil ──────────────────────
// function getDefaultRoute(role: string, isHost: boolean): string {
//   if (isHost && SUPER_ADMIN_ROLES.includes(role)) {
//     return "/admin/dashboard";
//   }
//   if (COMPANY_ADMIN_ROLES.includes(role)) {
//     return "/companies/dashboard";
//   }
//   return "/employes/dashboard";
// }

// // ── Middleware ─────────────────────────────────────────────
// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // 1. Routes publiques → laisse passer
//   const isPublicRoute = PUBLIC_PREFIXES.some(
//     (prefix) =>
//       pathname === prefix ||
//       pathname.startsWith(prefix + "/") ||
//       pathname.startsWith(prefix + "?")
//   );

//   if (isPublicRoute) {
//     return NextResponse.next();
//   }

//   // 2. Récupère le token depuis le cookie
//   const token = request.cookies.get("accessToken")?.value;

//   if (!token) {
//     // Pas de token → login avec chemin de retour
//     const url = new URL("/login", request.url);
//     url.searchParams.set("redirect", pathname);
//     return NextResponse.redirect(url);
//   }

//   // 3. Vérifie la signature du token
//   const payload = await verifyToken(token);

//   if (!payload) {
//     // Token invalide/expiré → nettoie et redirige
//     const response = NextResponse.redirect(new URL("/login", request.url));
//     response.cookies.delete("accessToken");
//     return response;
//   }

//   const { role, isHost } = payload;

//   // 4. Route "/" → redirige vers l'espace approprié
//   if (pathname === "/") {
//     return NextResponse.redirect(
//       new URL(getDefaultRoute(role, isHost), request.url)
//     );
//   }

//   // 5. /admin/* → isHostOrg + rôle élevé uniquement
//   if (pathname.startsWith("/admin")) {
//     if (!isHost || !SUPER_ADMIN_ROLES.includes(role)) {
//       return NextResponse.redirect(
//         new URL(getDefaultRoute(role, isHost), request.url)
//       );
//     }
//     return NextResponse.next();
//   }

//   // 6. /companies/* → admins/managers/rh/finance de toute org
//   if (pathname.startsWith("/companies")) {
//     if (!COMPANY_ADMIN_ROLES.includes(role)) {
//       return NextResponse.redirect(
//         new URL("/employes/dashboard", request.url)
//       );
//     }
//     return NextResponse.next();
//   }

//   // 7. /employes/* → tout utilisateur connecté
//   if (pathname.startsWith("/employes")) {
//     return NextResponse.next();
//   }

//   // 8. Toute autre route protégée → laisse passer
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
//   ],
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
  return "/employes/dashboard";
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





// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";


// const PUBLIC_PREFIXES = [ "/login", "/register", "/forgot-password", "/reset-password", "/activate", "/", "/infos", "/unauthorized",];

// // ── Payload JWT ─────────────────────────────────────────
// interface TokenPayload {
//     userId:         string;
//     role:           string;
//     organizationId: string | null;
//     isHost:      boolean;
// }

// // ── Decode JWT (Edge Runtime compatible) ────────────────
// async function verifyToken(token: string): Promise<TokenPayload | null> {
//     try {
//         const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
//         const { payload } = await jwtVerify(token, secret);
//         return payload as unknown as TokenPayload;
//     } catch {
//         return null;
//     }
// }


// const SUPER_ADMIN_ROLES  = ["SUPER_ADMIN", "MANAGER"];
// const COMPANY_ADMIN_ROLES = ["ADMIN_ENTREPRISE", "MANAGER", "RH", "FINANCE"];

// function getDefaultRoute(role: string, isHost: boolean): string {
//     if (isHost && SUPER_ADMIN_ROLES.includes(role)) {
//         return "/admin/dashboard";
//     }
//     if (COMPANY_ADMIN_ROLES.includes(role)) {
//         return "/companies/dashboard";
//     }
//     return "/employes/dashboard";
// }

// // ── Middleware ───────────────────────────────────────────
// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     // 1. Route publique → laisse passer sans vérification
//     const isPublicRoute = PUBLIC_PREFIXES.some(
//         (prefix) => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")
//     );

//     if (isPublicRoute) {
//         return NextResponse.next();
//     }

//     // 2. Récupère et vérifie le token
//     const token = request.cookies.get("accessToken")?.value;

//     if (!token) {
//         const loginUrl = new URL("/login", request.url);
//         loginUrl.searchParams.set("redirect", pathname);
//         return NextResponse.redirect(loginUrl);
//     }

//     const payload = await verifyToken(token);

//     if (!payload) {
//         // Token expiré ou invalide → supprime cookie et redirige
//         const response = NextResponse.redirect(new URL("/login", request.url));
//         response.cookies.delete("accessToken");
//         return response;
//     }

//     const { role, isHost } = payload;

//     // 3. Route racine "/" → redirige vers l'espace approprié
//     if (pathname === "/") {
//         return NextResponse.redirect(
//         new URL(getDefaultRoute(role, isHost), request.url)
//         );
//     }

//     if (pathname.startsWith("/admin")) {
//         const canAccess = isHost && SUPER_ADMIN_ROLES.includes(role);

//         if (!canAccess) {
//             return NextResponse.redirect(
//                 new URL(getDefaultRoute(role, isHost), request.url)
//             );
//         }

//         return NextResponse.next();
//     }


//     if (pathname.startsWith("/companies")) {
//         const canAccess = COMPANY_ADMIN_ROLES.includes(role);

//         if (!canAccess) {
//         // Employé simple → espace employé
//         return NextResponse.redirect(
//             new URL("/employes/dashboard", request.url)
//         );
//         }

//         return NextResponse.next();
//     }


//     if (pathname.startsWith("/employes")) {
//         return NextResponse.next();
//     }

//     // 7. /hub et autres routes protégées → laisse passer
//     return NextResponse.next();
// }

// export const config = {
//     matcher: [
//         "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.ico).*)",
//     ],
// };




// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const PUBLIC_PREFIXES = [
//     "/login",
//     "/register",
//     "/forgot-password",
//     "/reset-password",
//     "/activate",
//     "/infos",
//     "/unauthorized",
// ];

// interface TokenPayload {
//     userId:         string;
//     role:           string;
//     organizationId: string | null;
//     isHost:      boolean;
// }

// async function verifyToken(token: string): Promise<TokenPayload | null> {
//     try {
//         const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
//         const { payload } = await jwtVerify(token, secret);
//         return payload as unknown as TokenPayload;
//     } catch (err) {
//         console.error("[MIDDLEWARE] Token verification failed:", err);
//         return null;
//     }
// }

// const SUPER_ADMIN_ROLES   = ["SUPER_ADMIN", "MANAGER"];
// const COMPANY_ADMIN_ROLES = ["ADMIN_ENTREPRISE", "MANAGER", "RH", "FINANCE"];

// function getDefaultRoute(role: string, isHost: boolean): string {
//     if (isHost && SUPER_ADMIN_ROLES.includes(role)) return "/admin/dashboard";
//     if (COMPANY_ADMIN_ROLES.includes(role)) return "/companies/dashboard";
//     return "/employes/dashboard";
// }

// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     // 1. Routes publiques → laisse passer
//     const isPublicRoute = PUBLIC_PREFIXES.some(
//         (prefix) =>
//         pathname === prefix ||
//         pathname.startsWith(prefix + "/") ||
//         pathname.startsWith(prefix + "?")
//     );

//     if (isPublicRoute) {
//         return NextResponse.next();
//     }

//     // 2. Récupère le token — décode l'URL encoding du cookie
//     const rawCookie = request.cookies.get("accessToken")?.value;
//     const token = rawCookie ? decodeURIComponent(rawCookie) : null;

//     // DEBUG temporaire — retirer après résolution
//     console.log("[MIDDLEWARE] path:", pathname);
//     console.log("[MIDDLEWARE] token présent:", !!token);
//     console.log("[MIDDLEWARE] token (50 premiers cars):", token?.slice(0, 50));

//     if (!token) {
//         // Pas de token → redirige vers login
//         const loginUrl = new URL("/login", request.url);
//         loginUrl.searchParams.set("redirect", pathname);
//         return NextResponse.redirect(loginUrl);
//     }

//     // 3. Vérifie le token
//     const payload = await verifyToken(token);

//     if (!payload) {
//         // Token invalide → nettoie et redirige
//         const response = NextResponse.redirect(new URL("/login", request.url));
//         response.cookies.delete("accessToken");
//         return response;
//     }

//     const { role, isHost } = payload;

//     // 4. Route "/" → redirige vers l'espace approprié
//     if (pathname === "/") {
//         return NextResponse.redirect(
//         new URL(getDefaultRoute(role, isHost), request.url)
//         );
//     }

//     // 5. /admin/* → uniquement isHost + rôle élevé
//     if (pathname.startsWith("/admin")) {
//         if (!isHost || !SUPER_ADMIN_ROLES.includes(role)) {
//         return NextResponse.redirect(
//             new URL(getDefaultRoute(role, isHost), request.url)
//         );
//         }
//         return NextResponse.next();
//     }

//     // 6. /companies/* → admins de toute org
//     if (pathname.startsWith("/companies")) {
//         if (!COMPANY_ADMIN_ROLES.includes(role)) {
//         return NextResponse.redirect(new URL("/employes/dashboard", request.url));
//         }
//         return NextResponse.next();
//     }

//     // 7. /employes/* → tout utilisateur connecté
//     if (pathname.startsWith("/employes")) {
//         return NextResponse.next();
//     }

//     // 8. Autres routes → laisse passer
//     return NextResponse.next();
// }

// export const config = {
//     matcher: [
//         "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.ico).*)",
//     ],
// };