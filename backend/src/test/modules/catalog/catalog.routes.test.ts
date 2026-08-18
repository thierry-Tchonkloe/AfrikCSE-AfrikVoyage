import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { prisma } from "../../../core/config/prisma";
import { CatalogRepository } from "../../../modules/catalog/infrastructure/catalog.repository";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const findManyMock = prismaMock.benefitCatalogItem.findMany as unknown as jest.Mock;
const repository = new CatalogRepository();

const whereDuNieme = (n: number) => (findManyMock.mock.calls[n][0] as any).where;

beforeEach(() => {
  mockReset(prismaMock);
  findManyMock.mockResolvedValue([]);
});

describe("CatalogRepository.getAll — les filtres ne doivent jamais élargir la visibilité", () => {
  it("conserve la fenêtre de publication quand un terme de recherche est fourni", async () => {
    await repository.getAll("org-1", {});
    await repository.getAll("org-1", { search: "cinéma" });

    expect(JSON.stringify(whereDuNieme(0))).toContain("publishedAt");
    expect(JSON.stringify(whereDuNieme(1))).toContain("publishedAt");
    expect(whereDuNieme(1).organizationId).toBe("org-1");
    expect(whereDuNieme(1).isActive).toBe(true);
  });

  it("combine recherche et filtre « subventionnées » au lieu de les écraser", async () => {
    await repository.getAll("org-1", { search: "cinéma", subsidized: true });

    const where = JSON.stringify(whereDuNieme(0));
    expect(where).toContain("subsidyPct");
    expect(where).toContain("title");
  });
});

describe("CatalogRepository.create", () => {
  const payload = {
    title: "Réduction cinéma", category: "Loisirs",
    subsidyPct: 20, employeePrice: 4000, companyPrice: 5000,
  };

  it("n'écrit que les champs de la liste blanche et attribue l'offre à l'organisation appelante", async () => {
    (prismaMock.benefitCatalogItem.create as unknown as jest.Mock).mockResolvedValueOnce({ id: "offer-1", ...payload });
    (prismaMock.offerAuditEntry.create as unknown as jest.Mock).mockResolvedValueOnce({});

    await repository.create("org-1", "user-1", { ...payload, organizationId: "org-999", id: "offer-force" } as never);

    const [args] = (prismaMock.benefitCatalogItem.create as unknown as jest.Mock).mock.calls[0] as any[];
    expect(args.data.organizationId).toBe("org-1"); // celui de l'argument, pas du payload
    expect(args.data).not.toHaveProperty("id");
    expect(args.data.isActive).toBe(true); // défaut explicite du repository

    expect(prismaMock.offerAuditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "CREATED", changedBy: "user-1", version: 1 }),
      }),
    );
  });
});
