import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { memberLogin } from "@/lib/member.functions";
import { setMemberToken } from "@/lib/member-session";

export const Route = createFileRoute("/member/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Member Sign In — DUMB 31 Community" },
      {
        name: "description",
        content: "Sign in to the DUMB 31 community to answer today's challenge question.",
      },
      { property: "og:title", content: "Member Sign In — DUMB 31 Community" },
      {
        property: "og:description",
        content: "Sign in to the DUMB 31 community to answer today's challenge question.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberLogin,
});

const inputClass =
  "w-full border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:border-primary";

function MemberLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await memberLogin({ data: { email, password } });
      setMemberToken(token);
      await queryClient.invalidateQueries();
      navigate({ to: "/member/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-24">
      <p className="eyebrow text-center">DUMB 31 Community</p>
      <h1 className="mt-2 text-center font-serif text-4xl text-gradient-gold">Sign in</h1>
      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[color:var(--brand-gold-bright)] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link to="/member/signup" className="text-primary hover:underline">
          Join the community
        </Link>
      </p>
    </div>
  );
}
