// import jwt from "jsonwebtoken";

// export const generateAccessToken = (payload: any) => {
//     return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
//         expiresIn: process.env.JWT_ACCESS_EXPIRES as any,
//     });
// };

// export const generateRefreshToken = (payload: any) => {
//     return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
//         expiresIn: process.env.JWT_REFRESH_EXPIRES as any,
//     });
// };

// export const verifyAccessToken = (token: string) => {
//     return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
// };


import jwt from "jsonwebtoken"; // supprime { SignOptions }

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload { userId: string; role: string; organizationId: string | null; }

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}