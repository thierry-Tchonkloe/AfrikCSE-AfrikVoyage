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
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload, REFRESH_TOKEN_TTL_MS } from "../../../core/utils/jwt";
import { RegisterCompanyDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, CompleteProfileDto, ChangePasswordDto, } from "../interfaces/auth.validator";
import { sendMail } from "../../../core/services/email.service";
import { companyRegistrationReceivedEmail, newCompanyPendingValidationEmail, passwordResetEmail, } from "../../../core/mailer/email.templates";
import { logger } from "../../../core/utils/logger";
import { PartnerPortalService } from "../../partner-portal/application/partner-portal.service";

export class AuthService {
    private repo = new AuthRepository();
    private partnerPortalService = new PartnerPortalService();

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

        // Backstop DB (User.email / Organization.email / Organization.slug sont
        // @unique) : si deux soumissions concurrentes passent toutes deux le check
        // ci-dessus, une seule transaction réussit — l'autre lève P2002 ici plutôt
        // que de créer un doublon, et AVANT tout envoi d'email (les emails ne sont
        // envoyés qu'après ce bloc).
        let org: Awaited<ReturnType<typeof this.repo.createOrganizationWithAdmin>>["org"];
        try {
        ({ org } = await this.repo.createOrganizationWithAdmin({
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
        }));
        } catch (err: any) {
        if (err?.code === "P2002") throw new Error("Cet email est déjà utilisé");
        throw err;
        }

        // Email "demande reçue" à l'admin de l'entreprise
        const received = companyRegistrationReceivedEmail({
            firstName: dto.adminFirstName,
            companyName: dto.companyName,
        });
        await sendMail({ to: dto.email, subject: received.subject, html: received.html });

        // Email de notification aux SUPER_ADMIN (BDD + adresse(s) configurée(s) en .env)
        const extraEmails = (process.env.SUPER_ADMIN_NOTIFICATION_EMAIL || "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
        const superAdminEmails = [...new Set([...(await this.repo.findSuperAdminEmails()), ...extraEmails])];

        if (superAdminEmails.length > 0) {
            const pending = newCompanyPendingValidationEmail({
                companyName: dto.companyName,
                adminName: `${dto.adminFirstName} ${dto.adminLastName}`,
                adminEmail: dto.email,
                plan: dto.plan,
                country: dto.country,
                reviewLink: `${process.env.FRONTEND_URL}/admin/validations`,
            });
            await sendMail({ to: superAdminEmails, subject: pending.subject, html: pending.html });
        }

        return {
        message:
            "Compte créé avec succès. En attente de validation par l'administrateur.",
        organizationId: org.id,
        };
    }

    /**
     * Connexion unifiée : essaie d'abord `User`, puis délègue à `PartnerPortalService`
     * si l'email n'existe pas côté User (réutilise sa logique de vérification/
     * signature — pas de duplication). Chaque branche retourne un `type` que le
     * contrôleur utilise pour poser la bonne paire de cookies (les deux systèmes
     * de session restent totalement séparés, seul le point d'entrée est commun).
     */
    async login(dto: LoginDto, meta: { userAgent?: string | null; ipAddress?: string | null } = {}) {
        const user = await this.repo.findUserByEmail(dto.email);

        if (!user) {
        try {
            const partnerResult = await this.partnerPortalService.login(dto.email, dto.password);
            return { type: "partner" as const, ...partnerResult };
        } catch {
            // Même message générique qu'un email User inconnu — pas d'énumération de compte
            throw new Error("Email ou mot de passe incorrect");
        }
        }

        const passwordOk = await comparePassword(dto.password, user.password);
        if (!passwordOk) throw new Error("Email ou mot de passe incorrect");

        if (!user.isActive) throw new Error("Ce compte a été désactivé. Contactez votre administrateur.");

        if (user.organization) {
            if (user.organization.status === "PENDING")
                throw new Error("Votre organisation est en attente de validation.");
            if (user.organization.status === "SUSPENDED")
                throw new Error("Votre organisation est suspendue. Contactez le support.");
            if (user.organization.status === "REJECTED")
                throw new Error("La demande de votre organisation a été refusée.");
        }

        const payload: JwtPayload = {
            userId: user.id,
            role: user.role,
            organizationId: user.organizationId,
            isHost: user.organization?.isHost ?? false,
            tokenVersion: user.tokenVersion,
        };
        const accessToken  = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Crée une NOUVELLE session (une ligne par appareil) au lieu d'écraser
        // l'unique refresh token stocké — permet plusieurs sessions actives
        // simultanées (ex : téléphone + ordinateur) sans se déconnecter mutuellement.
        await this.repo.createSession({
            userId: user.id,
            refreshTokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
            userAgent: meta.userAgent,
            ipAddress: meta.ipAddress,
        });
        await this.repo.updateLastLogin(user.id);

        return {
            type: "user" as const,
            accessToken,
            refreshToken,
            user: {
                id: user.id, email: user.email,
                firstName: user.firstName, lastName: user.lastName,
                role: user.role, profileCompleted: user.profileCompleted,
                organizationId: user.organizationId,
                organization: user.organization
                    ? {
                        id: user.organization.id, name: user.organization.name,
                        hasVoyage: user.organization.hasVoyage, hasCSE: user.organization.hasCSE,
                        isHost: user.organization.isHost,
                      }
                    : null,
            },
        };
    }

