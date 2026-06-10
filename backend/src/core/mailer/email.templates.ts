const PRIMARY_COLOR = "#0f766e";

function appName(): string {
    return process.env.MAIL_FROM_NAME || "AfrikCSE & AfrikVoyage";
}

/** Échappe les caractères HTML pour éviter toute injection dans les emails */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function layout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
            <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                <td style="background:${PRIMARY_COLOR};padding:20px 24px;">
                    <h1 style="margin:0;color:#ffffff;font-size:18px;">${escapeHtml(appName())}</h1>
                </td>
                </tr>
                <tr>
                <td style="padding:24px;color:#1f2937;font-size:14px;line-height:1.6;">
                    <h2 style="margin-top:0;font-size:16px;color:#111827;">${title}</h2>
                    ${contentHtml}
                </td>
                </tr>
                <tr>
                <td style="padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:11px;text-align:center;">
                    © ${new Date().getFullYear()} ${escapeHtml(appName())} — Cet email est automatique, merci de ne pas y répondre.
                </td>
                </tr>
            </table>
            </td>
        </tr>
        </table>
    </body>
</html>`;
}

function button(label: string, url: string): string {
    return `<p style="text-align:center;margin:24px 0;">
        <a href="${url}" style="background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">${escapeHtml(label)}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>${url}</p>`;
}

export interface EmailContent {
    subject: string;
    html: string;
}

/** Email envoyé à l'admin d'une entreprise dès l'inscription */
export function companyRegistrationReceivedEmail(params: {
    firstName: string;
    companyName: string;
}): EmailContent {
    const firstName = escapeHtml(params.firstName);
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `Inscription reçue — ${companyName}`,
        html: layout("Inscription reçue", `
            <p>Bonjour ${firstName},</p>
            <p>Merci d'avoir inscrit <strong>${companyName}</strong> sur ${escapeHtml(appName())}.</p>
            <p>Votre demande est en cours d'examen par notre équipe. Vous recevrez un email dès que votre compte sera activé.</p>
        `),
    };
}

/** Email envoyé aux SUPER_ADMIN lors d'une nouvelle inscription en attente de validation */
export function newCompanyPendingValidationEmail(params: {
    companyName: string;
    adminName: string;
    adminEmail: string;
    plan: string;
    country?: string;
    reviewLink: string;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `Nouvelle inscription à valider — ${companyName}`,
        html: layout("Nouvelle organisation en attente", `
            <p>Une nouvelle entreprise s'est inscrite et attend une validation :</p>
            <ul>
                <li><strong>Entreprise :</strong> ${companyName}</li>
                <li><strong>Administrateur :</strong> ${escapeHtml(params.adminName)} (${escapeHtml(params.adminEmail)})</li>
                <li><strong>Plan demandé :</strong> ${escapeHtml(params.plan)}</li>
                ${params.country ? `<li><strong>Pays :</strong> ${escapeHtml(params.country)}</li>` : ""}
            </ul>
            ${button("Examiner la demande", params.reviewLink)}
        `),
    };
}

/** Email de réinitialisation de mot de passe */
export function passwordResetEmail(params: {
    firstName: string;
    resetLink: string;
}): EmailContent {
    return {
        subject: "Réinitialisation de votre mot de passe",
        html: layout("Réinitialisation du mot de passe", `
            <p>Bonjour ${escapeHtml(params.firstName)},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Ce lien est valable 1 heure.</p>
            ${button("Réinitialiser mon mot de passe", params.resetLink)}
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        `),
    };
}

/** Email envoyé à l'admin d'une organisation lorsqu'elle est validée */
export function organizationApprovedEmail(params: {
    companyName: string;
    adminFirstName: string;
    modules: string[];
    loginLink: string;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `${companyName} — Votre compte a été approuvé`,
        html: layout("Compte approuvé", `
            <p>Bonjour ${escapeHtml(params.adminFirstName)},</p>
            <p>Bonne nouvelle ! Le compte de <strong>${companyName}</strong> a été validé par notre équipe.</p>
            ${params.modules.length ? `<p>Modules activés : <strong>${params.modules.map(escapeHtml).join(", ")}</strong></p>` : ""}
            ${button("Se connecter", params.loginLink)}
        `),
    };
}

/** Email envoyé à l'admin d'une organisation lorsqu'elle est rejetée */
export function organizationRejectedEmail(params: {
    companyName: string;
    adminFirstName: string;
    reason?: string;
    supportEmail?: string;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `${companyName} — Votre demande n'a pas été retenue`,
        html: layout("Demande non retenue", `
            <p>Bonjour ${escapeHtml(params.adminFirstName)},</p>
            <p>Nous sommes désolés de vous informer que la demande d'inscription de <strong>${companyName}</strong> n'a pas été approuvée.</p>
            ${params.reason ? `<p><strong>Motif :</strong> ${escapeHtml(params.reason)}</p>` : ""}
            ${params.supportEmail ? `<p>Pour toute question, contactez-nous à <a href="mailto:${escapeHtml(params.supportEmail)}">${escapeHtml(params.supportEmail)}</a>.</p>` : ""}
        `),
    };
}

