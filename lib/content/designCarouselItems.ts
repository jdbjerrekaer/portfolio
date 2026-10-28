import type { CarouselItem } from "@/components/DesignCarousel";
import { resolveAssetSrc } from "@/lib/utils/paths";

export const designCarouselItems: CarouselItem[] = [
  { 
    kind: "desktop", 
    label: "LeadPlatform Hero", 
    tooltip: "LEADPLATFORM: All-in-one Lead Generation", 
    image: resolveAssetSrc("/projects/leadplatform/hero.png"),
    description: "Hero section of LeadPlatform showcasing the all-in-one gamified lead generation platform combining quizzes, contests, calendars, and memory games."
  },
  {
    kind: "iphone", 
    label: "Count Down",
    tooltip: "COUNTDOWN: Count Down",
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-count-down.png"),
    description: "The current App Store presentation showing upcoming moments and the time remaining for each event."
  },
  {
    kind: "desktop",
    label: "Cramer Chat",
    tooltip: "CRAMER: AI for SaaS",
    image: resolveAssetSrc("/projects/cramer-ai-assistant/before-after/after-overview-1005.jpg"),
    description: "Adtraction's internal AI assistant rebuilt on the company UI toolkit: platform side nav, a chat list with Pinned and Recent groups, and a floating composer."
  },
  {
    kind: "iphone",
    label: "Auto Next Mobile",
    tooltip: "AUTO NEXT: Garage Website",
    image: resolveAssetSrc("/images/auto-next-viborg/final-home-mobile.jpg"),
    description: "A first website for a small CarSpot workshop in Viborg: the phone number as a Danish number plate and a fixed Ring and Rute bar on the phone."
  },
  {
    kind: "desktop",
    label: "YADL Features",
    tooltip: "YADL: Yet Another Design Linter",
    image: resolveAssetSrc("/projects/yadl/hero-features.jpg"),
    description: "YADL’s Figma Community presentation introducing the plugin and the design-system issues it checks."
  },
  {
    kind: "iphone", 
    label: "Iriz Brand Page", 
    tooltip: "IRIZ: Brand Page", 
    image: resolveAssetSrc("/projects/iriz/cover.jpg"),
    description: "Mobile brand page interface for Iriz influencer affiliate marketing platform, featuring social media platform integration and earnings display."
  },
  {
    kind: "desktop",
    label: "Karate Club Rebuild",
    tooltip: "VIBORG KARATE SKOLE: Website",
    image: resolveAssetSrc("/images/viborg/vks-after-home.jpg"),
    description: "The rebuilt website for a karate club founded in 1975, made with the club's own words, photos and press archive."
  },
  {
    kind: "iphone", 
    label: "Style It",
    tooltip: "COUNTDOWN: Style It",
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-style-it.png"),
    description: "The current App Store presentation showing contextual emoji suggestions and color customization."
  },
  {
    kind: "desktop",
    label: "Indkøb Agent",
    tooltip: "INDKØB: Grocery Price Agent",
    image: resolveAssetSrc("/projects/indkob-grocery-agent/cover.jpg"),
    description: "A grocery price agent that annotates an Apple Reminders list with the best current offer, the store as a geofence and the offer expiry as the due date."
  },
  {
    kind: "iphone",
    label: "Gym Mobile",
    tooltip: "VIBORG MOTIONSCENTER: Website",
    image: resolveAssetSrc("/images/viborg/vmc-after-home-mobile.jpg"),
    description: "A gym website for readers over 60 on a phone: the call button first, then the hours and directions."
  },
  { 
    kind: "desktop", 
    label: "Adtraction Brand Page", 
    tooltip: "ADTRACTION: Brand Page", 
    image: resolveAssetSrc("/projects/adtraction/brand-page-desktop.png"),
    description: "Detailed brand page showing commission rates, tracking links, and performance metrics for affiliate partners."
  },
  { 
    kind: "iphone", 
    label: "Count Up",
    tooltip: "COUNTDOWN: Count Up",
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-count-up.png"),
    description: "The current App Store presentation showing a home screen widget counting up a meaningful milestone."
  },
  {
    kind: "desktop",
    label: "Archive Autopost",
    tooltip: "VKS ARCHIVE: Agent-Run Posting",
    image: resolveAssetSrc("/projects/vks-archive-autopost/cover.jpg"),
    description: "A pipeline that turns a karate club's 50-year archive into approved, scheduled Instagram and Facebook posts."
  },
  {
    kind: "iphone",
    label: "Cramer Mobile",
    tooltip: "CRAMER: Mobile Chat",
    image: resolveAssetSrc("/projects/cramer-ai-assistant/before-after/after-mobile-chat-1005b.jpg"),
    description: "The rebuilt Cramer chat on a phone, with a back-to-chats header, a stats badge and an icon-only table toolbar."
  },
  {
    kind: "desktop",
    label: "Cramer Dark Mode",
    tooltip: "CRAMER: Dark Mode",
    image: resolveAssetSrc("/projects/cramer-ai-assistant/before-after/after-dark.jpg"),
    description: "Cramer in the platform's dark theme across side nav, chat list, table and info box."
  },
  { 
    kind: "iphone", 
    label: "Shape It",
    tooltip: "COUNTDOWN: Shape It",
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-shape-it.png"),
    description: "The current App Store presentation showing the available icon container shapes for each countdown."
  },
  {
    kind: "desktop",
    label: "YADL Design-System QA",
    tooltip: "YADL: Less Pixel Policing",
    image: resolveAssetSrc("/projects/yadl/hero-tagline.jpg"),
    description: "YADL’s Figma Community presentation summarizing its goal: less pixel policing and more consistency."
  },
];
