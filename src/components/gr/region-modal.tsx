import { useEffect, useState } from "react";

const STORAGE_KEY = "gr-region-modal-dismissed";

export function RegionModal({ onDismiss }: { onDismiss?: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && window.sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-[2px]">
      <div className="gr-shadow-elevated gr-fade-in w-full max-w-[560px] border border-[color:var(--gr-hairline-faint)] bg-[color:var(--gr-surface)] p-9 text-center md:p-12">
        <p className="gr-eyebrow">Welcome</p>
        <h2 className="gr-h2 mt-4 text-[color:var(--gr-ivory)]">
          It looks like you're in North America
        </h2>
        <div className="gr-rule-center my-6" />
        <p className="text-[15px] text-[color:var(--gr-muted)]">
          Would you like to visit the US site instead?
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button type="button" onClick={dismiss} className="gr-btn-solid w-full sm:w-auto">
            Go to US Site
          </button>
          <button type="button" onClick={dismiss} className="gr-btn-ghost w-full sm:w-auto">
            Continue to UK Site
          </button>
        </div>
      </div>
    </div>
  );
}
