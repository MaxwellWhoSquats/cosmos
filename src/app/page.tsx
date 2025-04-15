"use client";
import React from "react";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";

const Home = () => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <span className="loading loading-ring w-28"></span>
      </div>
    );
  }

  return (
    <div className="flex h-auto w-full border m-4 p-4 rounded">
      <header className="flex space-x-4">
        <h1 className="font-extrabold text-4xl">Welcome,</h1>
        <div className="font-extrabold text-4xl text-transparent bg-clip-text animate-gradient bg-gradient-to-r from-cyan-400 via-purple-600 to-rose-700">
          @{user?.username}
        </div>
      </header>
    </div>
  );
};

export default Home;
