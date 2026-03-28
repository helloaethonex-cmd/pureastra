"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth.store";

// ─── Session Query ────────────────────────────────────────────────────────────

export function useSession() {
  const { setSession, clearSession, setLoading } = useAuthStore();

  const query = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });

  useEffect(() => {
    if (query.isLoading) {
      setLoading(true);
    } else if (query.data?.user && query.data?.session) {
      setSession({ user: query.data.user, session: query.data.session });
    } else {
      clearSession();
    }
  }, [query.data, query.isLoading, setSession, clearSession, setLoading]);

  return query;
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export function useSignIn(opts?: { onSuccess?: () => void; onError?: (e: string) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? "Sign in failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      opts?.onSuccess?.();
    },
    onError: (err: Error) => opts?.onError?.(err.message),
  });
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export function useSignUp(opts?: { onSuccess?: () => void; onError?: (e: string) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) throw new Error(result.error.message ?? "Sign up failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      opts?.onSuccess?.();
    },
    onError: (err: Error) => opts?.onError?.(err.message),
  });
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export function useSignOut() {
  const queryClient = useQueryClient();
  const { clearSession } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? "Sign out failed");
    },
    onSuccess: () => {
      clearSession();
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/`,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign in failed");
      return result.data;
    },
  });
}
