"use client";
import { Authenticator } from "@aws-amplify/ui-react";
import Navbar from "../Navbar";
import { Amplify } from "aws-amplify";
import config from "@/amplify_outputs.json";
import React from "react";

Amplify.configure(config, { ssr: true });

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticator.Provider>
      <div className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          {children}
        </main>
      </div>
    </Authenticator.Provider>
  );
};

export default AuthLayout;
