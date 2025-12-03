import { UserIsConnected } from "@/components/user-is-connected";
import { UserIsNotConnected } from "@/components/user-is-not-connected";
import { getUser } from "@/lib/auth-server";

export default async function Home() {
  const user = await getUser();
  if (!user) {
    return <UserIsNotConnected />;
  }
  return (
    <UserIsConnected initialUser={user} />
  );
}
