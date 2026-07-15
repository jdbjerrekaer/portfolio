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
    label: "YADL Features",
    tooltip: "YADL: Yet Another Design Linter",
    image: resolveAssetSrc("/projects/yadl/hero-features.jpg"),
    description: "YADL’s Figma Community presentation introducing the plugin and the design-system issues it checks."
  },
  { 
    kind: "desktop", 
    label: "Brand Page", 
    tooltip: "ADTRACTION: Brand Page", 
    image: resolveAssetSrc("/projects/adtraction/brand-page-desktop.png"),
    description: "Detailed brand page showing commission rates, tracking links, and performance metrics for affiliate partners."
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
    label: "YADL Variable Collections",
    tooltip: "YADL: Variable Collections",
    image: resolveAssetSrc("/projects/yadl/variable-collections.jpg"),
    description: "YADL’s Figma Community presentation showing variable collections, modes, libraries, and collection controls."
  },
  { 
    kind: "iphone", 
    label: "Mobile Dashboard", 
    tooltip: "ADTRACTION: Mobile Dashboard", 
    image: resolveAssetSrc("/projects/affiliate-marketing-mobile/cover.png"),
    description: "Mobile dashboard for affiliate marketers to track campaigns, manage partnerships, and monitor performance on the go."
  },
  { 
    kind: "desktop", 
    label: "Brands Directory", 
    tooltip: "ADTRACTION: Brands Directory", 
    image: resolveAssetSrc("/projects/adtraction/brands-page-desktop.png"),
    description: "Comprehensive directory of affiliate brands with filtering options, commission rates, and EPC metrics for partner discovery."
  },
  { 
    kind: "iphone", 
    label: "Count Up",
    tooltip: "COUNTDOWN: Count Up",
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-count-up.png"),
    description: "The current App Store presentation showing a home screen widget counting up a meaningful milestone."
  },
  { 
    kind: "iphone", 
    label: "Brand Page", 
    tooltip: "IRIZ: Brand Page", 
    image: resolveAssetSrc("/projects/iriz/cover.png"),
    description: "Mobile brand page interface for Iriz influencer affiliate marketing platform, featuring social media platform integration and earnings display."
  },
  { 
    kind: "desktop", 
    label: "Brand Settings Overview", 
    tooltip: "ADTRACTION: Brand Settings Overview", 
    image: resolveAssetSrc("/projects/adtraction/brand-settings-overview.png"),
    description: "Centralized brand management interface for customizing brand presence, managing partner access, financial settings, and commission structures."
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
    label: "YADL Welcome",
    tooltip: "YADL: Getting Started",
    image: resolveAssetSrc("/projects/yadl/welcome.jpg"),
    description: "YADL’s Figma Community presentation showing the three-step getting-started flow."
  },
  { 
    kind: "iphone", 
    label: "Product Link", 
    tooltip: "IRIZ: Link Generation", 
    image: resolveAssetSrc("/projects/iriz/product-link-1.png"),
    description: "Product link generation interface allowing influencers to create and copy affiliate links for different social media platforms with platform-specific commission rates."
  },
  { 
    kind: "desktop", 
    label: "Affiliate Dashboard", 
    tooltip: "ADTRACTION: Affiliate Dashboard", 
    image: resolveAssetSrc("/projects/affiliate-marketing-web/cover.png"),
    description: "Web-based dashboard for managing affiliate programs, tracking conversions, and analyzing marketing performance with real-time metrics."
  },
  { 
    kind: "desktop",
    label: "YADL Errors",
    tooltip: "YADL: Errors List",
    image: resolveAssetSrc("/projects/yadl/errors-list.jpg"),
    description: "YADL’s Figma Community presentation showing grouped issues, smart suggestions, and responsive labels."
  },
  { 
    kind: "iphone", 
    label: "Product Detail", 
    tooltip: "IRIZ: Product Page", 
    image: resolveAssetSrc("/projects/iriz/product-link-2.png"),
    description: "Product detail page showing brand information, product details, and options to generate affiliate links for sharing on social media platforms."
  },
  { 
    kind: "desktop", 
    label: "Platform Design UI Tokens", 
    tooltip: "Figma Component Library: Platform Design UI Tokens 'n Components", 
    image: resolveAssetSrc("/projects/figma-component-library/cover.png"),
    description: "Comprehensive design system and component library featuring UI tokens, reusable components, and consistent design patterns for scalable product development."
  },
  { 
    kind: "iphone", 
    label: "Lock Screen", 
    tooltip: "COUNTDOWN: Lock Screen Widget", 
    image: resolveAssetSrc("/projects/yet-another-countdown/appstore-lock-screen.png"),
    description: "The current App Store presentation showing a countdown kept visible on the lock screen."
  },
  {
    kind: "desktop",
    label: "YADL Responsive Layout",
    tooltip: "YADL: Small Screen Compatible",
    image: resolveAssetSrc("/projects/yadl/small-screen-compatible.jpg"),
    description: "YADL’s Figma Community presentation showing the linting interface at narrow and wide plugin sizes."
  },
  {
    kind: "desktop",
    label: "YADL Enabled Variables",
    tooltip: "YADL: View Enabled Variables",
    image: resolveAssetSrc("/projects/yadl/enabled-variables.jpg"),
    description: "YADL’s Figma Community presentation showing enabled variables, category filters, and token swatches."
  },
  {
    kind: "desktop",
    label: "YADL Design-System QA",
    tooltip: "YADL: Less Pixel Policing",
    image: resolveAssetSrc("/projects/yadl/hero-tagline.jpg"),
    description: "YADL’s Figma Community presentation summarizing its goal: less pixel policing and more consistency."
  },
];
