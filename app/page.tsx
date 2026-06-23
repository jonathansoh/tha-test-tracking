import { redirect } from "next/navigation";

// The middleware already routes "/" based on auth state; this is a fallback.
export default function Home() {
  redirect("/dashboard");
}
