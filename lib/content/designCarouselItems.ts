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
    label: "Countdown Moments", 
    tooltip: "COUNTDOWN: Moments List", 
    image: withBasePath("/projects/yet-another-countdown/appstore-list.png"),
    description: "Current App Store presentation showing the main countdown list with polished event cards, ad-free state, and upcoming moments."
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
    label: "Create Countdown", 
    tooltip: "COUNTDOWN: Create Countdown", 
    image: withBasePath("/projects/yet-another-countdown/appstore-add.png"),
    description: "Current event creation flow with emoji selection, color customization, and an inline calendar for setting the target date."
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
    label: "Calendar Import", 
    tooltip: "COUNTDOWN: Calendar Import", 
    image: withBasePath("/projects/yet-another-countdown/appstore-calendar.png"),
    description: "Calendar import flow for pulling recurring birthdays and events into the countdown list without manual entry."
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
    label: "Home Widgets", 
    tooltip: "COUNTDOWN: Home Screen Widgets", 
    image: withBasePath("/projects/yet-another-countdown/appstore-widgets.jpg"),
    description: "Current widget presentation showing small and medium home screen widgets for quickly checking important countdowns."
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
    label: "Widget Styles", 
    tooltip: "COUNTDOWN: Widget Styles", 
    image: withBasePath("/projects/yet-another-countdown/appstore-styles.png"),
    description: "Current widget customization screen with size, style, appearance, and preview controls."
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
    label: "Lock Screen", 
    tooltip: "COUNTDOWN: Lock Screen Widget", 
    image: withBasePath("/projects/yet-another-countdown/appstore-lockscreen.jpg"),
    description: "Current lock screen widget presentation that keeps a selected countdown visible without opening the app."
  },
];
