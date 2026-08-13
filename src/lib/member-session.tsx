import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { getMemberContext, memberLogout } from "./member.functions";

const TOKEN_KEY = "dumb31_member_token";

export function getMemberToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setMemberToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearMemberToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export const memberContextKey = ["member", "context"];

export function useMemberContext() {
  const token = getMemberToken();
  return useQuery({
    queryKey: memberContextKey,
    enabled: Boolean(token),
    retry: false,
    queryFn: () => getMemberContext({ data: { token: token as string } }),
  });
}

export function useMemberSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    const token = getMemberToken();
    clearMemberToken();
    queryClient.clear();
    if (token) {
      try {
        await memberLogout({ data: { token } });
      } catch {
        /* session already gone */
      }
    }
    navigate({ to: "/member/login", replace: true });
  };
}

/** Client-side gate for member-only pages (routes use `ssr: false`). */
export function MemberGate({ children }: { children: (ctx: MemberCtx) => ReactNode }) {
  const navigate = useNavigate();
  const token = getMemberToken();
  const { data, isLoading, error } = useMemberContext();

  useEffect(() => {
    if (!token) navigate({ to: "/member/login", replace: true });
  }, [token, navigate]);

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading your bunker credentials…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Your session is no longer valid."}
        </p>
        <Link
          to="/member/login"
          className="mt-6 inline-block bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Sign in again
        </Link>
      </div>
    );
  }

  return <>{children(data)}</>;
}

export type MemberCtx = Awaited<ReturnType<typeof getMemberContext>>;
