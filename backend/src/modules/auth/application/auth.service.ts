import { AuthRepository } from "../infrastructure/auth.repository";
import { hashPassword, comparePassword } from "@/core/utils/hash";
import {generateAccessToken, generateRefreshToken,} from "@/core/utils/jwt";

export class AuthService {
    constructor(private repo: AuthRepository) {}

    async register(data: any) {
        const existing = await this.repo.findByEmail(data.email);

        if (existing) {
        throw new Error("User already exists");
        }

        const hashed = await hashPassword(data.password);

        const user = await this.repo.createUser({
        ...data,
        password: hashed,
        });

        return user;
    }

    async login(email: string, password: string) {
        const user = await this.repo.findByEmail(email);

        if (!user) throw new Error("Invalid credentials");

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) throw new Error("Invalid credentials");

        const payload = {
        userId: user.id,
        role: user.role,
        orgId: user.organizationId,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await this.repo.saveRefreshToken(user.id, refreshToken);

        return { accessToken, refreshToken };
    }
}