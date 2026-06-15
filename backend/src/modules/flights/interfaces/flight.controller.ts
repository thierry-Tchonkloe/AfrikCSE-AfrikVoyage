import { Request, Response } from "express";
import { FlightRepository } from "../infrastructure/flight.repository";

const repo = new FlightRepository();

export class FlightController {
    async search(req: Request, res: Response): Promise<void> {
        const { from, to, departureDate, returnDate, adults, nonStop, currency } = req.query;

        if (!from || !to || !departureDate) {
            res.status(400).json({ message: "Paramètres from, to et departureDate requis" });
            return;
        }

        try {
            const results = await repo.searchFlights({
                originLocationCode: String(from),
                destinationLocationCode: String(to),
                departureDate: String(departureDate),
                returnDate: returnDate ? String(returnDate) : undefined,
                adults: adults ? parseInt(String(adults), 10) : 1,
                nonStop: nonStop === "true",
                currencyCode: currency ? String(currency) : "XOF",
            });
            res.json(results);
        } catch (err: any) {
            res.status(502).json({ message: err.message ?? "Erreur lors de la recherche de vols" });
        }
    }

    async locations(req: Request, res: Response): Promise<void> {
        const keyword = req.query.keyword;
        if (!keyword || String(keyword).length < 2) {
            res.json([]);
            return;
        }

        try {
            const results = await repo.searchLocations(String(keyword));
            res.json(results);
        } catch (err: any) {
            res.status(502).json({ message: err.message ?? "Erreur lors de la recherche d'aéroport" });
        }
    }
}
