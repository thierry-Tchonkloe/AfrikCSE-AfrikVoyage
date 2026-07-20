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
import {
    setUserAuthCookies, clearUserAuthCookies,
    setPartnerAuthCookies,
} from "../../../core/utils/auth-cookies";

const service = new AuthService();

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
    // Point d'entrée unique pour tous les rôles : `service.login` essaie `User`
    // puis délègue à `PartnerPortalService` si besoin. On pose ici la paire de
    // cookies correspondant au type retrouvé — jamais les deux à la fois, pour
    // que les deux systèmes de session restent totalement indépendants.
    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
        }
        try {
        const result = await service.login(parsed.data);

        if (result.type === "partner") {
            setPartnerAuthCookies(res, result.accessToken, result.refreshToken);
            return res.status(200).json({ type: "partner", partnerUser: result.user });
        }

        await logAudit({
            action: "USER_LOGIN",
            entity: "User",
            entityId: result.user.id,
            userId: result.user.id,
            organizationId: result.user.organizationId,
            req,
        });

        setUserAuthCookies(res, result.accessToken, result.refreshToken);

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
    // Révoque immédiatement access token ET refresh token (tokenVersion en BDD) + supprime les deux cookies.
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
        clearUserAuthCookies(res);
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
        setUserAuthCookies(res, result.accessToken, result.refreshToken ?? refreshToken);
        return res.status(200).json({ ok: true });
        } catch (err: any) {
        clearUserAuthCookies(res);   // refresh invalide → on nettoie tout
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
    // Utilisateurs standard uniquement — voir GET /api/partner-portal/me pour les partenaires.
    async me(req: Request, res: Response): Promise<void> {
        try {
        const { userId } = req.user!;

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