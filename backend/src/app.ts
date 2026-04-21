import authRoutes from "@/modules/auth/interfaces/auth.routes";
import express, { type Application, } from 'express';
import cors from 'cors';

const app: Application = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

export default app;