import { UserRepository } from "../infrastructure/user.repository";
import { CreateUserDto, UpdateUserDto, ChangeRoleDto } from "../interfaces/user.validator";
import { UserEntity } from "../domain/user.entity";
import { Role } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { sendMail } from "../../../core/config/mailer";
import { employeeInvitationEmail } from "../../../core/mailer/email.templates";

export class UserService {
    private repo = new UserRepository();

    /** Liste les users — SUPER_ADMIN voit tout, ADMIN voit son org */
    async getAll(requester: { role: string; organizationId: string | null }) {
        if (requester.role === "SUPER_ADMIN") {
        return this.repo.findAll();
        }

        if (!requester.organizationId) throw new Error("Organisation introuvable");
        return this.repo.findByOrganization(requester.organizationId);
    }

    async getById(id: string) {
        const user = await this.repo.findById(id);
        if (!user) throw new Error("Utilisateur introuvable");
        return user;
    }

    /** Crée un user dans l'organisation du demandeur */
    async create(
        requester: { role: string; organizationId: string | null },
        dto: CreateUserDto
    ) {
        // Détermine l'organisation cible
        const organizationId = requester.organizationId;
        if (!organizationId) throw new Error("Organisation requise");

        // Vérifie que l'email n'existe pas
        const existing = await prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new Error("Cet email est déjà utilisé");

        // Vérifie la hiérarchie des rôles
        const requesterEntity = new UserEntity(
        "",
        "",
        "",
        "",
        requester.role,
        organizationId,
        true
        );

        if (!requesterEntity.canManageRole(dto.role)) {
        throw new Error("Vous ne pouvez pas créer un utilisateur avec ce rôle");
        }

        const { user, inviteToken } = await this.repo.create({ ...dto, organizationId, role: dto.role as Role });

        const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
        });

        const setPasswordLink = `${process.env.FRONTEND_URL}/activate?token=${inviteToken}`;
        const { subject, html } = employeeInvitationEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: organization?.name ?? "",
        role: user.role,
        setPasswordLink,
        expiresInHours: 72,
        });
        await sendMail({ to: user.email, subject, html });

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.getById(id); // vérifie existence
        return this.repo.update(id, dto);
    }

    async changeRole(
        requester: { role: string },
        targetId: string,
        dto: ChangeRoleDto
    ) {
        const target = await this.getById(targetId);

        const requesterEntity = new UserEntity("", "", "", "", requester.role, null, true);
        if (!requesterEntity.canManageRole(dto.role)) {
        throw new Error("Vous ne pouvez pas attribuer ce rôle");
        }
        if (!requesterEntity.canManageRole(target.role)) {
        throw new Error("Vous ne pouvez pas modifier le rôle de cet utilisateur");
        }

        return this.repo.changeRole(targetId, dto.role as Role);
    }

    async deactivate(id: string) {
        await this.getById(id);
        return this.repo.deactivate(id);
    }

    async activate(id: string) {
        await this.getById(id);
        return this.repo.activate(id);
    }
}