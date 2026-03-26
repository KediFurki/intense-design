import { getSettings } from "@/server/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Settings</h1>
        <p className="text-stone-500">Manage your store preferences.</p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}