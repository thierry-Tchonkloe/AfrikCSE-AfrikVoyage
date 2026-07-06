import { createHmac } from "crypto";
import { ApiDeveloperRepository } from "../../modules/api-developer/infrastructure/api-developer.repository";
import { logger } from "../utils/logger";

const repo = new ApiDeveloperRepository();

export async function dispatchWebhook(orgId: string, event: string, payload: object): Promise<void> {
    const endpoints = await repo.findActiveWebhooksForEvent(orgId, event);
    if (endpoints.length === 0) return;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
        endpoints.map(async (ep) => {
            const sig = createHmac("sha256", ep.secret).update(body).digest("hex");
            let statusCode: number | undefined;
            let responseBody: string | undefined;
            let failed = false;

            try {
                const res = await fetch(ep.url, {
                    method:  "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-AfrikCSE-Signature": `sha256=${sig}`,
                        "X-AfrikCSE-Event":     event,
                    },
                    body,
                    signal: AbortSignal.timeout(8000),
                });
                statusCode   = res.status;
                responseBody = await res.text().catch(() => undefined);
                failed       = !res.ok;
            } catch (err) {
                failed       = true;
                responseBody = err instanceof Error ? err.message : String(err);
                logger.warn(`Webhook dispatch failed for ${ep.id}: ${responseBody}`);
            }

            await repo.logDelivery({ endpointId: ep.id, event, payload, statusCode, responseBody, failed });
        }),
    );
}
