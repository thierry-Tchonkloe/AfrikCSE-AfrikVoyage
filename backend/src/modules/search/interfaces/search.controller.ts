import { Request, Response } from "express";
import { SearchService } from "../application/search.service";

const service = new SearchService();

const COMPANY_ROLES = ["ADMIN", "MANAGER", "RH", "FINANCE"];

export class SearchController {
    async search(req: Request, res: Response): Promise<void> {
        const q = (req.query.q as string)?.trim();
        const scope = req.query.scope as string;

        if (!q || q.length < 2) {
            res.json({ results: [] });
            return;
        }

        const { userId, role, organizationId } = req.user!;

        switch (scope) {
            case "admin":
                if (role !== "SUPER_ADMIN") {
                    res.status(403).json({ message: "Accès interdit" });
                    return;
                }
                res.json({ results: await service.searchAdmin(q) });
                return;

            case "company":
                if (!COMPANY_ROLES.includes(role) || !organizationId) {
                    res.status(403).json({ message: "Accès interdit" });
                    return;
                }
                res.json({ results: await service.searchCompany(organizationId, q) });
                return;

            case "employee":
                if (!organizationId) {
                    res.status(403).json({ message: "Accès interdit" });
                    return;
                }
                res.json({ results: await service.searchEmployee(userId, organizationId, q) });
                return;

            default:
                res.status(400).json({ message: "Paramètre scope invalide (employee, company ou admin)" });
        }
    }
}
