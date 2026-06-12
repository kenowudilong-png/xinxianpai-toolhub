import { redirect } from "next/navigation";

export default function LegacyApiConfigsPage() {
  redirect("/admin/app-settings");
}