    /**
     * Déconnexion ciblée : supprime UNIQUEMENT la session de l'appareil courant
     * (identifiée par le refresh token présenté), sans toucher aux autres
     * sessions actives du même utilisateur (téléphone, autre navigateur…).
     * Si aucun refresh token n'est présenté (cookie déjà absent), il n'y a
     * rien à révoquer côté base — les cookies sont de toute façon effacés par
     * le contrôleur.
     */
    async logout(userId: string, refreshToken?: string) {
        if (!refreshToken) return;
        await this.repo.deleteSessionByHash(userId, hashToken(refreshToken));
    }

    /** Renouvelle l'access token via le refresh token (double vérification signature + hash en base) */
    async refresh(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new Error("Refresh token invalide");
        }

        // Retrouve la session exacte correspondant à CE refresh token — jamais
        // une simple colonne unique sur User, pour ne cibler que cet appareil.
        const session = await this.repo.findSessionByHash(hashToken(refreshToken));
        if (!session || session.userId !== payload.userId || session.expiresAt < new Date()) {
            throw new Error("Session expirée, veuillez vous reconnecter");
        }

        const user = await this.repo.findUserById(payload.userId);
        if (!user) {
            throw new Error("Session expirée, veuillez vous reconnecter");
        }

        const refreshedPayload: JwtPayload = {
            userId:         user.id,
            role:           user.role,
            organizationId: user.organizationId,
            isHost:         user.organization?.isHost ?? false,
            tokenVersion:   user.tokenVersion,
        };
        const newAccessToken  = signAccessToken(refreshedPayload);
        const newRefreshToken = signRefreshToken(refreshedPayload);

        // Rotation ciblée : seule CETTE session (cette ligne, cet appareil) est
        // mise à jour avec le nouveau hash — les autres sessions actives du
        // même utilisateur ne sont ni lues ni modifiées.
        await this.repo.rotateSession(
            session.id,
            hashToken(newRefreshToken),
            new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        );

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /**
     * Liste les sessions actives (appareils connectés) de l'utilisateur.
     * `currentRefreshToken` (cookie de la requête en cours) permet de signaler
     * quelle ligne correspond à l'appareil depuis lequel l'utilisateur consulte
     * la liste, pour que le frontend puisse l'afficher distinctement et empêcher
     * sa révocation directe (bouton désactivé côté UI).
     */
    async listSessions(userId: string, currentRefreshToken?: string) {
        const [sessions, currentSession] = await Promise.all([
            this.repo.listSessions(userId),
            currentRefreshToken ? this.repo.findSessionByHash(hashToken(currentRefreshToken)) : null,
        ]);

        return sessions.map((session) => ({
            ...session,
            isCurrent: currentSession?.id === session.id,
        }));
    }

    /**
     * Révoque une session précise (un appareil) — l'utilisateur ne peut révoquer
     * que ses propres sessions (vérifié via findSessionByIdForUser).
     */
    async revokeSession(userId: string, sessionId: string) {
        const session = await this.repo.findSessionByIdForUser(userId, sessionId);
        if (!session) throw new Error("Session introuvable");
        await this.repo.deleteSessionById(userId, sessionId);
    }

    /**
     * Déconnexion de tous les autres appareils : supprime toutes les sessions
     * du user SAUF celle en cours (identifiée par le cookie refreshToken de la
     * requête), pour que l'utilisateur reste connecté sur l'appareil courant.
     */
    async revokeOtherSessions(userId: string, currentRefreshToken?: string) {
        if (!currentRefreshToken) throw new Error("Session courante introuvable");

        const currentSession = await this.repo.findSessionByHash(hashToken(currentRefreshToken));
        if (!currentSession || currentSession.userId !== userId) {
            throw new Error("Session courante introuvable");
        }

        await this.repo.deleteOtherSessions(userId, currentSession.id);
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

        // Réutilise la page /activate (gère déjà la définition d'un nouveau mot de passe via token)
        const resetLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;
        const { subject, html } = passwordResetEmail({ firstName: user.firstName, resetLink });
        await sendMail({ to: user.email, subject, html });

        if (process.env.NODE_ENV !== "production") {
            logger.debug(`Reset token : ${token}`);
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

        // Révoque TOUTES les sessions actives, sur TOUS les appareils (access ET
        // refresh tokens) — contrairement au logout ciblé, un reset password est
        // un événement de sécurité global : l'utilisateur n'étant pas connecté
        // pendant ce flow (lien reçu par email), aucune session en cours ne
        // dépend de rester valide, contrairement à changePassword().
        await this.repo.revokeAllSessions(user.id);
    }

    /** Complétion du profil au premier login */
    async completeProfile(userId: string, dto: CompleteProfileDto) {
        return this.repo.completeProfile(userId, dto);
    }

    /** Changement de mot de passe (utilisateur connecté) */
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.repo.findUserById(userId);
        if (!user) {
        throw new Error("Utilisateur introuvable");
        }

        const passwordOk = await comparePassword(dto.currentPassword, user.password);
        if (!passwordOk) {
        throw new Error("Mot de passe actuel incorrect");
        }

        const hashedPassword = await hashPassword(dto.newPassword);
        await this.repo.updatePassword(userId, hashedPassword);
    }
}