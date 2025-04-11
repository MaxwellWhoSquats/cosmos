"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import React, { useEffect, useState } from "react";

const Home = () => {
  const [displayName, setDisplayName] = useState("");
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      setDisplayName(user.username);
    }
  }, [authStatus]);

  return <div>{displayName}</div>;
};

export default Home;
