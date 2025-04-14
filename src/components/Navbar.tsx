"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";
import { signOut } from "aws-amplify/auth";
import { client } from "../utils/amplifyClient";
import { StorageImage } from "@aws-amplify/ui-react-storage";

const Navbar = () => {
  const [iconPath, setIconPath] = useState<string>("");
  const { dbUser: user } = useAmplifyAuthenticatedUser();

  const defaultRoutes = [
    { href: "/", label: "Home" },
    { href: "/create-server", label: "Create Server" },
  ];

  useEffect(() => {
    if (user?.id) {
      getProfileIcon();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const getProfileIcon = async () => {
    try {
      const { data, errors } = await client.models.User.get({
        id: user?.id,
      });
      if (errors) {
        console.error(errors);
        return;
      }
      if (data?.icon) {
        const path = data.icon;
        setIconPath(path);
      }
    } catch (error) {
      console.error("Unknown Error: ", error);
    }
  };

  return (
    <div className="navbar h-8 bg-base-300 px-4 justify-between">
      <div id="left-side" className="flex items-center space-x-4">
        <Link href={"/"} className="text-xl font-bold">
          COSMOS
        </Link>
        {user && (
          <ul className="menu menu-horizontal flex items-center space-x-2">
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
      <div id="right-side" className="flex space-x-2 items-center">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-sm bg-info-content m-1"
          >
            {user?.username}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-info-content rounded-box z-1 w-52 p-2 shadow-sm"
          >
            <li>
              <Link href={"/profile"}>
                <p className="text-xs">EDIT PROFILE</p>
              </Link>
            </li>
            <li>
              <button onClick={handleSignOut}>
                <p className="text-xs">SIGNOUT</p>
              </button>
            </li>
          </ul>
        </div>
        <div className="avatar">
          <div className="w-8 rounded-full">
            {iconPath ? (
              <StorageImage alt="icon" path={iconPath} />
            ) : (
              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
