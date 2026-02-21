import type { CarouselItem } from "@/components/DesignCarousel";
import { withBasePath } from "@/lib/utils/paths";

export const designCarouselItems: CarouselItem[] = [
  { 
    kind: "desktop", 
    label: "LeadPlatform Hero", 
    tooltip: "LEADPLATFORM: All-in-one Lead Generation", 
    image: withBasePath("/projects/leadplatform/hero.png"),
    description: "Hero section of LeadPlatform showcasing the all-in-one gamified lead generation platform combining quizzes, contests, calendars, and memory games."
  },
  { 
    kind: "iphone", 
    label: "Countdown Home", 
    tooltip: "COUNTDOWN: Event List", 
    image: withBasePath("/projects/countdown/home-list-light.png"),
    description: "Main countdown list showing upcoming events with emoji icons, time remaining, and recurring event badges."
  },
  { 
    kind: "desktop", 
    label: "Brand Page", 
    tooltip: "ADTRACTION: Brand Page", 
    image: withBasePath("/projects/adtraction/brand-page-desktop.png"),
    description: "Detailed brand page showing commission rates, tracking links, and performance metrics for affiliate partners."
  },
  { 
    kind: "iphone", 
    label: "Drag Reorder", 
    tooltip: "COUNTDOWN: Drag to Reorder", 
    image: withBasePath("/projects/countdown/drag-reorder-light.png"),
    description: "Drag-and-drop reordering with smooth animations and careful transform handling for a physical, confident interaction."
  },
  { 
    kind: "iphone", 
    label: "Mobile Dashboard", 
    tooltip: "ADTRACTION: Mobile Dashboard", 
    image: withBasePath("/projects/affiliate-marketing-mobile/cover.png"),
    description: "Mobile dashboard for affiliate marketers to track campaigns, manage partnerships, and monitor performance on the go."
  },
  { 
    kind: "desktop", 
    label: "Brands Directory", 
    tooltip: "ADTRACTION: Brands Directory", 
    image: withBasePath("/projects/adtraction/brands-page-desktop.png"),
    description: "Comprehensive directory of affiliate brands with filtering options, commission rates, and EPC metrics for partner discovery."
  },
  { 
    kind: "iphone", 
    label: "Edit Event", 
    tooltip: "COUNTDOWN: Edit Event", 
    image: withBasePath("/projects/countdown/edit-event-light.png"),
    description: "Event editing screen with emoji picker, color customization slider, repeat yearly toggle, and inline calendar for date selection."
  },
  { 
    kind: "iphone", 
    label: "Brand Page", 
    tooltip: "IRIZ: Brand Page", 
    image: withBasePath("/projects/iriz/cover.png"),
    description: "Mobile brand page interface for Iriz influencer affiliate marketing platform, featuring social media platform integration and earnings display."
  },
  { 
    kind: "desktop", 
    label: "Brand Settings Overview", 
    tooltip: "ADTRACTION: Brand Settings Overview", 
    image: withBasePath("/projects/adtraction/brand-settings-overview.png"),
    description: "Centralized brand management interface for customizing brand presence, managing partner access, financial settings, and commission structures."
  },
  { 
    kind: "iphone", 
    label: "Small Widget", 
    tooltip: "COUNTDOWN: Small Widget", 
    image: withBasePath("/projects/countdown/widget-small-light.png"),
    description: "Native iOS small widget showing a single countdown with emoji badge, event title, next date, and days remaining."
  },
  { 
    kind: "iphone", 
    label: "Product Link", 
    tooltip: "IRIZ: Link Generation", 
    image: withBasePath("/projects/iriz/product-link-1.png"),
    description: "Product link generation interface allowing influencers to create and copy affiliate links for different social media platforms with platform-specific commission rates."
  },
  { 
    kind: "desktop", 
    label: "Affiliate Dashboard", 
    tooltip: "ADTRACTION: Affiliate Dashboard", 
    image: withBasePath("/projects/affiliate-marketing-web/cover.png"),
    description: "Web-based dashboard for managing affiliate programs, tracking conversions, and analyzing marketing performance with real-time metrics."
  },
  { 
    kind: "iphone", 
    label: "Large Widget", 
    tooltip: "COUNTDOWN: Large Widget", 
    image: withBasePath("/projects/countdown/widget-large-light.png"),
    description: "Native iOS large widget with expanded countdown display showing days, hours, minutes, and seconds in a grid layout."
  },
  { 
    kind: "iphone", 
    label: "Product Detail", 
    tooltip: "IRIZ: Product Page", 
    image: withBasePath("/projects/iriz/product-link-2.png"),
    description: "Product detail page showing brand information, product details, and options to generate affiliate links for sharing on social media platforms."
  },
  { 
    kind: "desktop", 
    label: "Platform Design UI Tokens", 
    tooltip: "Figma Component Library: Platform Design UI Tokens 'n Components", 
    image: withBasePath("/projects/figma-component-library/cover.png"),
    description: "Comprehensive design system and component library featuring UI tokens, reusable components, and consistent design patterns for scalable product development."
  },
  { 
    kind: "iphone", 
    label: "Classic Widget", 
    tooltip: "COUNTDOWN: Classic Widget", 
    image: withBasePath("/projects/countdown/widget-classic-light.png"),
    description: "Native iOS widget with classic flip-clock inspired digit display for a nostalgic countdown experience."
  },
  { 
    kind: "iphone", 
    label: "Ad-Free Upgrade", 
    tooltip: "COUNTDOWN: Go Ad-Free", 
    image: withBasePath("/projects/countdown/ad-free-upgrade.png"),
    description: "One-time purchase screen offering ad removal with optional supporter tier, featuring restore purchases and transparent pricing."
  },
];

