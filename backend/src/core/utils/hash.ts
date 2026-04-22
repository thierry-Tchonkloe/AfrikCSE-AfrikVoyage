// import bcrypt from "bcrypt";

// export const hashPassword = async (password: string) => {
//     return bcrypt.hash(password, 10);
// };

// export const comparePassword = async (password: string, hashed: string) => {
//     return bcrypt.compare(password, hashed);
// };


import bcrypt from "bcrypt";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

/** Hash un mot de passe avec bcrypt */
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Vérifie un mot de passe contre son hash */
export async function comparePassword( plain: string, hashed: string ): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

/** Génère un token aléatoire sécurisé (reset password, etc.) */
export function generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/** Hash simple d'un token pour le stocker en base */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}