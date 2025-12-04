"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { logout } from "@/app/actions/logout";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserIsConnectedProps {
  initialUser?: User; // Data fetched server-side and passed as prop
}

export const UserIsConnected = ({ initialUser }: UserIsConnectedProps) => {
  const { data } = useSession(); // Client-side session data
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Client-side Session Data:</CardTitle>
          <Button onClick={() => signOut()} className="ml-auto">
            Logout with client side
          </Button>
          <Button onClick={handleLogout}>Logout with server side</Button>
        </CardHeader>
        <CardContent>
          {initialUser && (
            <>
              <h2 className="text-xl font-bold">Server-side User Data (from props):</h2>
              <pre>
                <code>
                  {JSON.stringify(initialUser, null, 2)}
                </code>
              </pre>
              <p className="text-xl font-bold">Hello, {initialUser.name} (from server props)!</p>
            </>
          )}

          {data?.user?.name && (
            <p className="text-xl font-bold">Hello, {data.user.name} (from client session)!</p>
          )}

          {!initialUser && !data?.user && (
            <p>No user data available.</p>
          )}
        </CardContent>

        <CardFooter>
          <Link href="/test-tokens">Test tokens</Link>
        </CardFooter>
      </Card>
    </div>
  );
};