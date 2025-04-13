"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { client } from "../../utils/amplifyClient";

const Onboard = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);

  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      const userId = user.userId || "";
      const username = user.username || "";
      try {
        createUser(userId, username).then(() => {
          router.replace("/");
        });
      } catch (error) {
        console.error(error);
      }
    }
  }, [authStatus, user]);

  // Function to add expanded User data to DynamoDB
  async function createUser(userId: string, username: string) {
    try {
      // Check if user already exists
      const { data: existingUser, errors: errorCheckIfUserExists } =
        await client.models.User.get({
          id: userId,
        });
      if (errorCheckIfUserExists) {
        console.error(errorCheckIfUserExists);
      }
      if (existingUser) {
        console.log("User already exists: " + existingUser.username);
        return;
      }

      // Create new user tied with Cognito
      const { data, errors: errorCreateNewUser } =
        await client.models.User.create({
          id: userId,
          username: username,
        });
      if (errorCreateNewUser) {
        console.error(errorCreateNewUser);
      }
      console.log("Created user:", data?.username);
    } catch (error) {
      console.error("Unknown Error: " + error);
    }
  }

  return <Authenticator />;
};

export default Onboard;
