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
    changePasswordSchema,
} from "./auth.validator";
import { logAudit } from "../../../core/utils/audit";

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
    // accessToken — durée alignée sur le JWT (24h), disponible sur toutes les routes.
    // Un maxAge trop court (ex: 15min) faisait expirer le cookie côté navigateur
    // avant le JWT lui-même, et le middleware Edge Runtime (qui lit ce cookie
    // directement, sans passer par l'intercepteur axios) redirigeait alors
    // silencieusement vers /login malgré un refreshToken encore valide.
    res.cookie("accessToken", accessToken, {
        ...COOKIE_BASE,
        maxAge: 24 * 60 * 60 * 1000,  // 1 jour
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

    // ── Login ─────────────────────────────────────────────────────────────
    // Gère les utilisateurs standard ET les utilisateurs partenaires.
    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        const result = await service.login(parsed.data);

        // ── Cas : utilisateur partenaire ──────────────────────────────────
        // Même mécanisme cookie HTTP-only que les users standards.
        // Plus de localStorage — le cookie accessToken fonctionne pour tous.
        if (result.type === "partner") {
            setAuthCookies(res, result.accessToken, result.refreshToken);
            return res.status(200).json({
                type: "partner",
                partnerUser: result.partnerUser,
            });
        }

        // ── Cas : utilisateur standard ────────────────────────────────────
        await logAudit({
            action: "USER_LOGIN",
            entity: "User",
            entityId: result.user.id,
            userId: result.user.id,
            organizationId: result.user.organizationId,
            req,
        });

        setAuthCookies(res, result.accessToken, result.refreshToken);

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

        return res.status(200).json({ type: "user", user: result.user, sessionToken });
        } catch (err: any) {
        return res.status(401).json({ message: err.message });
        }
    }

    // ── Logout ───────────────────────────────────────────────────────────
    // Révoque le refreshToken en BDD + supprime les deux cookies.
    async logout(req: Request, res: Response) {
        try {
        await service.logout(req.user!.userId);
        await logAudit({
            action: "USER_LOGOUT",
            entity: "User",
            entityId: req.user!.userId,
            userId: req.user!.userId,
            organizationId: req.user!.organizationId,
            req,
        });
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
    // Gère les deux types d'utilisateurs (User et PartnerUser) via le cookie
    // HTTP-only — le rôle dans le JWT détermine la table à interroger.
    async me(req: Request, res: Response): Promise<void> {
        try {
        const { role, userId } = req.user!;

        // ── Cas partenaire ───────────────────────────────────────────
        if (role === "PARTNER_ADMIN" || role === "PARTNER_STAFF") {
            const partnerUser = await prisma.partnerUser.findUnique({
                where: { id: userId },
                include: { partner: { select: { id: true, name: true, status: true } } },
            });
            if (!partnerUser || !partnerUser.isActive) {
                res.status(404).json({ message: "Partenaire introuvable" });
                return;
            }
            const partner = partnerUser.partner as { id: string; name: string; status: string };
            res.status(200).json({
                user: {
                    id:               partnerUser.id,
                    email:            partnerUser.email,
                    firstName:        partnerUser.firstName,
                    lastName:         partnerUser.lastName,
                    avatar:           null,
                    role:             partnerUser.role,
                    profileCompleted: true,
                    organizationId:   partnerUser.partnerId,
                    isPartner:        true,
                    partnerId:        partnerUser.partnerId,
                    partnerName:      partner.name,
                    organization: {
                        id:       partner.id,
                        name:     partner.name,
                        hasVoyage:true,
                        hasCSE:   false,
                        isHost:   false,
                        status:   partner.status,
                    },
                },
            });
            return;
        }

        // ── Cas utilisateur standard ─────────────────────────────────
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
            id:               true,
            email:            true,
            firstName:        true,
            lastName:         true,
            avatar:           true,
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
                logoUrl:        true,
                primaryColor:   true,
                secondaryColor: true,
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

    // ── Change password ──────────────────────────────────────────────────
    async changePassword(req: Request, res: Response) {
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        await service.changePassword(req.user!.userId, parsed.data);
        await logAudit({
            action: "USER_PASSWORD_CHANGED",
            entity: "User",
            entityId: req.user!.userId,
            userId: req.user!.userId,
            organizationId: req.user!.organizationId,
            req,
        });
        return res.status(200).json({ message: "Mot de passe modifié avec succès" });
        } catch (err: any) {
        return res.status(400).json({ message: err.message });
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