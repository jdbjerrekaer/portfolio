// Stand-in for platform/src/app/superagent/platformAgent.js: same method names the sidemenu and
// global search call, resolving fake data instead of hitting the platform BFF.
const resolve = (value, delay = 120) => new Promise((r) => setTimeout(() => r(value), delay));

const platformAgent = {
  getAccountManager: () => resolve({ name: "Alex Lindqvist", email: "alex@example.com", mobile: "+46 70 000 00 00" }),
  getSelectCurrencies: () =>
    resolve([
      { currencycode: "SEK", flag: "SE" },
      { currencycode: "DKK", flag: "DK" },
      { currencycode: "NOK", flag: "NO" }
    ]),
  getDisplayCurrency: () => resolve({ displayCurrencyCode: "SEK" }),
  saveDisplayCurrency: () => resolve({}),
  getLinkedBrands: () => resolve([]),
  switchAdvertiserAccount: () => resolve({ success: false }),
  getBrandSelectCountries: () => resolve([]),
  dashboard_enrichRecentSearchPrograms: () => resolve([]),
  brand_getBrandGlobalSearchResult: () => resolve([])
};

export default platformAgent;
