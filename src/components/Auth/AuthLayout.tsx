"use client";
import { Authenticator } from "@aws-amplify/ui-react";
import Navbar from "../Navbar";
import { Amplify } from "aws-amplify";
import config from "@/amplify_outputs.json";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";

Amplify.configure(config, { ssr: true });

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { authStatus } = useAmplifyAuthenticatedUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/onboard");
    }
  }, [authStatus, router]);

  return (
    <div className="flex flex-col h-screen">
      {pathname !== "/onboard" && <Navbar />}
      <main className="flex-1 flex">{children}</main>
    </div>
  );
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticator.Provider>
      <AuthWrapper>{children}</AuthWrapper>
    </Authenticator.Provider>
  );
};

export default AuthLayout;
