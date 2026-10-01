"use client";

// Renders the ORIGINAL platform global search (./original): the sidemenu search bar, the
// ⌘K command-center modal with its height morph, grouped page/partner/channel results and
// the three loading stages (nothing for fast searches, a progress bar after 400 ms, a
// "still searching" line after 2.5 s). Only the backend is faked: ./fakeSearchAgent answers
// with fictional partners and channels after the latency picked below.
import { useCallback, useMemo, useRef, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { ToasterContainer } from "@adtraction/ui-components";
import { UserRoleContext } from "@adtraction/util-providers";
import { CLIENT_PRIVILEGES } from "@adtraction/util-constants";
import { DemoButton, DemoStage } from "../DemoStage";
import { GlobalSearch } from "./original/components/globalsearch/GlobalSearch";
import { filterSearchableBrandPages } from "./original/search/searchableBrandPages";
import platformAgent, { setFakeSearchLatency } from "./fakeSearchAgent";
import styles from "./GlobalSearchDemo.module.scss";

const LATENCIES = [
  { ms: 150, label: "Fast (150 ms)" },
  { ms: 1200, label: "Slow (1.2 s)" },
  { ms: 4000, label: "Very slow (4 s)" },
];

// A brand user with Discover + price access, as BrandLayout would pass it.
const USER_ROLE = {
  user: "AdvertiserUser",
  privileges: [
    CLIENT_PRIVILEGES.SHOW_CHANNEL_DIRECTORY,
    CLIENT_PRIVILEGES.SHOW_SEGMENT_INFO_AFFILIATES,
    CLIENT_PRIVILEGES.SHOW_COMMISSION,
  ],
  countryPrivileges: ["1"],
  userInfo: { userId: "portfolio-demo" },
  loadUser: () => {},
  updateUser: () => {},
  isOnTakeoverLoginPage: false,
  isTakeoverSession: false,
};

export function GlobalSearchDemo() {
  const [latency, setLatency] = useState(LATENCIES[0].ms);
  const scopeRef = useRef(null);

  const searchablePages = useMemo(
    () => filterSearchableBrandPages({ canAccessDiscover: true, hasPriceAccess: true, canEditPrice: true }),
    []
  );

  // ⌘K only belongs to the demo while the pointer or focus is inside it.
  const isShortcutInScope = useCallback(() => {
    const el = scopeRef.current;
    if (!el) return false;
    return el.matches(":hover") || el.contains(document.activeElement);
  }, []);

  const pickLatency = (ms) => {
    setLatency(ms);
    setFakeSearchLatency(ms);
  };

  return (
    <DemoStage
      caption="The original component, live. Open it from the bar (or hover here and press ⌘K / Ctrl K), type a few letters such as “deals” or “media”, and move with the arrow keys, Enter and Escape. Pick a latency to see each loading stage: nothing under 400 ms, a progress bar after that, and a calm “Still searching…” line from 2.5 s."
      controls={LATENCIES.map(({ ms, label }) => (
        <DemoButton key={ms} pressed={latency === ms} onClick={() => pickLatency(ms)}>
          {label}
        </DemoButton>
      ))}>
      <div ref={scopeRef} className={`adtraction-demo ${styles.stage}`}>
        <UserRoleContext.Provider value={USER_ROLE}>
          <div className={styles.bar}>
            <GlobalSearch
              userRoleOverride="AdvertiserUser"
              getCountries={platformAgent.getBrandSelectCountries}
              searchablePages={searchablePages}
              entitySearchEnabled
              isShortcutInScope={isShortcutInScope}
            />
          </div>
        </UserRoleContext.Provider>
        <ToasterContainer />
      </div>
    </DemoStage>
  );
}
