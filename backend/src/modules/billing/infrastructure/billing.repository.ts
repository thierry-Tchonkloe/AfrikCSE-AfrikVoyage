import { prisma } from "../../../core/config/prisma";
import { Plan, PaymentMethod } from "@prisma/client";
//import crypto from "node:crypto";

export class BillingRepository {
    async getSubscription(orgId: string) {
        return prisma.subscription.findUnique({
        where: { organizationId: orgId },
        include: {
            invoices: {
            orderBy: { createdAt: "desc" },
            take: 12,
            },
        },
        });
    }

    async createOrUpdateSubscription(orgId: string, plan: Plan) {
        const now  = new Date();
        const end  = new Date(now);
        end.setMonth(end.getMonth() + 1);

        return prisma.subscription.upsert({
        where: { organizationId: orgId },
        update: { plan, updatedAt: now },
        create: {
            organizationId: orgId,
            plan,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: end,
        },
        });
    }

    async createInvoice(orgId: string, data: {
        subscriptionId: string;
        amount: number;
        description: string;
        paymentMethod: PaymentMethod;
        paymentRef?: string;
    }) {
        // Génère numéro facture séquentiel
        const count = await prisma.invoice.count({ where: { organizationId: orgId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

        return prisma.invoice.create({
        data: {
            invoiceNumber,
            amount: data.amount,
            description: data.description,
            paymentMethod: data.paymentMethod,
            paymentRef: data.paymentRef,
            organizationId: orgId,
            subscriptionId: data.subscriptionId,
            status: "PAID",
            paidAt: new Date(),
            dueDate: new Date(),
        },
        });
    }

    async getInvoices(orgId: string) {
        return prisma.invoice.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        });
    }
}