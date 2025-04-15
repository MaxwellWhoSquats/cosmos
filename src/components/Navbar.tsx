"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";
import { signOut } from "aws-amplify/auth";
import { client } from "../utils/amplifyClient";
import { downloadData } from "aws-amplify/storage";
import EmptyProfileIcon from "./Icons/EmptyProfileIcon";

const Navbar = () => {
  const [iconS3Url, setIconS3Url] = useState<string>("");
  const [displaySkeleton, setDisplaySkeleton] = useState<boolean>(true);
  const { dbUser: user } = useAmplifyAuthenticatedUser();

  const defaultRoutes = [
    { href: "/", label: "Home" },
    { href: "/servers", label: "Servers" },
  ];

  useEffect(() => {
    if (user?.id) {
      GetProfileIconS3Link();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  // FIND A WAY TO CACHE ICON, so that every refresh isnt another API call to S3
  const GetProfileIconS3Link = async () => {
    try {
      const { data, errors: errorGetProfileIconS3Link } =
        await client.models.User.get({
          id: user?.id,
        });
      if (errorGetProfileIconS3Link) {
        console.error(errorGetProfileIconS3Link);
        return;
      }
      if (data?.icon) {
        await downloadProfileIcon(data.icon);
        setDisplaySkeleton(false);
      }
    } catch (error) {
      console.error("Unknown Error: ", error);
    }
  };

  const downloadProfileIcon = async (path: string) => {
    try {
      const { body } = await downloadData({ path }).result;
      const url = URL.createObjectURL(await body.blob());
      setIconS3Url(url);
    } catch (error) {
      console.error("Failed to download profile icon! " + error);
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
          <button tabIndex={0} role="button">
            <div className="avatar">
              {iconS3Url ? (
                <div className="w-9 rounded-full cursor-pointer hover:opacity-70">
                  <img src={iconS3Url} alt="ProfileIcon" />
                </div>
              ) : displaySkeleton ? (
                <div className="skeleton w-9 shrink-0 rounded-full"></div>
              ) : (
                <div className="flex p-2 bg-info-content rounded-full items-center justify-center cursor-pointer hover:opacity-70">
                  <EmptyProfileIcon />
                </div>
              )}
            </div>
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-info-content rounded-box z-1 w-52 mt-2 p-2 shadow-sm"
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
      </div>
    </div>
  );
};

export default Navbar;
