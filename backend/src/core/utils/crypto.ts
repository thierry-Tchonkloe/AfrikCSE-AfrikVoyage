import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY manquante dans l'environnement");
    }
    const buf = Buffer.from(key, "hex");
    if (buf.length !== 32) {
        throw new Error("ENCRYPTION_KEY doit contenir 32 bytes (64 caractères hexadécimaux)");
    }
    return buf;
}

/** Chiffre un texte avec AES-256-GCM. Retourne `iv:authTag:ciphertext` encodé en hex. */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/** Déchiffre une valeur produite par `encrypt`. */
export function decrypt(payload: string): string {
    const [ivHex, authTagHex, ciphertextHex] = payload.split(":");
    if (!ivHex || !authTagHex || !ciphertextHex) {
        throw new Error("Format de donnée chiffrée invalide");
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, "hex")),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}
