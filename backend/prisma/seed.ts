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

    // Le seed ne doit s'exécuter qu'une seule fois : si des utilisateurs
    // existent déjà (cas de la production), on ne touche à rien.
    if (await prisma.user.count() > 0) {
        console.log("DB already seeded");
        return;
    }

    //await prisma.post.deleteMany()
    // await prisma.user.deleteMany()
    // await prisma.organization.deleteMany()
    // ── 1. Organisation Waxeho (le propriétaire de la plateforme) ──
    const waxeho = await prisma.organization.upsert({
        where: { slug: "waxeho" },
        update: {
            status: "ACTIVE",
        },
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

    // ── 2. Organisation de test et utilisateurs ─────────────────────
    const company = await prisma.organization.upsert({
        where: { slug: "afrikvoyage" },
        update: {},
        create: {
            name: "Afrik Voyage",
            slug: "afrikvoyage",
            status: "ACTIVE",
            plan: "BUSINESS",
            hasVoyage: true,
            hasCSE: true,
            email: "contact@afrikvoyage.com",
            businessEmail: "contact@afrikvoyage.com",
            country: "BJ",
        },
    });

    console.log(`✅ Organisation créée : ${company.name} (${company.id})`);

    // ── 3. Super Admin ──────────────────────────────────────────────
    const superAdminPassword = await bcrypt.hash("waxeho@2026!", 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: "superadmin@waxeho.com" },
        update: {
            isActive: true,
            organizationId: waxeho.id,
        },
        create: {
            email: "superadmin@waxeho.com",
            password: superAdminPassword,
            firstName: "Super",
            lastName: "Admin",
            role: "SUPER_ADMIN",
            isActive: true,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            profileCompleted: true,
            organizationId: waxeho.id,
        },
    });

    const superAdmin2Password = await bcrypt.hash("waxeho@2026!", 12);
    const superAdmin2 = await prisma.user.upsert({
        where: { email: "superadmin2@waxeho.com" },
        update: {
            isActive: true,
            organizationId: waxeho.id,
        },
        create: {
            email: "superadmin2@waxeho.com",
            password: superAdmin2Password,
            firstName: "Super",
            lastName: "Admin2",
            role: "SUPER_ADMIN",
            isActive: true,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            profileCompleted: true,
            organizationId: waxeho.id,
        },
    });

    console.log(`✅ Super Admin créés : ${superAdmin.email}, ${superAdmin2.email}`);

    // ── 4. Admin de l'entreprise ───────────────────────────────────
    const companyAdminPassword = await bcrypt.hash("afrikvoyage@2026!", 12);
    const companyAdmin = await prisma.user.upsert({
        where: { email: "admin@afrikvoyage.com" },
        update: {
            isActive: true,
            organizationId: company.id,
        },
        create: {
            email: "admin@afrikvoyage.com",
            password: companyAdminPassword,
            firstName: "Admin",
            lastName: "Entreprise",
            role: "ADMIN",
            isActive: true,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            profileCompleted: true,
            organizationId: company.id,
            jobTitle: "Administrateur",
            phone: "+22990000000",
        },
    });

    console.log(`✅ Admin entreprise créé : ${companyAdmin.email}`);

    // ── 5. Employé de l'entreprise ──────────────────────────────────
    const employeePassword = await bcrypt.hash("employe@2026!", 12);
    const employee = await prisma.user.upsert({
        where: { email: "employe@afrikvoyage.com" },
        update: {
            isActive: true,
            organizationId: company.id,
        },
        create: {
            email: "employe@afrikvoyage.com",
            password: employeePassword,
            firstName: "Employe",
            lastName: "Afrik",
            role: "EMPLOYE",
            isActive: true,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            profileCompleted: true,
            organizationId: company.id,
            jobTitle: "Consultant",
            phone: "+22990000001",
            employee: {
                create: {
                    matricule: "AFC-001",
                    organizationId: company.id,
                },
            },
        },
    });

    console.log(`✅ Employé créé : ${employee.email}`);

    console.log("\n🔐 Accès de seed :");
    console.log("  Super Admin: superadmin1@waxeho.com / waxeho@2026!");
    console.log("  Admin Entreprise: admin@afrikvoyage.com / afrikvoyage@2026!");
    console.log("  Employé: employe@afrikvoyage.com / employe@2026!");
    console.log("   ⚠️  Changez ces mots de passe après le premier login !");
}

main()
    .catch((e) => {
        console.error("❌ Erreur seed :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });