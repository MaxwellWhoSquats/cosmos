"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Navbar = () => {
  const { user, signOut } = useAuthenticator((context) => [
    context.user,
    context.signOut,
  ]);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/onboard");
  };

  const defaultRoutes = [
    { href: "/", label: "Home" },
    { href: "/create-server", label: "Create Server" },
  ];

  return (
    <div className="navbar bg-base-200 px-4 justify-between">
      <div className="flex items-center space-x-4">
        <Link href={user ? "/" : "/onboard"} className="text-xl font-bold">
          COSMOS
        </Link>
        {user && (
          <ul className="menu menu-horizontal flex items-center space-x-4">
            {defaultRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} className="text-base">
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <button
          className="btn btn-sm btn-outline btn-secondary"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Navbar;