/** Email d'invitation envoyé à l'administrateur d'une organisation pour activer son compte */
export function organizationInvitationEmail(params: {
    companyName: string;
    adminFirstName: string;
    invitationLink: string;
    expiresInDays: number;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `${companyName} — Activez votre compte`,
        html: layout("Activez votre compte", `
            <p>Bonjour ${escapeHtml(params.adminFirstName)},</p>
            <p>Votre organisation <strong>${companyName}</strong> a été créée sur ${escapeHtml(appName())}.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre compte (lien valable ${params.expiresInDays} jours).</p>
            ${button("Activer mon compte", params.invitationLink)}
        `),
    };
}

/** Email de bienvenue, envoyé en complément de l'invitation lorsqu'une organisation est activée */
export function welcomeEmail(params: {
    companyName: string;
    adminFirstName: string;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `Bienvenue sur ${escapeHtml(appName())}, ${companyName} !`,
        html: layout("Bienvenue !", `
            <p>Bonjour ${escapeHtml(params.adminFirstName)},</p>
            <p>Bienvenue sur ${escapeHtml(appName())} ! Votre organisation <strong>${companyName}</strong> est maintenant active.</p>
            <p>Vous pouvez dès à présent inviter vos collaborateurs, configurer vos avantages CSE et gérer vos voyages professionnels.</p>
        `),
    };
}

/** Email d'invitation envoyé à un employé pour définir son mot de passe */
export function employeeInvitationEmail(params: {
    firstName: string;
    lastName: string;
    companyName: string;
    role: string;
    setPasswordLink: string;
    expiresInHours: number;
}): EmailContent {
    const companyName = escapeHtml(params.companyName);
    return {
        subject: `${companyName} — Votre compte a été créé`,
        html: layout("Bienvenue dans l'équipe", `
            <p>Bonjour ${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)},</p>
            <p>Un compte vous a été créé sur ${escapeHtml(appName())} par <strong>${companyName}</strong> (rôle : ${escapeHtml(params.role)}).</p>
            <p>Définissez votre mot de passe pour accéder à votre espace (lien valable ${params.expiresInHours}h).</p>
            ${button("Définir mon mot de passe", params.setPasswordLink)}
        `),
    };
}

/** Email de notification envoyé au support lors d'une nouvelle demande de contact */
export function contactNotificationEmail(params: {
    fullName: string;
    company: string;
    email: string;
    phone?: string;
    message: string;
}): EmailContent {
    return {
        subject: `Nouveau message de contact — ${escapeHtml(params.company)}`,
        html: layout("Nouveau message de contact", `
            <ul>
                <li><strong>Nom :</strong> ${escapeHtml(params.fullName)}</li>
                <li><strong>Entreprise :</strong> ${escapeHtml(params.company)}</li>
                <li><strong>Email :</strong> ${escapeHtml(params.email)}</li>
                ${params.phone ? `<li><strong>Téléphone :</strong> ${escapeHtml(params.phone)}</li>` : ""}
            </ul>
            <p><strong>Message :</strong></p>
            <p style="white-space:pre-wrap;">${escapeHtml(params.message)}</p>
        `),
    };
}
