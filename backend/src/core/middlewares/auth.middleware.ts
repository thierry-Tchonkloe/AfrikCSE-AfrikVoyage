// import { Request, Response, NextFunction } from "express";
// import { verifyAccessToken } from "@/core/utils/jwt";

// export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
//     const token = req.headers.authorization?.split(" ")[1];

//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     try {
//         const decoded = verifyAccessToken(token);
//         req.user = decoded;
//         next();
//     } catch {
//         return res.status(401).json({ message: "Invalid token" });
//     }
// };


import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
        user?: {
            userId: string;
            role: Role;
            organizationId: string | null;
        };
        }
    }
}

export function authenticate( req: Request, res: Response, next: NextFunction ): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token manquant" });
        return; // void, pas return res
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = {
        userId: payload.userId,
        role: payload.role as Role,
        organizationId: payload.organizationId,
        };
        next();
    } catch {
        res.status(401).json({ message: "Token invalide ou expiré" });
    }
}

export function authorize(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: "Non authentifié" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Accès interdit" });
            return;
        }

        next();
    };
}