"use client";
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { client } from "../utils/amplifyClient";

interface User {
  id: string;
  username: string;
  icon: string;
}

export const useAmplifyAuthenticatedUser = () => {
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      fetchUser();
    } else {
      setDbUser(null);
      setLoading(false);
    }
  }, [authStatus, user]);

  useEffect(() => {
    if (dbUser !== undefined) {
      setLoading(false);
    }
  }, [dbUser]);

  const fetchUser = async () => {
    try {
      setLoading(true);

      // Fetch full Authenticated User data from DynamoDB
      const { data, errors } = await client.models.User.get({
        id: user.userId,
      });

      if (errors) {
        console.error(errors);
        setDbUser(null);
        return;
      }

      setDbUser(data as User || null);
    } catch (error) {
      console.error("Unknown Error: ", error);
      setDbUser(null);
    }
  };

  // "user" is Cognito, "dbUser" is from DynamoDB
  return { authStatus, user, dbUser, loading };
};