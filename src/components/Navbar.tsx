"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Navbar = () => {
  const { user, signOut, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  const router = useRouter();

  // Redirect route to "/" after authentication
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.push("/");
    }
  }, [authStatus, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSignIn = () => {
    router.push("/onboard");
  };

  const defaultRoutes = [
    { href: "/", label: "Home" },
    { href: "/create-server", label: "Create Server", loggedIn: true },
  ];

  const routes = defaultRoutes.filter(
    (route) => route.loggedIn === !!user || route.loggedIn === undefined
  );

  return (
    <div className="navbar bg-base-200 px-4 justify-between">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-xl font-bold">
          COSMOS
        </Link>
        <ul className="menu menu-horizontal flex items-center space-x-4">
          {routes.map((route) => (
            <li key={route.href}>
              <Link href={route.href} className="text-base">
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <button
          className="btn btn-sm btn-outline btn-secondary"
          onClick={user ? handleSignOut : handleSignIn}
        >
          {user ? "Sign Out" : "Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
