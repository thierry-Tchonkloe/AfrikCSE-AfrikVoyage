import { Role } from "@prisma/client";

export { Role };

/**
 * Point d'entrée unique pour les rôles applicatifs (dérivés de l'enum Prisma `Role`).
 * `satisfies Record<Role, Role>` force la mise à jour de cette liste si un rôle
 * est ajouté/retiré côté schema.prisma.
 */
export const ROLES = {
  SUPER_ADMIN: Role.SUPER_ADMIN,
  PLATFORM_MANAGER: Role.PLATFORM_MANAGER,
  ADMIN: Role.ADMIN,
  MANAGER: Role.MANAGER,
  RH: Role.RH,
  FINANCE: Role.FINANCE,
  EMPLOYE: Role.EMPLOYE,
  PARTNER_ADMIN: Role.PARTNER_ADMIN,
  PARTNER_STAFF: Role.PARTNER_STAFF,
} as const satisfies Record<Role, Role>;

export type RoleName = keyof typeof ROLES;
