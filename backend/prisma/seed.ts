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

    // ── Section 1 : Utilisateurs système (guarded) ─────────────────────────────
    // Ne crée les orgs + users que si la table est vide.
    // Les re-runs sur une DB existante ne touchent à rien ici.
    if (await prisma.user.count() === 0) {
        // ── 1. Organisation Waxeho (propriétaire de la plateforme) ──
        const waxeho = await prisma.organization.upsert({
            where: { slug: "waxeho" },
            update: { status: "ACTIVE" },
            create: {
                name: "Waxeho",
                slug: "waxeho",
                status: "ACTIVE",
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

        // ── 2. Organisation de test ──────────────────────────────────
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

        // ── 3. Super Admin ───────────────────────────────────────────
        const superAdminPassword = await bcrypt.hash("waxeho@2026!", 12);
        const superAdmin = await prisma.user.upsert({
            where: { email: "superadmin@waxeho.com" },
            update: { isActive: true, organizationId: waxeho.id },
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
            update: { isActive: true, organizationId: waxeho.id },
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

        // ── 4. Admin de l'entreprise ─────────────────────────────────
        const companyAdminPassword = await bcrypt.hash("afrikvoyage@2026!", 12);
        const companyAdmin = await prisma.user.upsert({
            where: { email: "admin@afrikvoyage.com" },
            update: { isActive: true, organizationId: company.id },
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

        // ── 5. Employé de l'entreprise ───────────────────────────────
        const employeePassword = await bcrypt.hash("employe@2026!", 12);
        const employee = await prisma.user.upsert({
            where: { email: "employe@afrikvoyage.com" },
            update: { isActive: true, organizationId: company.id },
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
    } else {
        console.log("ℹ️  Utilisateurs système déjà présents, skip.");
    }

    // ── Section 2 : Partenaire de test (toujours idempotent) ───────────────────
    // Tourne même si la DB était déjà peuplée — upsert safe en re-run.

    // Récupère un superAdmin existant pour le champ createdBy
    const hostAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN", isActive: true },
        select: { id: true },
    });

    if (!hostAdmin) {
        console.log("⚠️  Aucun SUPER_ADMIN trouvé — impossible de créer le partenaire de test.");
    } else {
        let partner = await prisma.partner.findFirst({ where: { name: "Hôtel Eden (test)" } });
        if (!partner) {
            partner = await prisma.partner.create({
                data: {
                    name:         "Hôtel Eden (test)",
                    sector:       "Hôtellerie",
                    contactEmail: "contact@hotel-eden.test",
                    status:       "ACTIVE",
                    scopeType:    "VOYAGE",
                    createdBy:    hostAdmin.id,
                },
            });
            console.log(`✅ Partenaire créé : ${partner.name} (${partner.id})`);
        } else {
            console.log(`ℹ️  Partenaire déjà présent : ${partner.name}`);
        }

        const partnerAdminPassword = await bcrypt.hash("partner@2026!", 12);
        const partnerAdmin = await prisma.partnerUser.upsert({
            where:  { email: "partner@test.com" },
            update: { isActive: true, partnerId: partner.id },
            create: {
                email:        "partner@test.com",
                passwordHash: partnerAdminPassword,
                firstName:    "Partner",
                lastName:     "Admin",
                role:         "PARTNER_ADMIN",
                isActive:     true,
                partnerId:    partner.id,
            },
        });
        console.log(`✅ Utilisateur partenaire : ${partnerAdmin.email}`);
    }

    // ── Section 3 : Catalogue Voyage (vols/hôtels/trains/location) ─────────────
    // Guardé par le comptage d'aéroports — ne tourne qu'une fois sur une DB vierge.
    if (hostAdmin && (await prisma.airport.count()) === 0) {
        const airportDefs = [
            { iataCode: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos",        country: "NG" },
            { iataCode: "ABV", name: "Nnamdi Azikiwe International Airport",   city: "Abuja",         country: "NG" },
            { iataCode: "COO", name: "Cardinal Bernardin Gantin Airport",      city: "Cotonou",       country: "BJ" },
            { iataCode: "ABJ", name: "Félix-Houphouët-Boigny International Airport", city: "Abidjan", country: "CI" },
            { iataCode: "ACC", name: "Kotoka International Airport",          city: "Accra",         country: "GH" },
            { iataCode: "LFW", name: "Gnassingbé Eyadéma International Airport", city: "Lomé",       country: "TG" },
            { iataCode: "DSS", name: "Blaise Diagne International Airport",   city: "Dakar",         country: "SN" },
            { iataCode: "DLA", name: "Douala International Airport",          city: "Douala",        country: "CM" },
            { iataCode: "BKO", name: "Modibo Keïta International Airport",    city: "Bamako",        country: "ML" },
            { iataCode: "OUA", name: "Thomas Sankara International Airport",  city: "Ouagadougou",   country: "BF" },
            { iataCode: "CDG", name: "Charles de Gaulle Airport",             city: "Paris",         country: "FR" },
        ];
        await Promise.all(airportDefs.map((a) => prisma.airport.upsert({ where: { iataCode: a.iataCode }, update: {}, create: a })));
        console.log(`✅ ${airportDefs.length} aéroports créés`);

        const travelPartnerDefs = [
            { name: "ASKY Airlines",           sector: "Compagnie aérienne" },
            { name: "Air Côte d'Ivoire",       sector: "Compagnie aérienne" },
            { name: "Air France",              sector: "Compagnie aérienne" },
            { name: "Ibis Hôtels",             sector: "Hôtellerie" },
            { name: "Novotel",                 sector: "Hôtellerie" },
            { name: "Onomo Hotel",             sector: "Hôtellerie" },
            { name: "Sitarail",                sector: "Transport ferroviaire" },
            { name: "AfrikVoyage Rent-a-Car",  sector: "Location de véhicules" },
            { name: "Avis Afrique",            sector: "Location de véhicules" },
        ];
        const travelPartners: Record<string, { id: string }> = {};
        for (const p of travelPartnerDefs) {
            const created = await prisma.partner.create({
                data: { ...p, status: "ACTIVE", scopeType: "VOYAGE", isGlobal: true, createdBy: hostAdmin.id },
            });
            travelPartners[p.name] = created;
        }
        console.log(`✅ ${travelPartnerDefs.length} partenaires voyage créés`);

        // ── Vols ──
        const flightRouteDefs = [
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "LOS", destination: "ABV", city1: "Lagos",    city2: "Abuja",   departureTime: "08:00", durationMinutes: 75,  basePrice: 85000 },
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "ABV", destination: "LOS", city1: "Abuja",    city2: "Lagos",   departureTime: "17:30", durationMinutes: 75,  basePrice: 85000 },
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "COO", destination: "LOS", city1: "Cotonou",  city2: "Lagos",   departureTime: "09:15", durationMinutes: 50,  basePrice: 60000 },
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "LOS", destination: "COO", city1: "Lagos",    city2: "Cotonou", departureTime: "19:00", durationMinutes: 50,  basePrice: 60000 },
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "LFW", destination: "ACC", city1: "Lomé",     city2: "Accra",   departureTime: "11:00", durationMinutes: 55,  basePrice: 70000 },
            { partner: "ASKY Airlines",     airlineCode: "KP", origin: "ACC", destination: "LFW", city1: "Accra",    city2: "Lomé",    departureTime: "20:30", durationMinutes: 55,  basePrice: 70000 },
            { partner: "Air Côte d'Ivoire", airlineCode: "HF", origin: "ABJ", destination: "COO", city1: "Abidjan",  city2: "Cotonou", departureTime: "07:45", durationMinutes: 95,  basePrice: 110000 },
            { partner: "Air Côte d'Ivoire", airlineCode: "HF", origin: "COO", destination: "ABJ", city1: "Cotonou",  city2: "Abidjan", departureTime: "18:15", durationMinutes: 95,  basePrice: 110000 },
            { partner: "Air Côte d'Ivoire", airlineCode: "HF", origin: "ABJ", destination: "DSS", city1: "Abidjan",  city2: "Dakar",   departureTime: "10:30", durationMinutes: 130, basePrice: 145000 },
            { partner: "Air Côte d'Ivoire", airlineCode: "HF", origin: "DSS", destination: "ABJ", city1: "Dakar",    city2: "Abidjan", departureTime: "21:00", durationMinutes: 130, basePrice: 145000 },
            { partner: "Air France",        airlineCode: "AF", origin: "CDG", destination: "ABJ", city1: "Paris",    city2: "Abidjan", departureTime: "22:40", durationMinutes: 360, basePrice: 480000 },
            { partner: "Air France",        airlineCode: "AF", origin: "ABJ", destination: "CDG", city1: "Abidjan",  city2: "Paris",   departureTime: "01:20", durationMinutes: 360, basePrice: 480000 },
        ];
        await Promise.all(flightRouteDefs.map((r) => prisma.flightRoute.create({
            data: {
                partnerId:       travelPartners[r.partner]!.id,
                airlineCode:     r.airlineCode,
                originIata:      r.origin,
                originCity:      r.city1,
                destinationIata: r.destination,
                destinationCity: r.city2,
                departureTime:   r.departureTime,
                durationMinutes: r.durationMinutes,
                stops:           0,
                basePrice:       r.basePrice,
                currency:        "XOF",
            },
        })));
        console.log(`✅ ${flightRouteDefs.length} routes aériennes créées`);

        // ── Hôtels ──
        const hotelDefs = [
            { partner: "Ibis Hôtels", name: "Ibis Lagos Ikeja",   city: "Lagos",   country: "NG", starRating: 3 },
            { partner: "Novotel",     name: "Novotel Abuja",      city: "Abuja",   country: "NG", starRating: 4 },
            { partner: "Ibis Hôtels", name: "Ibis Cotonou",       city: "Cotonou", country: "BJ", starRating: 3 },
            { partner: "Novotel",     name: "Novotel Abidjan",    city: "Abidjan", country: "CI", starRating: 4 },
            { partner: "Onomo Hotel", name: "Onomo Hotel Lomé",   city: "Lomé",    country: "TG", starRating: 4 },
        ];
        for (const h of hotelDefs) {
            const hotel = await prisma.hotelProperty.create({
                data: { partnerId: travelPartners[h.partner]!.id, name: h.name, city: h.city, country: h.country, starRating: h.starRating },
            });
            await prisma.hotelRoomType.createMany({
                data: [
                    { hotelId: hotel.id, name: "Chambre Standard", capacity: 2, pricePerNight: 35000, currency: "XOF", totalRooms: 10 },
                    { hotelId: hotel.id, name: "Chambre Deluxe",   capacity: 3, pricePerNight: 55000, currency: "XOF", totalRooms: 5  },
                ],
            });
        }
        console.log(`✅ ${hotelDefs.length} hôtels créés (2 types de chambre chacun)`);

        // ── Trains (Sitarail, corridor Abidjan–Ouagadougou) ──
        const trainRouteDefs = [
            { origin: "Abidjan",     station1: "Gare d'Abidjan-Treichville", destination: "Ouagadougou", station2: "Gare de Ouagadougou", departureTime: "07:00", durationMinutes: 1200, basePrice: 25000, travelClass: "Économique" },
            { origin: "Ouagadougou", station1: "Gare de Ouagadougou",        destination: "Abidjan",      station2: "Gare d'Abidjan-Treichville", departureTime: "08:00", durationMinutes: 1200, basePrice: 25000, travelClass: "Économique" },
            { origin: "Abidjan",     station1: "Gare d'Abidjan-Treichville", destination: "Ouagadougou", station2: "Gare de Ouagadougou", departureTime: "07:00", durationMinutes: 1200, basePrice: 45000, travelClass: "Business" },
        ];
        await Promise.all(trainRouteDefs.map((t) => prisma.trainRoute.create({
            data: {
                partnerId:          travelPartners["Sitarail"]!.id,
                originCity:         t.origin,
                originStation:      t.station1,
                destinationCity:    t.destination,
                destinationStation: t.station2,
                departureTime:      t.departureTime,
                durationMinutes:    t.durationMinutes,
                basePrice:          t.basePrice,
                currency:           "XOF",
                travelClass:        t.travelClass,
            },
        })));
        console.log(`✅ ${trainRouteDefs.length} trajets ferroviaires créés`);

        // ── Location de véhicules ──
        const vehicleDefs = [
            { partner: "AfrikVoyage Rent-a-Car", category: "Économique", brand: "Toyota", model: "Corolla",       city: "Cotonou", country: "BJ", pricePerDay: 25000, seats: 5, transmission: "MANUELLE" },
            { partner: "AfrikVoyage Rent-a-Car", category: "SUV",        brand: "Hyundai", model: "Tucson",       city: "Cotonou", country: "BJ", pricePerDay: 45000, seats: 5, transmission: "AUTOMATIQUE" },
            { partner: "Avis Afrique",           category: "Économique", brand: "Toyota", model: "Yaris",         city: "Abidjan", country: "CI", pricePerDay: 22000, seats: 5, transmission: "MANUELLE" },
            { partner: "Avis Afrique",           category: "Luxe",       brand: "Toyota", model: "Land Cruiser",  city: "Abidjan", country: "CI", pricePerDay: 75000, seats: 7, transmission: "AUTOMATIQUE" },
            { partner: "Avis Afrique",           category: "Économique", brand: "Kia",    model: "Rio",           city: "Lagos",   country: "NG", pricePerDay: 24000, seats: 5, transmission: "MANUELLE" },
            { partner: "Avis Afrique",           category: "Compacte",   brand: "Toyota", model: "Camry",         city: "Abuja",   country: "NG", pricePerDay: 38000, seats: 5, transmission: "AUTOMATIQUE" },
        ];
        await Promise.all(vehicleDefs.map((v) => prisma.carRentalVehicle.create({
            data: {
                partnerId:    travelPartners[v.partner]!.id,
                category:     v.category,
                brand:        v.brand,
                model:        v.model,
                city:         v.city,
                country:      v.country,
                pricePerDay:  v.pricePerDay,
                currency:     "XOF",
                seats:        v.seats,
                transmission: v.transmission,
            },
        })));
        console.log(`✅ ${vehicleDefs.length} véhicules de location créés`);
    } else {
        console.log("ℹ️  Catalogue Voyage déjà présent, skip.");
    }

    console.log("\n🔐 Accès de seed :");
    console.log("  Super Admin      : superadmin@waxeho.com     / waxeho@2026!");
    console.log("  Admin Entreprise : admin@afrikvoyage.com     / afrikvoyage@2026!");
    console.log("  Employé          : employe@afrikvoyage.com   / employe@2026!");
    console.log("  Partenaire       : partner@test.com          / partner@2026!");
    console.log("  ⚠️  Table : partner_users (pas users) — connexion via /login");
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