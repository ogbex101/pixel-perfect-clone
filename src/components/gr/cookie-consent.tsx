import { useEffect, useState } from "react";

const STORAGE_KEY = "gr-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (!consented) {
      const timer = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const choose = (value: string) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-5">
      <div className="gr-shadow-elevated gr-fade-in w-full max-w-[680px] border border-[color:var(--gr-hairline-faint)] bg-[color:var(--gr-surface)] p-7 text-center">
        <p className="gr-eyebrow">Cookies</p>
        <p className="mt-3 text-[13px] leading-[1.7] text-[color:var(--gr-muted)]">
          In order to give you a better and personalised experience, we use cookies. By continuing
          to browse this site you agree to our use of cookies as outlined in our Cookie Policy.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("all")}
            className="gr-btn-solid gr-btn-sm w-full sm:w-auto"
          >
            Allow All
          </button>
          <button
            type="button"
            onClick={() => choose("manage")}
            className="gr-btn-ghost gr-btn-sm w-full sm:w-auto"
          >
            Manage Cookies
          </button>
          <button
            type="button"
            onClick={() => choose("decline")}
            className="gr-btn-ghost gr-btn-sm w-full border-transparent text-[color:var(--gr-muted)] hover:border-transparent hover:bg-transparent hover:text-[color:var(--gr-ivory)] sm:w-auto"
          >
            Decline All
          </button>
        </div>
      </div>
    </div>
  );
}
