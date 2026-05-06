import { redirect } from "next/navigation";

// La racine redirige vers login
export default function Home() {
    redirect("/admin/dashboard");
}