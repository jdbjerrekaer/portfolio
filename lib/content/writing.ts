export interface WritingPost {
  title: string;
  url: string;
  summary: string;
  category: string;
  tags: string[];
}

export const writingPosts: WritingPost[] = [
  {
    title: "Adservice's Magento Tracking Extension has arrived!",
    url: "/writing/adservice/adservices-magento-tracking-extension-has-arrived/",
    summary: "Launch announcement for the Adservice Magento tracking extension: what it does, how it reports affiliate conversions from a Magento store, and where to install it.",
    category: "Technical Depth",
    tags: ["Magento 2", "Tracking", "E-commerce"],
  },
  {
    title: "Shopify app has Arrived!",
    url: "/writing/adservice/new-shopify-plugin-update/",
    summary: "Launch announcement for the Adservice Shopify tracking app, explaining how it reports affiliate sales and basket value from a Shopify shop back to Adservice.",
    category: "Technical Depth",
    tags: ["Technical Writing", "E-commerce Integration"],
  },
  {
    title: "Updated Google Ads Tool",
    url: "/writing/adservice/updated-google-ads-tool/",
    summary: "Release note for the updated Google Ads tool with API 15 support: a three-step setup that connects Google Ads, adds the Adservice script and feeds conversions back as income.",
    category: "Technical Depth",
    tags: ["Google Ads", "Integration", "Developer Experience"],
  },
  {
    title: "Case MIOMIO: 16.000 Unikke besøgende til MIOMIO’s webshop",
    url: "/writing/adservice/case-miomio-16000-unikke-besgende-til-miomios-webshop/",
    summary: "Danish case study on MIOMIO’s first two months of affiliate marketing with Adservice: 16,000+ unique visitors and 1,250 sales on a pay-per-sale model.",
    category: "Product Strategy",
    tags: ["Campaign Design", "Retail Media", "Conversion Quality"],
  },
  {
    title: "9 hurtige tricks til at optimere din webshop for at øge dine salg",
    url: "/writing/adservice/affiliate-marketing-en-win-win-situation/",
    summary: "Danish guide for webshop owners on growing sales through affiliate marketing: picking a network, setting incentives, choosing affiliates and building long-term partnerships.",
    category: "Product Strategy",
    tags: ["Product Strategy", "Affiliate Marketing"],
  },
  {
    title: "Vil du nå flere kunder?",
    url: "/writing/adservice/vil-du-n-flere-kunder-ge-din-eksponering-online-og-kun-betale-pr-salg/",
    summary: "Danish overview of who uses affiliate marketing (NGOs, telecom, finance, e-commerce) and why a pay-per-sale model works as a supplement to Google Ads.",
    category: "Product Strategy",
    tags: ["Online Marketing", "Performance", "Partner Enablement"],
  },
];
