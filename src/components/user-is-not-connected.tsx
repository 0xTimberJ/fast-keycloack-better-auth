"use client";

import { Button } from "./ui/button";
import { signIn } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export const UserIsNotConnected = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>User is not connected</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() =>
              signIn.social({
                provider: "keycloak",
                callbackURL: "/",
              })
            }
          >
            Login with Keycloak
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};