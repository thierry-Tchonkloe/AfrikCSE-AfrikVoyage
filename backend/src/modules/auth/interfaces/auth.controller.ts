// import { prisma } from "../../../core/config/prisma";
// import { Request, Response } from "express";
// import { AuthService } from "../application/auth.service";
// import {
//     registerCompanySchema,
//     loginSchema,
//     forgotPasswordSchema,
//     resetPasswordSchema,
//     completeProfileSchema,
// } from "./auth.validator";

// const service = new AuthService();

// export class AuthController {
//     async registerCompany(req: Request, res: Response) {
//         const parsed = registerCompanySchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(400).json({ errors: parsed.error.flatten() });
//         }

//         try {
//         const result = await service.registerCompany(parsed.data);
//             return res.status(201).json(result);
//         } catch (err: any) {
//             return res.status(400).json({ message: err.message });
//         }
//     }

//     async login(req: Request, res: Response) {
//         const parsed = loginSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(400).json({ errors: parsed.error.flatten() });
//         }

//         try {
//         const result = await service.login(parsed.data);
//             return res.status(200).json(result);
//         } catch (err: any) {
//             return res.status(401).json({ message: err.message });
//         }
//     }

//     async logout(req: Request, res: Response) {
//         try {
//         await service.logout(req.user!.userId);
//             return res.status(200).json({ message: "Déconnecté avec succès" });
//         } catch (err: any) {
//             return res.status(500).json({ message: err.message });
//         }
//     }

//     async refresh(req: Request, res: Response) {
//         const { refreshToken } = req.body;
//         if (!refreshToken) {
//             return res.status(400).json({ message: "Refresh token requis" });
//         }

//         try {
//         const result = await service.refresh(refreshToken);
//             return res.status(200).json(result);
//         } catch (err: any) {
//             return res.status(401).json({ message: err.message });
//         }
//     }

//     async forgotPassword(req: Request, res: Response) {
//         const parsed = forgotPasswordSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(400).json({ errors: parsed.error.flatten() });
//         }

//     await service.forgotPassword(parsed.data);
//         // Toujours 200 pour ne pas révéler l'existence de l'email
//         return res.status(200).json({
//             message: "Si cet email est enregistré, un lien vous a été envoyé.",
//         });
//     }

//     async resetPassword(req: Request, res: Response) {
//         const parsed = resetPasswordSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(400).json({ errors: parsed.error.flatten() });
//         }

//         try {
//         await service.resetPassword(parsed.data);
//             return res.status(200).json({ message: "Mot de passe réinitialisé" });
//         } catch (err: any) {
//             return res.status(400).json({ message: err.message });
//         }
//     }

//     // async me(req: Request, res: Response) {
//     //     return res.status(200).json({ user: req.user });
//     // }

//     async me(req: Request, res: Response): Promise<void> {
//         try {
//             const user = await prisma.user.findUnique({
//                 where: { id: req.user!.userId },
//                 select: {
//                     id: true,
//                     email: true,
//                     firstName: true,
//                     lastName: true,
//                     role: true,
//                     profileCompleted: true,
//                     organizationId: true,
//                     organization: {
//                     select: {
//                         id: true,
//                         name: true,
//                         hasVoyage: true,
//                         hasCSE: true,
//                         isHost: true,
//                         status: true,
//                     },
//                     },
//                 },
//             });

//             if (!user) {
//                 res.status(404).json({ message: "Utilisateur introuvable" });
//                 return;
//             }

//             res.status(200).json({ user });
//         } catch (err: any) {
//             res.status(500).json({ message: err.message });
//         }
//     }

//     async completeProfile(req: Request, res: Response) {
//         const parsed = completeProfileSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(400).json({ errors: parsed.error.flatten() });
//         }

//         try {
//         await service.completeProfile(req.user!.userId, parsed.data);
//             return res.status(200).json({ message: "Profil complété" });
//         } catch (err: any) {
//             return res.status(500).json({ message: err.message });
//         }
//     }

//     async activateAccount(req: Request, res: Response): Promise<void> {
//         const { token, password } = req.body;
//         if (!token || !password) {
//             res.status(400).json({ message: "Token et mot de passe requis" });
//             return;
//         }
//         try {
//             await service.resetPassword({ token, password });
//             res.json({ message: "Compte activé avec succès. Vous pouvez maintenant vous connecter." });
//         } catch (err: any) {
//             res.status(400).json({ message: err.message });
//         }
//     }
// }







import { prisma } from "../../../core/config/prisma";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthService } from "../application/auth.service";
import {
    registerCompanySchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    completeProfileSchema,
} from "./auth.validator";

const service = new AuthService();

// ── Helpers cookies ────────────────────────────────────────────────────────────
// On centralise la config pour ne pas la dupliquer dans chaque méthode.
const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_BASE = {
    httpOnly: true,                                   // inaccessible depuis JS côté client
    secure:   IS_PROD,                                 // HTTPS uniquement en prod
    sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
    partitioned: IS_PROD,
    path:   "/",
} as const;

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // accessToken — durée courte (15min), disponible sur toutes les routes
    res.cookie("accessToken", accessToken, {
        ...COOKIE_BASE,
        maxAge: 15 * 60 * 1000,  // 15 minutes
    });

    // refreshToken — durée longue (7j), accessible partout pour le refresh workflow
    res.cookie("refreshToken", refreshToken, {
        ...COOKIE_BASE,
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
    });
}

