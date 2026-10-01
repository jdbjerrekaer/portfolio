import { APPLICATION_STATUS, BRAND_CATEGORIES, HIGHLIGHT_TYPES } from "@adtraction/util-constants";

// Bias: only a subset of brands should have a non-null application status
const STATUSES = Object.values(APPLICATION_STATUS);
// Non-live statuses used to occasionally vary from the default "live"
const STAFF_PROGRAM_STATUSES = ["draft", "live-hidden", "paused", "archived", "closed", "closing"];
const STAFF_LIVE_PROBABILITY = 0.75; // most programs are live
const STAFF_PROGRAM_TIERS = ["basic", "growth", "premium"]; // higher tier = rarer
const STATUS_PROBABILITY = 0.3; // ~30% of brands have a status, rest are null
const SUB_USER_BADGE_PROBABILITY = 0.1; // show "Sub-user" ~10% of the time
const suffixes = ["", " Group", " AB", " AS", " Oy", " Ltd.", " Inc.", " Holding"];
const countryList = [
  { id: 1, label: "Sweden", flag: "SE" },
  { id: 2, label: "Austria", flag: "AT" },
  { id: 3, label: "Belgium", flag: "BE" },
  { id: 4, label: "Croatia", flag: "HR" },
  { id: 5, label: "Czech Republic", flag: "CZ" },
  { id: 6, label: "Denmark", flag: "DK" },
  { id: 7, label: "Estonia", flag: "EE" },
  { id: 8, label: "Finland", flag: "FI" },
  { id: 9, label: "France", flag: "FR" },
  { id: 10, label: "Germany", flag: "DE" },
  { id: 11, label: "Italy", flag: "IT" },
  { id: 12, label: "Latvia", flag: "LV" },
  { id: 13, label: "Lithuania", flag: "LT" },
  { id: 14, label: "Netherlands", flag: "NL" },
  { id: 15, label: "Norway", flag: "NO" },
  { id: 16, label: "Poland", flag: "PL" },
  { id: 17, label: "Portugal", flag: "PT" },
  { id: 18, label: "Spain", flag: "ES" },
  { id: 19, label: "Switzerland", flag: "CH" },
  { id: 20, label: "United Kingdom", flag: "GB" },
  { id: 21, label: "International", flag: "UnitedNations" }
];

const brands = [
  "IKEA",
  "H&M",
  "Volvo",
  "Spotify",
  "Electrolux",
  "Maersk",
  "LEGO",
  "Carlsberg",
  "Danske Bank",
  "Norwegian Air",
  "Telenor",
  "Elkjøp",
  "Telia",
  "Fjordkraft",
  "Rema 1000",
  "Norsk Hydro",
  "Statoil",
  "PostNord",
  "Vattenfall",
  "Nordea",
  "Skanska",
  "Ericsson",
  "Klarna",
  "SAS Airlines",
  "Tivoli Gardens",
  "Bang & Olufsen",
  "Arla Foods",
  "Pandora",
  "Voss Water",
  "Marimekko",
  "Supercell",
  "Finnair",
  "Neste",
  "KONE",
  "Outokumpu",
  "Iittala",
  "Orkla",
  "Wasa",
  "Axfood",
  "ICA Gruppen",
  "Systembolaget",
  "Hemköp",
  "Coop Sverige",
  "Bauhaus Sweden",
  "Jysk",
  "NetOnNet",
  "Clas Ohlson",
  "Happy Socks",
  "Daniel Wellington",
  "OBH Nordica",
  "Bilia",
  "Mio Möbler",
  "Nelly.com",
  "CDON",
  "Bokus",
  "Adlibris",
  "Royal Design",
  "Lekmer",
  "CoolStuff",
  "KitchenTime",
  "Lyko",
  "Apotea",
  "Kicks",
  "NA-KD",
  "StrongPoint",
  "Elgiganten",
  "Swedbank",
  "SEB",
  "Handelsbanken",
  "Collector Bank",
  "Zalando Nordics",
  "Bergans of Norway",
  "Stormberg",
  "Varner Group",
  "Dressmann",
  "Cubus",
  "Yliopiston Apteekki",
  "Veikkaus",
  "S-market",
  "Alko",
  "Tokmanni",
  "Gigantti",
  "Verkkokauppa.com",
  "Síminn",
  "Icelandair",
  "66°North",
  "Blue Lagoon",
  "Bonus",
  "Krónan",
  "Eimskip",
  "Nova",
  "Össur",
  "Skyn Iceland",
  "Icewear",
  "Bláa Lónið",
  "RÚV",
  "Domino's Iceland",
  "Valitor",
  "Peppes Pizza",
  "Max Hamburgers",
  "Wayne's Coffee",
  "Espresso House",
  "Pressbyrån",
  "Circle K",
  "SAS Cargo",
  "Kahoot!",
  "Oatly",
  "Hestra",
  "Fjällräven",
  "Haglöfs",
  "Peak Performance",
  "Björn Borg",
  "Polarn O. Pyret",
  "Filippa K",
  "Tiger of Sweden",
  "Acne Studios",
  "Gina Tricot",
  "Monki",
  "Weekday",
  "Cheap Monday",
  "Sandqvist",
  "Eytys",
  "Tretorn",
  "Didriksons",
  "Stutterheim",
  "Hope",
  "J.Lindeberg",
  "Marabou",
  "Freia",
  "Löfbergs",
  "Gevalia",
  "Zoégas",
  "Estrella",
  "OLW",
  "Abba Seafood",
  "Felix",
  "Findus Nordics",
  "Santa Maria",
  "Lantmännen",
  "Arvid Nordquist",
  "Västerbottensost",
  "Skånemejerier",
  "Brio",
  "Stiga",
  "Thule",
  "ABU Garcia",
  "Scanpan",
  "Wilfa",
  "Fiskars",
  "Hackman",
  "Arabia",
  "Moomin by Arabia",
  "Marja Kurki",
  "Lumene",
  "Dermoshop",
  "Björn Axén",
  "Face Stockholm",
  "Oriflame",
  "Make Up Store",
  "Bergans",
  "Swix",
  "Helly Hansen",
  "Kari Traa",
  "Devold",
  "Norrøna",
  "Aclima",
  "Dale of Norway",
  "Stormtech",
  "Hurtigruten",
  "Color Line",
  "DFDS",
  "Tallink Silja",
  "Viking Line",
  "Åland Post",
  "Altibox",
  "NetCom (Norway)",
  "TDC Group",
  "Canal Digital",
  "Viaplay",
  "TV4",
  "NRK",
  "SVT",
  "DR (Danish Broadcasting)",
  "YLE",
  "Aurinkomatkat",
  "TUI Nordic",
  "Apollo Reiser",
  "Solresor",
  "Lapland Hotels",
  "Icehotel",
  "Arken Zoo",
  "Musti ja Mirri",
  "Granngården",
  "Plantagen",
  "Byggmax",
  "K-Rauta",
  "XL Bygg",
  "Hornbach",
  "Ahlsell",
  "Clas Fixare",
  "Panduro",
  "Søstrene Grene",
  "Flying Tiger Copenhagen",
  "Normal",
  "Bolia",
  "Room21",
  "Lagerhaus"
];

