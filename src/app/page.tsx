"use client";
import React, { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { client } from "../utils/amplifyClient";

interface User {
  userID: string;
  username: string;
}

const Home = () => {
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const [dbUser, setDbUser] = useState<User | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      getUser();
    }
  }, [authStatus, user]);

  const getUser = async () => {
    try {
      const { data, errors: errorGetUser } = await client.models.User.get({
        id: user.userId,
      });

      if (errorGetUser) {
        console.error("Error fetching user:", errorGetUser);
        return;
      }

      if (data) {
        setDbUser(data as User);
      } else {
        console.log("No user found in DynamoDB");
      }
    } catch (error) {
      console.error("Unkown Error: " + error);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      {dbUser ? (
        <div>
          <p>Welcome, {dbUser.username}!</p>
        </div>
      ) : (
        <p>Not authenticated correctly</p>
      )}
    </div>
  );
};

export default Home;
