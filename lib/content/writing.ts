export interface BlogPost {
  title: string;
  url: string;
  summary: string;
  category: "Technical Depth" | "Design-Engineering Bridge" | "Product Strategy" | "Marketing";
  tags: string[];
}

export const writingPosts: BlogPost[] = [
  {
    title: "How to Implement Magento 2 Tracking Extensions",
    url: "https://www.adservice.com/blog/article/adservices-magento-tracking-extension-has-arrived",
    summary: "A technical guide that reduced implementation errors and became the team's reference doc for Magento 2 integration.",
    category: "Technical Depth",
    tags: ["Technical Writing", "E-commerce Integration"],
  },
  {
    title: "Shopify Tracking Implementations",
    url: "https://www.adservice.com/blog/article/new-shopify-plugin-update",
    summary: "Detailed documentation on our new Shopify plugin to streamline merchant onboarding and ensure accurate conversion tracking.",
    category: "Technical Depth",
    tags: ["Technical Writing", "Product Strategy"],
  },
  {
    title: "Google Ads Integration",
    url: "https://www.adservice.com/blog/article/updated-google-ads-tool",
    summary: "A technical deep-dive on bridging Adservice's conversion tracking with Google Ads seamlessly.",
    category: "Technical Depth",
    tags: ["Technical Writing", "AdTech"],
  },
  {
    title: "Case Study: MioMio",
    url: "https://www.adservice.com/blog/article/case-miomio-16000-unikke-besgende-til-miomios-webshop",
    summary: "How cross-functional coordination and technical optimization drove 16,000 unique visitors to a client's webshop.",
    category: "Design-Engineering Bridge",
    tags: ["Product Strategy", "Case Study"],
  },
  {
    title: "Affiliate Marketing: A Win-Win Situation",
    url: "https://www.adservice.com/blog/article/affiliate-marketing-en-win-win-situation",
    summary: "An overview of how we design advertiser interfaces that align incentives for all parties involved.",
    category: "Product Strategy",
    tags: ["Product Strategy", "Affiliate Marketing"],
  },
  {
    title: "Increase Online Exposure",
    url: "https://www.adservice.com/blog/article/vil-du-n-flere-kunder-ge-din-eksponering-online-og-kun-betale-pr-salg",
    summary: "Strategic insights into reaching more customers and maximizing ROI through affiliate networks.",
    category: "Marketing",
    tags: ["Product Strategy"],
  }
];