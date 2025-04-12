"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import Navbar from "../Navbar";
import { Amplify } from "aws-amplify";
import config from "@/amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

Amplify.configure(config, { ssr: true });

const AuthHandler = ({ children }: { children: React.ReactNode }) => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/onboard");
    }
  }, [authStatus, router]);

  return <>{children}</>;
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticator.Provider>
      <div className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <AuthHandler>{children}</AuthHandler>
        </main>
      </div>
    </Authenticator.Provider>
  );
};

export default AuthLayout;
