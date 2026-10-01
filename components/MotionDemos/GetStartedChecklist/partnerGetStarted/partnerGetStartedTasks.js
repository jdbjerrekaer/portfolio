import { Icons } from "@adtraction/ui-icons";

export const PARTNER_GET_STARTED_TASKS = [
  { id: "completeProfile", Icon: Icons.User.User01 }, // later: /settings/account-payout
  { id: "addChannel", Icon: Icons.Layout.LayersThree01 },
  { id: "getApproved", Icon: Icons.General.CheckVerified02 },
  { id: "applyToBrand", Icon: Icons.Custom.Brand },
  // No route: the CTA only closes the step.
  { id: "earnCommission", Icon: Icons.Finance.CoinsStacked01, ctaIcon: false }
];
