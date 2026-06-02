import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

// Connexion directe pour le seed (pas le singleton global)
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Démarrage du seed...");

    // ── 1. Organisation Waxeho (le propriétaire de la plateforme) ──
    const waxeho = await prisma.organization.upsert({
        where: { slug: "waxeho" },
        update: {},
        create: {
        name: "Waxeho",
        slug: "waxeho",
        status: "ACTIVE",       // Directement active, pas de validation requise
        plan: "ENTERPRISE",
        hasVoyage: true,
        email: "admin1@waxeho.com",
        hasCSE: true,
        isHost: true,
        country: "BJ",
        businessEmail: "admin@waxeho.com",
        },
    });

    console.log(`✅ Organisation créée : ${waxeho.name} (${waxeho.id})`);

    // ── 2. Super Admin ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash("waxeho@2026!", 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: "superadmin1@waxeho.com" },
        update: {
            isActive: true,
        },
            create: {
            email: "superadmin1@waxeho.com",
            password: hashedPassword,
            firstName: "Super",
            lastName: "Admin",
            role: "SUPER_ADMIN",
            isActive: true,
            emailVerified: true,
            profileCompleted: true,
            organizationId: waxeho.id,
        },
    });

    console.log(`✅ Super Admin créé : ${superAdmin.email}`);
    console.log(`   Mot de passe initial : waxeho@2026!`);
    console.log(`   ⚠️  Changez ce mot de passe après le premier login !`);
}

main()
    .catch((e) => {
        console.error("❌ Erreur seed :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });