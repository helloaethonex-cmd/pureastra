import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/services/api";

const getApiBase = () => {
  const base = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!base) {
    throw new Error("BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required.");
  }

  return `${base.replace(/\/$/, "")}/api/v1`;
};

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function serverAuthFetch(path: string) {
  const cookie = await getCookieHeader();

  if (!cookie) {
    return null;
  }

  return fetch(`${getApiBase()}${path}`, {
    headers: {
      cookie,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

export async function getServerUser() {
  const res = await serverAuthFetch("/users/me");

  if (!res?.ok) {
    return null;
  }

  return (await res.json()) as UserProfile;
}

export async function getServerIsAdmin() {
  const res = await serverAuthFetch("/users/admin");
  return Boolean(res?.ok);
}

export async function requireSession() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const isAdmin = await getServerIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }
}
