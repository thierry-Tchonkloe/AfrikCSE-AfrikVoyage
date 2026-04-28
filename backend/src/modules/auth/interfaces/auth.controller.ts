// import { Request, Response } from "express";
// import { AuthService } from "../application/auth.service";
// import { AuthRepository } from "../infrastructure/auth.repository";

// const service = new AuthService(new AuthRepository());

// export const register = async (req: Request, res: Response) => {
//     try {
//         const user = await service.register(req.body);
//         res.status(201).json(user);
//     } catch (err: any) {
//         res.status(400).json({ message: err.message });
//     }
// };

// export const login = async (req: Request, res: Response) => {
//     try {
//         const tokens = await service.login(
//         req.body.email,
//         req.body.password
//         );
//         res.json(tokens);
//     } catch (err: any) {
//         res.status(401).json({ message: err.message });
//     }
// };



import { prisma } from "../../../core/config/prisma";
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

export class AuthController {
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

    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }

        try {
        const result = await service.login(parsed.data);
            return res.status(200).json(result);
        } catch (err: any) {
            return res.status(401).json({ message: err.message });
        }
    }

    async logout(req: Request, res: Response) {
        try {
        await service.logout(req.user!.userId);
            return res.status(200).json({ message: "Déconnecté avec succès" });
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }

    async refresh(req: Request, res: Response) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token requis" });
        }

        try {
        const result = await service.refresh(refreshToken);
            return res.status(200).json(result);
        } catch (err: any) {
            return res.status(401).json({ message: err.message });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }

    await service.forgotPassword(parsed.data);
        // Toujours 200 pour ne pas révéler l'existence de l'email
        return res.status(200).json({
            message: "Si cet email est enregistré, un lien vous a été envoyé.",
        });
    }

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

    // async me(req: Request, res: Response) {
    //     return res.status(200).json({ user: req.user });
    // }

    async me(req: Request, res: Response): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    profileCompleted: true,
                    organizationId: true,
                    organization: {
                    select: {
                        id: true,
                        name: true,
                        hasVoyage: true,
                        hasCSE: true,
                        status: true,
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