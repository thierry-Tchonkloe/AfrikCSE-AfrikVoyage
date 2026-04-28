import { SettingsRepository } from "../infrastructure/settings.repository";

export class SettingsService {
    private repo = new SettingsRepository();

    async get() {
        return this.repo.get();
    }

    async update(data: Parameters<SettingsRepository["update"]>[0]) {
        return this.repo.update(data);
    }

    async getDashboardData() {
        const [stats, recent, monthly] = await Promise.all([
            this.repo.getStats(),
            this.repo.getRecentOrganizations(5),
            this.repo.getMonthlyStats(),
        ]);
        return { stats, recent, monthly };
    }
}