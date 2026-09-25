// Base Prisma en mémoire, branchée sur le mock profond existant
// (core/config/__mocks__/prisma.ts), pour les tests de PARCOURS multi-étapes.
// Contrairement aux `mockResolvedValueOnce` des tests de routes, les écritures
// d'une étape sont relues par les suivantes : le hash bcrypt posé à
// l'inscription est celui comparé au login, le tokenVersion incrémenté à
// l'activation est celui vérifié par `authenticate`, etc.
//
// Seul le sous-ensemble de l'API Prisma réellement utilisé par ces parcours est
// implémenté (where simples, select/include/omit, increment, $transaction).
// Un filtre non supporté lève une erreur explicite plutôt que de matcher à tort ;
// les modèles non déclarés gardent le comportement du mock profond (`undefined`).
// Pas de rollback : un $transaction interactif qui échoue laisse ses écritures.
import { randomUUID } from "node:crypto";
import type { DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

type Row = Record<string, any>;
type Args = Record<string, any>;

export type ModelName =
  | "user"
  | "organization"
  | "userSession"
  | "partner"
  | "partnerUser"
  | "benefitCategory"
  | "platformSettings"
  | "auditLog";

const MODELS: ModelName[] = [
  "user",
  "organization",
  "userSession",
  "partner",
  "partnerUser",
  "benefitCategory",
  "platformSettings",
  "auditLog",
];

// Valeurs @default de prisma/schema.prisma — limitées aux champs lus par les parcours.
const DEFAULTS: Record<ModelName, () => Row> = {
  user: () => ({
    id: randomUUID(), role: "EMPLOYE", isActive: true, tokenVersion: 0,
    profileCompleted: false, emailVerified: false, emailVerifiedAt: null,
    avatar: null, phone: null, jobTitle: null, department: null, costCenter: null,
    managerId: null, lastLoginAt: null, resetPasswordToken: null, resetPasswordExpiresAt: null,
    timezone: "Africa/Lome", dateFormat: "DD/MM/YYYY",
    notificationPreferences: { email: true, travelAlerts: true, cseUpdates: true, systemUpdates: true },
    createdAt: new Date(), updatedAt: new Date(),
  }),
  organization: () => ({
    id: randomUUID(), status: "PENDING", plan: "STARTER", hasVoyage: false, hasCSE: false,
    isHost: false, logoUrl: null, faviconUrl: null, primaryColor: null, secondaryColor: null,
    accentColor: null, validatedAt: null, validatedById: null, rejectedAt: null,
    rejectionNote: null, currencyCode: "XOF", createdAt: new Date(), updatedAt: new Date(),
  }),
  userSession: () => ({
    id: randomUUID(), userAgent: null, ipAddress: null, lastUsedAt: new Date(), createdAt: new Date(),
  }),
  partner: () => ({
    id: randomUUID(), status: "DRAFT", scopeType: "CSE", apiEnabled: false, apiKeyEncrypted: null,
    isGlobal: true, organizationIds: [], syncFrequencyH: 24, warningCount: 0, flaggedAt: null,
    partnerToken: null, mobileMoneyNumberEncrypted: null, bankDetailsEncrypted: null,
    currencyCode: "XOF", description: null, phone: null, logoUrl: null, websiteUrl: null,
    notes: null, createdAt: new Date(), updatedAt: new Date(),
  }),
  partnerUser: () => ({
    id: randomUUID(), role: "PARTNER_ADMIN", isActive: true, tokenVersion: 0, refreshToken: null,
    lastLoginAt: null, invitedById: null, resetPasswordToken: null, resetPasswordExpiresAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  }),
  benefitCategory: () => ({ id: randomUUID(), isActive: true, createdAt: new Date() }),
  platformSettings: () => ({
    id: "singleton", notifyOnValidation: true, notifyOnRejection: true, notifyWelcome: false,
    updatedAt: new Date(),
  }),
  auditLog: () => ({ id: randomUUID(), createdAt: new Date() }),
};

// Contraintes @unique vérifiées à l'insertion (→ P2002, comme Postgres).
const UNIQUE_FIELDS: Partial<Record<ModelName, string[]>> = {
  user: ["email"],
  organization: ["slug"],
  userSession: ["refreshTokenHash"],
  partnerUser: ["email", "resetPasswordToken"],
};

// Relations résolues par select/include/_count. "none" = relation absente de
// cette base (toujours null) ; "emptyList" = liste toujours vide.
type Relation =
  | { kind: "one"; model: ModelName; fk: string }
  | { kind: "many"; model: ModelName; fk: string }
  | { kind: "none" }
  | { kind: "emptyList" };

const RELATIONS: Partial<Record<ModelName, Record<string, Relation>>> = {
  user: {
    organization: { kind: "one", model: "organization", fk: "organizationId" },
    manager: { kind: "one", model: "user", fk: "managerId" },
    employee: { kind: "none" },
    wallet: { kind: "none" },
    documents: { kind: "emptyList" },
  },
  organization: {
    users: { kind: "many", model: "user", fk: "organizationId" },
    subscription: { kind: "none" },
  },
  partner: {
    locations: { kind: "emptyList" },
    offers: { kind: "emptyList" },
    syncLogs: { kind: "emptyList" },
  },
  partnerUser: {
    partner: { kind: "one", model: "partner", fk: "partnerId" },
  },
};

function prismaError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

function isPlainObject(value: unknown): value is Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function matchesCondition(value: unknown, field: string, condition: unknown): boolean {
  if (!isPlainObject(condition)) return value === condition;

  return Object.entries(condition).every(([operator, operand]) => {
    switch (operator) {
      case "equals": return value === operand;
      case "not":    return value !== operand;
      case "in":     return (operand as unknown[]).includes(value);
      case "gt":     return value != null && (value as any) > (operand as any);
      case "gte":    return value != null && (value as any) >= (operand as any);
      case "lt":     return value != null && (value as any) < (operand as any);
      case "lte":    return value != null && (value as any) <= (operand as any);
      default:
        throw new Error(`in-memory-prisma : filtre non supporté "${field}.${operator}"`);
    }
  });
}

function matchesWhere(row: Row, where: Args | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(
    ([field, condition]) => condition === undefined || matchesCondition(row[field], field, condition)
  );
}

function sortRows(rows: Row[], orderBy: Args | Args[] | undefined): Row[] {
  const clauses = orderBy ? ([] as Args[]).concat(orderBy) : [];
  if (clauses.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      for (const [field, direction] of Object.entries(clause)) {
        if (a[field] < b[field]) return direction === "desc" ? 1 : -1;
        if (a[field] > b[field]) return direction === "desc" ? -1 : 1;
      }
    }
    return 0;
  });
}