const categoryValues = Object.keys(BRAND_CATEGORIES);
const serviceLevelValues = [1, 2, 3];

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const brandCategories = brands.map(() => {
  const categoryKey = getRandomItem(categoryValues);
  return BRAND_CATEGORIES[categoryKey];
});
const brandServiceLevels = brands.map(() => getRandomItem(serviceLevelValues));

// Weighted random pick for program tier
// ~50% basic, ~30% growth, ~20% premium (highest tier)
const pickRandomTier = () => {
  const r = Math.random();
  if (r < 0.5) return STAFF_PROGRAM_TIERS[0]; // basic
  if (r < 0.8) return STAFF_PROGRAM_TIERS[1]; // growth
  return STAFF_PROGRAM_TIERS[2]; // premium
};

export const mockBrands = Array.from({ length: 200 }, (_, i) => {
  const brandName = brands[i % brands.length];
  const status =
    Math.random() < STATUS_PROBABILITY
      ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
      : null;
  const suffix = suffixes[i % suffixes.length];
  const country = countryList[i % countryList.length];
  const commissionIncrease = i % 3 === 0;
  const category = brandCategories[i % brands.length];
  const serviceLevel = brandServiceLevels[i % brands.length];

  // Build highlights in a strict order. Commission increase is included
  // only when the application status is Approved.
  // Most brands should have 2-3 tags total.
  const ordered = [
    HIGHLIGHT_TYPES.COMMISSION_INCREASE,
    HIGHLIGHT_TYPES.NEW,
    HIGHLIGHT_TYPES.FOR_YOU,
    HIGHLIGHT_TYPES.PROMO_CODE,
    HIGHLIGHT_TYPES.PROMOTIONS,
    HIGHLIGHT_TYPES.EXCLUSIVE,
    HIGHLIGHT_TYPES.PRODUCT_FEED
  ];

  const pickCount = (() => {
    const r = Math.random();
    if (r < 0.1) return 1; // 10%
    if (r < 0.5) return 2; // 40%
    if (r < 0.9) return 3; // 40%
    if (r < 0.98) return 4; // 8%
    return 5; // 2%
  })();

  const includeCommission = status === "Approved" && commissionIncrease;
  const remainder = ordered.slice(1); // keep fixed order after commission increase

  const extrasNeeded = Math.min(
    remainder.length,
    Math.max(0, pickCount - (includeCommission ? 1 : 0))
  );
  // Randomly select indices from the ordered remainder, but preserve order
  const chosenIndexSet = new Set();
  while (chosenIndexSet.size < extrasNeeded) {
    chosenIndexSet.add(Math.floor(Math.random() * remainder.length));
  }
  const extras = remainder.filter((_, idx) => chosenIndexSet.has(idx));
  const highlights = includeCommission ? [ordered[0], ...extras] : extras;

  const categoryImageMap = {
    1: "https://adtraction.com/media/n2ho3s5f/fashion_rebelattitude_size-xl.webp",
    2: "https://adtraction.com/media/cped52s5/fashion_rebelattitude_size-m.webp",
    3: "https://adtraction.com/media/q24h3mni/fashion_rebelattitude_size-s.webp"
  };
  const backgroundImage = categoryImageMap[(i % 3) + 1] || "";

  return {
    id: i + 1,
    logo: "https://placehold.co/100x32",
    flag: country.flag,
    market: country.id,
    title: `${brandName}${suffix}`,
    status: status,
    // Default to "live" most of the time; otherwise pick one of the non-live states
    staffProgramStatus:
      Math.random() < STAFF_LIVE_PROBABILITY
        ? "live"
        : STAFF_PROGRAM_STATUSES[Math.floor(Math.random() * STAFF_PROGRAM_STATUSES.length)],
    staffProgramTier: pickRandomTier(),
    isSubUser: Math.random() < SUB_USER_BADGE_PROBABILITY,
    commissionIncrease: status === "Approved" ? commissionIncrease : false,
    type: "brand",
    url: "#",
    category: category,
    serviceLevel: serviceLevel,
    highlights,
    backgroundImage
  };
});
