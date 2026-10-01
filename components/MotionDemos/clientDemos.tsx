"use client";

// Demos render in the browser only. Server-rendering them streamed the toolkit's lazy
// icons as late Suspense segments; resolving those on the first interaction re-rendered
// the page (white flash on the first click). The placeholder holds each demo's height.
import dynamic from "next/dynamic";
import "./adtraction/tippyDefaults";

const placeholder = (minHeight: number) =>
  function DemoPlaceholder() {
    return (
      <div
        aria-hidden="true"
        style={{
          minHeight,
          margin: "2rem 0",
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          background: "var(--color-background)",
        }}
      />
    );
  };

export const KeyMetricDemo = dynamic(() => import("./KeyMetric/KeyMetricDemo").then((m) => m.KeyMetricDemo), {
  ssr: false,
  loading: placeholder(330),
});
export const ErrorStateDemo = dynamic(() => import("./ErrorState/ErrorStateDemo").then((m) => m.ErrorStateDemo), {
  ssr: false,
  loading: placeholder(520),
});
export const LargeSwiperDemo = dynamic(() => import("./LargeSwiper/LargeSwiperDemo").then((m) => m.LargeSwiperDemo), {
  ssr: false,
  loading: placeholder(240),
});
export const GetStartedChecklistDemo = dynamic(
  () => import("./GetStartedChecklist/GetStartedChecklistDemo").then((m) => m.GetStartedChecklistDemo),
  { ssr: false, loading: placeholder(560) }
);
export const FlipListDemo = dynamic(() => import("./FlipList/FlipListDemo").then((m) => m.FlipListDemo), {
  ssr: false,
  loading: placeholder(600),
});
export const LoadRevealDemo = dynamic(() => import("./LoadReveal/LoadRevealDemo").then((m) => m.LoadRevealDemo), {
  ssr: false,
  loading: placeholder(500),
});
export const ScrollShadowDemo = dynamic(() => import("./ScrollShadow/ScrollShadowDemo").then((m) => m.ScrollShadowDemo), {
  ssr: false,
  loading: placeholder(420),
});
export const CopyMorphDemo = dynamic(() => import("./CopyMorph/CopyMorphDemo").then((m) => m.CopyMorphDemo), {
  ssr: false,
  loading: placeholder(260),
});
export const StaggerDemo = dynamic(() => import("./StaggerEntrances/StaggerDemo").then((m) => m.StaggerDemo), {
  ssr: false,
  loading: placeholder(420),
});
export const TableDemo = dynamic(() => import("./TableDemo/TableDemo").then((m) => m.TableDemo), {
  ssr: false,
  loading: placeholder(600),
});
export const TooltipTimingDemo = dynamic(() => import("./TooltipTiming/TooltipTimingDemo").then((m) => m.TooltipTimingDemo), {
  ssr: false,
  loading: placeholder(200),
});
export const BrandPeekDemo = dynamic(() => import("./BrandPeek/BrandPeekDemo").then((m) => m.BrandPeekDemo), {
  ssr: false,
  loading: placeholder(260),
});
export const MultiSelectBadgesDemo = dynamic(
  () => import("./MultiSelectBadges/MultiSelectBadgesDemo").then((m) => m.MultiSelectBadgesDemo),
  { ssr: false, loading: placeholder(160) }
);
export const GlobalSearchDemo = dynamic(() => import("./GlobalSearch/GlobalSearchDemo").then((m) => m.GlobalSearchDemo), {
  ssr: false,
  loading: placeholder(220),
});
export const SidePanelResizeDemo = dynamic(() => import("./SidePanelResize/SidePanelResizeDemo").then((m) => m.SidePanelResizeDemo), {
  ssr: false,
  loading: placeholder(120),
});
export const SidebarLogoMorphDemo = dynamic(() => import("./SidebarLogoMorph/SidebarLogoMorphDemo").then((m) => m.SidebarLogoMorphDemo), {
  ssr: false,
  loading: placeholder(680),
});
