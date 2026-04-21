import { prisma } from "@/core/config/prisma";

export class AuthRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: any) {
        return prisma.user.create({ data });
    }

    async saveRefreshToken(userId: string, token: string) {
        return prisma.user.update({
        where: { id: userId },
        data: { refreshToken: token },
        });
    }
}