function applyData(row: Row, data: Args): void {
  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) continue; // Prisma ignore les champs `undefined`
    if (isPlainObject(value) && "increment" in value) row[field] = (row[field] ?? 0) + value.increment;
    else if (isPlainObject(value) && "decrement" in value) row[field] = (row[field] ?? 0) - value.decrement;
    else if (isPlainObject(value) && "set" in value) row[field] = value.set;
    else row[field] = value;
  }
}

export class InMemoryDb {
  private readonly tables = new Map<ModelName, Row[]>(MODELS.map((model) => [model, []]));

  private rows(model: ModelName): Row[] {
    return this.tables.get(model)!;
  }

  /** Insère une ligne (valeurs par défaut du schéma + contraintes @unique) et la retourne. */
  insert(model: ModelName, data: Args): Row {
    const row = DEFAULTS[model]();
    applyData(row, data);
    for (const field of UNIQUE_FIELDS[model] ?? []) {
      if (row[field] != null && this.rows(model).some((other) => other[field] === row[field])) {
        throw prismaError("P2002", `Unique constraint failed on the fields: (\`${field}\`)`);
      }
    }
    this.rows(model).push(row);
    return row;
  }

  /** Lecture directe (copie) pour les assertions — ne passe pas par select/include. */
  findOne(model: ModelName, where: Args): Row | null {
    const row = this.rows(model).find((r) => matchesWhere(r, where));
    return row ? { ...row } : null;
  }

  findAll(model: ModelName, where?: Args): Row[] {
    return this.rows(model).filter((r) => matchesWhere(r, where)).map((r) => ({ ...r }));
  }

  private resolveRelation(model: ModelName, row: Row, field: string, nested: Args): unknown {
    const relation = RELATIONS[model]?.[field];
    if (!relation) throw new Error(`in-memory-prisma : relation inconnue "${model}.${field}"`);

    switch (relation.kind) {
      case "none":
        return null;
      case "emptyList":
        return [];
      case "one": {
        const target = this.rows(relation.model).find((r) => r.id === row[relation.fk]);
        return target ? this.shape(relation.model, target, nested) : null;
      }
      case "many": {
        let list = this.rows(relation.model).filter(
          (r) => r[relation.fk] === row.id && matchesWhere(r, nested.where)
        );
        list = sortRows(list, nested.orderBy);
        if (nested.take !== undefined) list = list.slice(0, nested.take);
        return list.map((r) => this.shape(relation.model, r, nested));
      }
    }
  }

  private count(model: ModelName, row: Row, spec: Args): Row {
    const counts: Row = {};
    for (const [field, enabled] of Object.entries(spec.select ?? {})) {
      if (enabled) counts[field] = (this.resolveRelation(model, row, field, {}) as unknown[]).length;
    }
    return counts;
  }

