// import { AuthRepository } from "../infrastructure/auth.repository";
// import { hashPassword, comparePassword } from "@/core/utils/hash";
// import {generateAccessToken, generateRefreshToken,} from "@/core/utils/jwt";

// export class AuthService {
//     constructor(private repo: AuthRepository) {}

//     async register(data: any) {
//         const existing = await this.repo.findByEmail(data.email);

//         if (existing) {
//         throw new Error("User already exists");
//         }

//         const hashed = await hashPassword(data.password);

//         const user = await this.repo.createUser({
//         ...data,
//         password: hashed,
//         });

//         return user;
//     }

//     async login(email: string, password: string) {
//         const user = await this.repo.findByEmail(email);

//         if (!user) throw new Error("Invalid credentials");

//         const isMatch = await comparePassword(password, user.password);

//         if (!isMatch) throw new Error("Invalid credentials");

//         const payload = {
//         userId: user.id,
//         role: user.role,
//         orgId: user.organizationId,
//         };

//         const accessToken = generateAccessToken(payload);
//         const refreshToken = generateRefreshToken(payload);

//         await this.repo.saveRefreshToken(user.id, refreshToken);

//         return { accessToken, refreshToken };
//     }
// }




import { AuthRepository } from "../infrastructure/auth.repository";
import { hashPassword, comparePassword, generateSecureToken, hashToken, } from "../../../core/utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload } from "../../../core/utils/jwt";
import { RegisterCompanyDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, CompleteProfileDto, } from "../interfaces/auth.validator";

export class AuthService {
    private repo = new AuthRepository();

    /**
     * Onboarding entreprise
     * Crée l'organisation (PENDING) + l'admin en une transaction
     */
    async registerCompany(dto: RegisterCompanyDto) {
        // Vérifie que l'email admin n'existe pas déjà
        const existing = await this.repo.findUserByEmail(dto.email);
        if (existing) {
        throw new Error("Cet email est déjà utilisé");
        }

        // Génère un slug unique à partir du nom de l'entreprise
        const slug = dto.companyName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

        const hashedPassword = await hashPassword(dto.adminPassword);

        const { org } = await this.repo.createOrganizationWithAdmin({
        org: {
            name: dto.companyName,
            slug,
            plan: dto.plan,
            status: "PENDING",
            businessEmail: dto.businessEmail,
            country: dto.country,
            phone: dto.phone,
            size: dto.size,
            industry: dto.industry,
            address: dto.address,
            city: dto.city,
            region: dto.region,
            postalCode: dto.postalCode,
            email: dto.email,
            // Les modules sont demandés mais pas encore activés
            hasVoyage: false,
            hasCSE: false,
        },
        admin: {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
        },
        });

        // TODO: Envoyer email de confirmation au Super Admin
        // TODO: Envoyer email "demande reçue" à l'admin de l'entreprise

        return {
        message:
            "Compte créé avec succès. En attente de validation par l'administrateur.",
        organizationId: org.id,
        };
    }

    /**
     * Connexion
     * Vérifie email/password, statut org, retourne les tokens
    */
    async login(dto: LoginDto) {
        const user = await this.repo.findUserByEmail(dto.email);

        // Message générique pour ne pas indiquer si l'email existe
        if (!user) {
        throw new Error("Email ou mot de passe incorrect");
        }

        const passwordOk = await comparePassword(dto.password, user.password);
        if (!passwordOk) {
        throw new Error("Email ou mot de passe incorrect");
        }

        if (!user.isActive) {
        throw new Error("Ce compte a été désactivé. Contactez votre administrateur.");
        }

        // Vérifie le statut de l'organisation (sauf Super Admin)
        if (user.organization) {
        if (user.organization.status === "PENDING") {
            throw new Error(
            "Votre organisation est en attente de validation. Vous serez notifié par email."
            );
        }
        if (user.organization.status === "SUSPENDED") {
            throw new Error(
            "Votre organisation est suspendue. Contactez le support."
            );
        }
        if (user.organization.status === "REJECTED") {
            throw new Error(
            "La demande de votre organisation a été refusée. Contactez le support."
            );
        }
        }

        const payload: JwtPayload = {
            userId: user.id,
            role: user.role,
            organizationId: user.organizationId,
            isHost:      user.organization?.isHost ?? false,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Stocke le refresh token hashé en base
        await this.repo.updateRefreshToken(user.id, hashToken(refreshToken));
        await this.repo.updateLastLogin(user.id);

        return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profileCompleted: user.profileCompleted,
            organizationId: user.organizationId,
            organization: user.organization
            ? {
                id: user.organization.id,
                name: user.organization.name,
                hasVoyage: user.organization.hasVoyage,
                hasCSE: user.organization.hasCSE,
                isHost: user.organization.isHost,
                }
            : null,
        },
        };
    }

    /** Déconnexion : invalide le refresh token en base */
    async logout(userId: string) {
        await this.repo.updateRefreshToken(userId, null);
    }

    /**
     * Renouvelle l'access token via le refresh token
     * Double vérification : signature JWT + présence en base
     */
    async refresh(refreshToken: string) {
        let payload;
        try {
        payload = verifyRefreshToken(refreshToken);
        } catch {
        throw new Error("Refresh token invalide");
        }

        const user = await this.repo.findUserById(payload.userId);
        if (!user || !user.refreshToken) {
        throw new Error("Session expirée, veuillez vous reconnecter");
        }

        // Vérifie que le token en base correspond
        if (user.refreshToken !== hashToken(refreshToken)) {
        throw new Error("Refresh token invalide");
        }

        const newAccessToken = signAccessToken({
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        isHost:      user.organization?.isHost ?? false,
        });

        const newRefreshToken = signRefreshToken(
            {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        isHost:      user.organization?.isHost ?? false,
        }
        );

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /** Envoie un email de reset password */
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.repo.findUserByEmail(dto.email);

        // Toujours répondre "si l'email existe, un lien a été envoyé"
        // pour ne pas révéler quels emails sont enregistrés
        if (!user) return;

        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        await this.repo.saveResetToken(user.id, hashToken(token), expiresAt);

        // TODO: Envoyer l'email avec le lien :
        // ${process.env.FRONTEND_URL}/auth/reset-password?token=${token}
        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV] Reset token : ${token}`);
        }
    }

    /** Réinitialise le mot de passe */
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.repo.findUserByResetToken(hashToken(dto.token));

        if (!user) {
        throw new Error("Lien invalide ou expiré");
        }

        const hashedPassword = await hashPassword(dto.password);
        await this.repo.resetPassword(user.id, hashedPassword);

        // Invalide aussi le refresh token (déconnecte toutes les sessions)
        await this.repo.updateRefreshToken(user.id, null);
    }

    /** Complétion du profil au premier login */
    async completeProfile(userId: string, dto: CompleteProfileDto) {
        return this.repo.completeProfile(userId, dto);
    }
}