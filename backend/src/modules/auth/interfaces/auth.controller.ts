import { Request, Response } from "express";
import { AuthService } from "../application/auth.service";
import { AuthRepository } from "../infrastructure/auth.repository";

const service = new AuthService(new AuthRepository());

export const register = async (req: Request, res: Response) => {
    try {
        const user = await service.register(req.body);
        res.status(201).json(user);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const tokens = await service.login(
        req.body.email,
        req.body.password
        );
        res.json(tokens);
    } catch (err: any) {
        res.status(401).json({ message: err.message });
    }
};