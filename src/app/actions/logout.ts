"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { accountInfo } from "better-auth/api";
import { Account } from "better-auth";

export const logout = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("session", session);


}