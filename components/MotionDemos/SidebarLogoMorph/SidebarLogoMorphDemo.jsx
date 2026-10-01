"use client";

// Renders the ORIGINAL brand sidemenu from the platform MF (./original, verbatim apart from
// import lines and one marked default in utils/themePreference.js), starting collapsed. Hover
// the logo and it dissolves into the expand button; click it and the menu widens, the labels
// un-blur, and the collapse button takes the logo's place. Nav items are the real BrandLayout
// list; the platform API is a fake agent (./original/superagent/platformAgent.js). Toasts (e.g.
// the "coming soon" one on Notifications) render in the page's shared ToasterContainer.
import { useEffect, useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { Icons } from "@adtraction/ui-icons";
import { DemoButton, DemoStage } from "../DemoStage";
import BrandSidemenu from "./original/components/brand/sidemenu/BrandSidemenu";
import { PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY } from "./original/utils/partnerSidemenuPreference";
import styles from "./SidebarLogoMorphDemo.module.scss";

// Verbatim from adtraction-web-main BrandLayout.jsx (brand user with Discover access).
const brandMenuItems = [
  { url: "/dashboard", translationKey: "sidemenu.dashboard", label: "Home", icon: Icons.General.Home05 },
  { url: "/insights", translationKey: "sidemenu.insights", label: "Insights", icon: Icons.Chart.Pie02 },
  { url: "/discover", translationKey: "sidemenu.discover", label: "Discover", icon: Icons.Alert.Announcement01 },
  { url: "/my-brand", translationKey: "sidemenu.mybrand", label: "My brand", icon: Icons.Custom.Brand }
];

// The sidemenu reads its collapsed state from localStorage on mount, like the platform does.
const startCollapsed = () => {
  try {
    localStorage.setItem(PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY, "true");
  } catch {}
};

// Below 769px the platform swaps the sidemenu for a fixed bottom bar, which would cover this page.
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
};

export function SidebarLogoMorphDemo() {
  const [menuKey, setMenuKey] = useState(() => {
    startCollapsed();
    return 0;
  });
  const isDesktop = useIsDesktop();

  useEffect(
    () => () => {
      try {
        localStorage.removeItem(PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY);
      } catch {}
      document.documentElement.removeAttribute("data-partner-sidemenu-collapsed");
    },
    []
  );

  const reset = () => {
    startCollapsed();
    setMenuKey((k) => k + 1);
  };

  return (
    <div className="adtraction-demo">
      <DemoStage controls={<DemoButton onClick={reset}>Collapse again</DemoButton>}>
        {isDesktop ? (
          <div className={styles.frame}>
            <div className={styles.sidemenu_slot}>
              <BrandSidemenu
                key={menuKey}
                menuItems={brandMenuItems}
                userEmail="brand@example.com"
                programName="Nordic Outdoor"
                status={{ description: "All systems operational", indicator: "none" }}
                userID={100200}
                searchablePages={[]}
                entitySearchEnabled={false}
              />
            </div>
            <div className={styles.page} aria-hidden="true" />
          </div>
        ) : (
          <p className={styles.notice}>Open this demo on a wider screen to see the desktop sidemenu.</p>
        )}
      </DemoStage>
    </div>
  );
}
