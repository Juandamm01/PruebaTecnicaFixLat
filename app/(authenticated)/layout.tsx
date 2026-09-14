import { AuthNavigation } from "@/components/auth-navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthNavigation />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}