  /** Applique select / include / omit comme le ferait Prisma (copie, jamais la ligne stockée). */
  private shape(model: ModelName, row: Row, args: Args): Row {
    const nestedArgs = (spec: unknown): Args => (spec === true ? {} : (spec as Args));

    if (args.select) {
      const out: Row = {};
      for (const [field, spec] of Object.entries(args.select as Args)) {
        if (!spec) continue;
        if (field === "_count") out._count = this.count(model, row, spec);
        else if (RELATIONS[model]?.[field]) out[field] = this.resolveRelation(model, row, field, nestedArgs(spec));
        else out[field] = row[field];
      }
      return out;
    }

    const out: Row = { ...row };
    for (const [field, omitted] of Object.entries((args.omit ?? {}) as Args)) {
      if (omitted) delete out[field];
    }
    for (const [field, spec] of Object.entries((args.include ?? {}) as Args)) {
      if (!spec) continue;
      out[field] = field === "_count"
        ? this.count(model, row, spec)
        : this.resolveRelation(model, row, field, nestedArgs(spec));
    }
    return out;
  }

  /** Délégué Prisma (`prisma.<model>.*`) adossé à cette base. */
  delegate(model: ModelName) {
    const findFirst = async (args: Args = {}) => {
      const row = sortRows(this.rows(model).filter((r) => matchesWhere(r, args.where)), args.orderBy)[0];
      return row ? this.shape(model, row, args) : null;
    };
    const findExisting = (args: Args) => {
      const row = this.rows(model).find((r) => matchesWhere(r, args.where));
      if (!row) throw prismaError("P2025", `No record was found for ${model}`);
      return row;
    };
    const touch = (row: Row) => {
      if ("updatedAt" in row) row.updatedAt = new Date();
    };

    return {
      findUnique: findFirst,
      findFirst,
      findUniqueOrThrow: async (args: Args) => this.shape(model, findExisting(args), args),
      findMany: async (args: Args = {}) => {
        let list = sortRows(this.rows(model).filter((r) => matchesWhere(r, args.where)), args.orderBy);
        if (args.skip) list = list.slice(args.skip);
        if (args.take !== undefined) list = list.slice(0, args.take);
        return list.map((r) => this.shape(model, r, args));
      },
      count: async (args: Args = {}) => this.rows(model).filter((r) => matchesWhere(r, args.where)).length,
      create: async (args: Args) => this.shape(model, this.insert(model, args.data), args),
      createMany: async (args: Args) => {
        const items = ([] as Args[]).concat(args.data);
        items.forEach((item) => this.insert(model, item));
        return { count: items.length };
      },
      update: async (args: Args) => {
        const row = findExisting(args);
        applyData(row, args.data);
        touch(row);
        return this.shape(model, row, args);
      },
      updateMany: async (args: Args) => {
        const list = this.rows(model).filter((r) => matchesWhere(r, args.where));
        list.forEach((row) => {
          applyData(row, args.data);
          touch(row);
        });
        return { count: list.length };
      },
      upsert: async (args: Args) => {
        const row = this.rows(model).find((r) => matchesWhere(r, args.where));
        if (!row) return this.shape(model, this.insert(model, args.create), args);
        applyData(row, args.update);
        touch(row);
        return this.shape(model, row, args);
      },
      delete: async (args: Args) => {
        const row = findExisting(args);
        this.tables.set(model, this.rows(model).filter((r) => r !== row));
        return this.shape(model, row, args);
      },
      deleteMany: async (args: Args = {}) => {
        const kept = this.rows(model).filter((r) => !matchesWhere(r, args.where));
        const count = this.rows(model).length - kept.length;
        this.tables.set(model, kept);
        return { count };
      },
    };
  }
}

/**
 * Branche une base en mémoire vierge sur le mock profond de Prisma : chaque
 * méthode des modèles déclarés est remplacée (mockImplementation, donc conservée
 * malgré `clearMocks: true`), `$transaction` exécute le callback avec le même
 * client (forme interactive) ou attend le tableau de requêtes (forme batch).
 */
export function installInMemoryPrisma(prismaMock: DeepMockProxy<PrismaClient>): InMemoryDb {
  const db = new InMemoryDb();
  const client = prismaMock as unknown as Record<string, Record<string, jest.Mock>>;

  for (const model of MODELS) {
    for (const [method, implementation] of Object.entries(db.delegate(model))) {
      client[model][method].mockImplementation(implementation as (...args: any[]) => any);
    }
  }

  (prismaMock.$transaction as unknown as jest.Mock).mockImplementation(async (arg: unknown) =>
    typeof arg === "function" ? arg(prismaMock) : Promise.all(arg as Promise<unknown>[])
  );

  return db;
}
