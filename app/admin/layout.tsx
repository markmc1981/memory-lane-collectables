import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login page itself renders through this same layout tree, so only
  // redirect once we know there's genuinely no user *and* middleware
  // already let the request through (it protects everything but /admin/login).
  const isLoggedOut = !user;

  return (
    <div className="min-h-screen flex">
      {!isLoggedOut && (
        <aside className="w-56 border-r border-[var(--line)] p-5 flex flex-col gap-1">
          <p className="text-sm font-semibold mb-4">C Mac Sales admin</p>
          <Link href="/admin" className="text-sm py-1.5">
            Jobs &amp; stock
          </Link>
          <Link href="/admin/reservations" className="text-sm py-1.5">
            Reservations
          </Link>
          <div className="flex-1" />
          <p className="text-xs text-[var(--muted)] mb-2">{user?.email}</p>
          <SignOutButton />
        </aside>
      )}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
