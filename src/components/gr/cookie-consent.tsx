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
    <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4">
      <div className="gr-shadow-elevated w-full max-w-[640px] rounded-[3.75px] bg-[#141414] p-6 text-center">
        <p className="text-[14px] leading-[21px] text-[#d0d0d0]">
          In order to give you a better and personalised experience, we use cookies. By continuing
          to browse this site you agree to our use of cookies as outlined in our Cookie Policy.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => choose("all")}
            className="w-full sm:w-auto rounded-[3.75px] bg-white px-6 py-3 text-[13px] font-bold uppercase text-black transition-opacity hover:opacity-90"
          >
            Allow All Cookies
          </button>
          <button
            type="button"
            onClick={() => choose("manage")}
            className="w-full sm:w-auto rounded-[3.75px] border-2 border-[#e3e2e2] bg-black px-6 py-3 text-[13px] font-bold uppercase text-white transition-colors hover:bg-[#1a1a1a]"
          >
            Manage Your Cookies
          </button>
          <button
            type="button"
            onClick={() => choose("decline")}
            className="w-full sm:w-auto rounded-[3.75px] border-2 border-[#1032cf] bg-white px-6 py-3 text-[13px] font-bold uppercase text-[#141414] transition-opacity hover:opacity-90"
          >
            Decline All Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
