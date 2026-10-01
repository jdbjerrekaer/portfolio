import { Icons } from "@adtraction/ui-icons";

/**
 * Shared page-route → icon map for global-search page rows and navigation sections.
 */
export const getGlobalSearchPageIcon = (route = "") => {
  if (route.startsWith("/insights")) return Icons.Chart.Pie02;
  if (route.startsWith("/earnings")) return Icons.Finance.BankNote01;
  if (route.startsWith("/brands")) return Icons.Custom.Brand;
  if (route.startsWith("/products")) return Icons.Finance.ShoppingBag03;
  if (route.startsWith("/features")) return Icons.General.CheckVerified03;
  if (route.startsWith("/settings")) return Icons.General.Settings01;
  if (route.startsWith("/discover")) return Icons.Alert.Announcement01;
  if (route.startsWith("/my-brand")) return Icons.Custom.Brand;
  if (route.startsWith("/dashboard")) return Icons.General.Home05;
  return Icons.Files.File02;
};
