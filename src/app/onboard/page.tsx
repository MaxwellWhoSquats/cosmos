"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Onboard = () => {
  const router = useRouter();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/");
    }
  }, [authStatus]);

  return <Authenticator />;
};

export default Onboard;