function clearAuthCookies(res: Response) {
    res.clearCookie("accessToken", {
        ...COOKIE_BASE,
    });
    res.clearCookie("refreshToken", {
        ...COOKIE_BASE,
    });
}

// ──────────────────────────── Controller ─────────────────────────────────────────────────────────────────
export class AuthController {

    // ── Register ────────────────────────────────────────────────────────
    async registerCompany(req: Request, res: Response) {
        const parsed = registerCompanySchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        const result = await service.registerCompany(parsed.data);
        return res.status(201).json(result);
        } catch (err: any) {
        return res.status(400).json({ message: err.message });
        }
    }

    // ── Login ────────────────────────────────────────────────────────────
    // Pose accessToken + refreshToken en cookies HTTP-only.
    // Ne renvoie plus les tokens dans le body JSON.
    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        const result = await service.login(parsed.data);

        // Pose les cookies HTTP-only (access + refresh) côté API
        setAuthCookies(res, result.accessToken, result.refreshToken);

        // Génère un petit token signé, court (1 minute), destiné uniquement
        // à être placé en cookie lisible par le frontend (middleware Edge)
        // NOTE: Ce token n'est PAS utilisé pour authentifier les appels API.
        const sessionSecret = process.env.SESSION_COOKIE_SECRET || process.env.JWT_SECRET;
        const sessionToken = jwt.sign(
            {
            userId: result.user.id,
            role: result.user.role,
            organizationId: result.user.organizationId,
            isHost: result.user.organization?.isHost ?? false,
            },
            sessionSecret as jwt.Secret,
            { expiresIn: "60s" }
        );

        // Retourne uniquement l'objet user + ce sessionToken court pour que
        // le frontend puisse poser un cookie lisible par le middleware Edge.
        return res.status(200).json({ user: result.user, sessionToken });
        } catch (err: any) {
        return res.status(401).json({ message: err.message });
        }
    }

    // ── Logout ───────────────────────────────────────────────────────────
    // Révoque le refreshToken en BDD + supprime les deux cookies.
    async logout(req: Request, res: Response) {
        try {
        await service.logout(req.user!.userId);
        clearAuthCookies(res);
        return res.status(200).json({ message: "Déconnecté avec succès" });
        } catch (err: any) {
        return res.status(500).json({ message: err.message });
        }
    }

    // ── Refresh ──────────────────────────────────────────────────────────
    // Lit le refreshToken depuis le cookie HTTP-only (plus depuis req.body).
    // Pose un nouveau accessToken en cookie.
    async refresh(req: Request, res: Response) {
        const refreshToken = req.cookies?.refreshToken;   // ← cookie, pas body

        if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token requis" });
        }
        try {
        const result = await service.refresh(refreshToken);
        // Repose un nouveau accessToken (et refreshToken si rotation activée)
        setAuthCookies(res, result.accessToken, result.refreshToken ?? refreshToken);
        return res.status(200).json({ ok: true });
        } catch (err: any) {
        clearAuthCookies(res);   // refresh invalide → on nettoie tout
        return res.status(401).json({ message: err.message });
        }
    }

    // ── Forgot password ──────────────────────────────────────────────────
    async forgotPassword(req: Request, res: Response) {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        await service.forgotPassword(parsed.data);
        return res.status(200).json({
        message: "Si cet email est enregistré, un lien vous a été envoyé.",
        });
    }

    // ── Reset password ───────────────────────────────────────────────────
    async resetPassword(req: Request, res: Response) {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        await service.resetPassword(parsed.data);
        return res.status(200).json({ message: "Mot de passe réinitialisé" });
        } catch (err: any) {
        return res.status(400).json({ message: err.message });
        }
    }

    // ── Me ───────────────────────────────────────────────────────────────
    // Inchangé — req.user est peuplé par le middleware d'auth qui lit
    // le cookie accessToken HTTP-only et vérifie le JWT.
    async me(req: Request, res: Response): Promise<void> {
        try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
            id:               true,
            email:            true,
            firstName:        true,
            lastName:         true,
            role:             true,
            profileCompleted: true,
            organizationId:   true,
            organization: {
                select: {
                id:       true,
                name:     true,
                hasVoyage:true,
                hasCSE:   true,
                isHost:   true,
                status:   true,
                },
            },
            },
        });
        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }
        res.status(200).json({ user });
        } catch (err: any) {
        res.status(500).json({ message: err.message });
        }
    }

    // ── Complete profile ─────────────────────────────────────────────────
    async completeProfile(req: Request, res: Response) {
        const parsed = completeProfileSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        await service.completeProfile(req.user!.userId, parsed.data);
        return res.status(200).json({ message: "Profil complété" });
        } catch (err: any) {
        return res.status(500).json({ message: err.message });
        }
    }

    // ── Activate account ─────────────────────────────────────────────────
    async activateAccount(req: Request, res: Response): Promise<void> {
        const { token, password } = req.body;
        if (!token || !password) {
        res.status(400).json({ message: "Token et mot de passe requis" });
        return;
        }
        try {
        await service.resetPassword({ token, password });
        res.json({ message: "Compte activé avec succès. Vous pouvez maintenant vous connecter." });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}