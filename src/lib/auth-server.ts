import { headers } from "next/headers";

import { auth } from "./auth";

export const getSession = async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
};

export const getUser = async () => {
  const session = await getSession();
  return session?.user;
};

export const getToken = async () => {
  const session = await getSession();
  return session?.session?.token;
};
