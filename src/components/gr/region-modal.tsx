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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="gr-shadow-elevated w-full max-w-[560px] rounded-[6px] bg-[#1a1a1a] p-8 md:p-10 text-center">
        <h2 className="text-[22px] md:text-[27.2px] font-bold leading-tight text-white">
          IT LOOKS LIKE YOU'RE IN NORTH AMERICA
        </h2>
        <p className="mt-4 text-[18px] md:text-[25.6px] font-bold leading-tight text-[#d0d0d0]">
          DO YOU WANT TO VISIT THE US SITE?
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={dismiss}
            className="gr-btn gr-btn-light w-full sm:w-auto whitespace-nowrap"
          >
            Go to US Site
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="w-full sm:w-auto whitespace-nowrap rounded-[4px] border-2 border-[rgba(77,77,77,0.4)] bg-[#1f1f1f] px-6 py-[15px] text-[16px] md:text-[18px] font-bold uppercase text-[#d0d0d0] transition-colors hover:bg-[#303030]"
          >
            Continue to UK Site
          </button>
        </div>
      </div>
    </div>
  );
}
