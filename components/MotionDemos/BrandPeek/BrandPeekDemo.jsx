"use client";

// Renders the ORIGINAL brands BrandDescription (./original, verbatim apart from one import line):
// resting on the clamped text expands it after a 400 ms grace period, holding near the bottom edge
// reveals 56 px more every 600 ms, leaving starts a 400 ms cooldown and a 500 ms delayed collapse.
// Clicking opens the side panel, where the promotional-rules scroll hint blurs in and out.
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { DemoStage } from "../DemoStage";
import { BrandDescription } from "./original/BrandDescription";

// Fake brand copy and promotional rules (the API returns HTML for both). Plain paragraphs only: the
// side panel portals to <body>, outside the demo scope, where the portfolio's own h3/ul styles apply.
const OUTDOOR_DESCRIPTION = `
<p>Fjällgården makes outdoor clothing for long days in changing weather. Everything is designed in Umeå and tested on the trails around the Bothnian coast before it reaches the shop.</p>
<p>The range covers shell jackets, insulated layers, merino base layers and trekking trousers for men, women and kids, plus a growing line of packs and accessories. Most pieces are made from recycled or bluesign-approved fabrics, and every garment comes with free repairs for life.</p>
<p>Our customers are hikers, commuters and families who want gear that lasts more than a season. Average order value is highest in autumn, when the new insulation range lands, and around the spring hiking season.</p>
<p>Partners get seasonal campaign material, product feeds updated daily, exclusive codes for content partners with an outdoor audience, and early access to new collections for reviews and gift guides.</p>
<p>We work best with editorial sites, outdoor communities and comparison partners who help customers pick the right layer for the conditions.</p>
<p>Orders ship within one working day from our warehouse in Umeå. Delivery is free over 999 SEK in Sweden, Norway, Denmark and Finland, and customers have 60 days to return unworn items.</p>
<p>Returned orders are deducted from commission once the return window closes, so partners see the final amount about two months after the sale.</p>
<p>Sales are tracked with a 30-day cookie window on the last click. Purchases made through the Fjällgården app are tracked as well, as long as the customer arrives from a partner link on the same device.</p>
<p>Repair orders and gift cards do not earn commission. Everything else in the shop, including sale items and the outlet, does.</p>
`;

const OUTDOOR_SNIPPETS = [
  {
    snippetId: 1,
    snippetName: "Brand bidding",
    snippet: "<p>Bidding on Fjällgården or misspellings of it in paid search is not allowed. Partners may not use the brand name in display URLs.</p>",
  },
  {
    snippetId: 2,
    snippetName: "Discount codes",
    snippet: "<p>Only codes issued to you through the platform may be published. Codes found on other sites must not be republished.</p>",
  },
];

const COFFEE_DESCRIPTION = `
<p>Rosteriet Nord is a small-batch coffee roaster delivering freshly roasted beans to homes and offices across the Nordics. Every order is roasted the same week it ships.</p>
<p>Subscribers choose a roast profile and a delivery rhythm, and can pause or swap at any time. Around two thirds of new customers start with the tasting box, and most of them convert to a subscription within a month.</p>
<p>The shop also sells brewing gear, from hand grinders to filter kettles, with guides that help beginners get a good cup on day one. Office plans cover teams from five to five hundred people.</p>
<p>We are looking for partners in food, lifestyle and home content, newsletters with an engaged readership, and cashback partners who reward repeat purchases.</p>
`;

export function BrandPeekDemo() {
  return (
    <DemoStage caption="The original brand description, live. Rest on the text and it opens a little after a short grace period; hold near the bottom edge and it reveals more in steps; leave and it waits before collapsing. Open it to see the rules hint blur in.">
      <div
        className="adtraction-demo"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--size-space-1200)",
        }}>
        <BrandDescription description={OUTDOOR_DESCRIPTION} snippets={OUTDOOR_SNIPPETS} />
        <BrandDescription description={COFFEE_DESCRIPTION} snippets={[]} />
      </div>
    </DemoStage>
  );
}
