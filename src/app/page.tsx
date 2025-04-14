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
  } else {
    return (
      <div className="flex h-auto w-full border m-4 p-4 rounded">
        <h1 className="text-2xl font-extrabold">Welcome, {user?.username}</h1>
      </div>
    );
  }
};

export default Home;
