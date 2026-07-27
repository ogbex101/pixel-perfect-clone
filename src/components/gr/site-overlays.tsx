import { useEffect, useState } from "react";
import { RegionModal } from "@/components/gr/region-modal";
import { CookieConsent } from "@/components/gr/cookie-consent";

const REGION_KEY = "gr-region-modal-dismissed";

export function SiteOverlays() {
  const [regionDismissed, setRegionDismissed] = useState(true);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem(REGION_KEY);
    setRegionDismissed(Boolean(dismissed));
  }, []);

  return (
    <>
      <RegionModal onDismiss={() => setRegionDismissed(true)} />
      {regionDismissed && <CookieConsent />}
    </>
  );
}
