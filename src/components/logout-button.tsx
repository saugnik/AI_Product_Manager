"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="btn btn-ghost px-4 py-1.5"
    >
      Sign out
    </button>
  );
}
