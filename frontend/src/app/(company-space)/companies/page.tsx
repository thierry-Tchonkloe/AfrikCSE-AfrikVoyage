import { redirect } from "next/navigation";

export default function CompaniesRootPage() {
    redirect("/companies/dashboard");
}