export interface WritingPost {
  title: string;
  url: string;
  summary: string;
  category: string;
  tags: string[];
}

export const writingPosts: WritingPost[] = [
  {
    title: "How to Implement Magento 2 Tracking Extensions",
    url: "https://www.adservice.com/blog/article/adservices-magento-tracking-extension-has-arrived",
    summary: "Technical walkthrough of our Magento 2 tracking extension, covering setup, configuration, and common pitfalls in event-based tracking.",
    category: "Technical Depth",
    tags: ["Magento 2", "Tracking", "E-commerce"],
  },
  {
    title: "Shopify Tracking Implementations",
    url: "https://www.adservice.com/blog/article/new-shopify-plugin-update",
    summary: "Detailed documentation on our new Shopify plugin to streamline merchant onboarding and ensure accurate conversion tracking.",
    category: "Technical Depth",
    tags: ["Technical Writing", "E-commerce Integration"],
  },
  {
    title: "Google Ads Integration",
    url: "https://www.adservice.com/blog/article/updated-google-ads-tool",
    summary: "Deep dive into our Google Ads integration tooling and how we designed it to reduce manual setup errors for partners.",
    category: "Technical Depth",
    tags: ["Google Ads", "Integration", "Developer Experience"],
  },
  {
    title: "Case Study: MioMio",
    url: "https://www.adservice.com/blog/article/case-miomio-16000-unikke-besgende-til-miomios-webshop",
    summary: "A retail campaign case study focused on measurable growth and conversion quality.",
    category: "Product Strategy",
    tags: ["Campaign Design", "Retail Media", "Conversion Quality"],
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
    summary: "A practical guide to increasing online visibility, written for merchants who pay only on results.",
    category: "Product Strategy",
    tags: ["Online Marketing", "Performance", "Partner Enablement"],
  },
];
