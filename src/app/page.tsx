"use client";
import React from "react";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";

const Home = () => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();

  if (loading) {
    return <span className="loading loading-ring w-28"></span>;
  }

  return (
    <div>
      <h1>Home</h1>
      {user ? (
        <div>
          <p>Welcome, {user.username}!</p>
        </div>
      ) : (
        <p>Not authenticated!</p>
      )}
    </div>
  );
};

export default Home;
