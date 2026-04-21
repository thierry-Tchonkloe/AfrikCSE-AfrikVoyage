import jwt from "jsonwebtoken";

export const generateAccessToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES as any,
    });
};

export const generateRefreshToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES as any,
    });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
};