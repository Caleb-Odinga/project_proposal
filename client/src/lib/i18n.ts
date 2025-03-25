// Simple translation support for English and Swahili

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  // Header
  "brand": {
    "en": "Nyumba",
    "sw": "Nyumba"
  },
  "rent": {
    "en": "Rent",
    "sw": "Kukodisha"
  },
  "buy": {
    "en": "Buy",
    "sw": "Nunua"
  },
  "sell": {
    "en": "Sell",
    "sw": "Uza"
  },
  "resources": {
    "en": "Resources",
    "sw": "Rasilimali"
  },
  "listProperty": {
    "en": "List Property",
    "sw": "Orodhesha Mali"
  },
  "favorites": {
    "en": "Favorites",
    "sw": "Vipendwa"
  },
  "messages": {
    "en": "Messages",
    "sw": "Ujumbe"
  },
  "profile": {
    "en": "Profile",
    "sw": "Wasifu"
  },
  "login": {
    "en": "Login",
    "sw": "Ingia"
  },
  "register": {
    "en": "Register",
    "sw": "Jiandikishe"
  },
  "logout": {
    "en": "Logout",
    "sw": "Toka"
  },

  // Hero Section
  "heroTitle": {
    "en": "Find Your Perfect Home in Kenya",
    "sw": "Pata Nyumba Yako Bora Zaidi Nchini Kenya"
  },
  "heroSubtitle": {
    "en": "Discover thousands of properties for rent and sale across Kenya's neighborhoods.",
    "sw": "Gundua maelfu ya mali za kukodisha na kuuza katika mitaa ya Kenya."
  },
  "searchPlaceholder": {
    "en": "Location (e.g., Nairobi, Mombasa, Kisumu)",
    "sw": "Eneo (k.m., Nairobi, Mombasa, Kisumu)"
  },
  "search": {
    "en": "Search",
    "sw": "Tafuta"
  },
  "moreFilters": {
    "en": "More Filters",
    "sw": "Vichujio Zaidi"
  },

  // Property Listing
  "propertiesIn": {
    "en": "Properties in",
    "sw": "Mali zilizo"
  },
  "showingProperties": {
    "en": "Showing properties for",
    "sw": "Inaonyesha mali za"
  },
  "list": {
    "en": "List",
    "sw": "Orodha"
  },
  "map": {
    "en": "Map",
    "sw": "Ramani"
  },
  "grid": {
    "en": "Grid",
    "sw": "Gridi"
  },
  "recommended": {
    "en": "Recommended",
    "sw": "Inayopendekezwa"
  },
  "priceLowToHigh": {
    "en": "Price: Low to High",
    "sw": "Bei: Chini hadi Juu"
  },
  "priceHighToLow": {
    "en": "Price: High to Low",
    "sw": "Bei: Juu hadi Chini"
  },
  "newestFirst": {
    "en": "Newest First",
    "sw": "Mpya Kwanza"
  },
  "forRent": {
    "en": "For Rent",
    "sw": "Kwa Kukodisha"
  },
  "forSale": {
    "en": "For Sale",
    "sw": "Kwa Kuuza"
  },
  "verified": {
    "en": "Verified",
    "sw": "Imethibitishwa"
  },
  "beds": {
    "en": "Beds",
    "sw": "Vitanda"
  },
  "baths": {
    "en": "Baths",
    "sw": "Bafu"
  },
  "sqm": {
    "en": "m²",
    "sw": "m²"
  },
  "daysAgo": {
    "en": "days ago",
    "sw": "siku zilizopita"
  },

  // Features Section
  "whyChoose": {
    "en": "Why Choose Nyumba?",
    "sw": "Kwa Nini Uchague Nyumba?"
  },
  "localExpertise": {
    "en": "Local Expertise",
    "sw": "Utaalamu wa Eneo"
  },
  "localExpertiseDesc": {
    "en": "Find properties in neighborhoods across Kenya with detailed insights about the local area.",
    "sw": "Pata mali katika mitaa mbalimbali ya Kenya pamoja na maelezo ya kina kuhusu eneo hilo."
  },
  "verifiedListings": {
    "en": "Verified Listings",
    "sw": "Orodha Zilizothibitishwa"
  },
  "verifiedListingsDesc": {
    "en": "All properties are verified to ensure you get accurate information and avoid scams.",
    "sw": "Mali zote zimethibitishwa kuhakikisha unapata taarifa sahihi na kuepuka ulaghai."
  },
  "directCommunication": {
    "en": "Direct Communication",
    "sw": "Mawasiliano ya Moja kwa Moja"
  },
  "directCommunicationDesc": {
    "en": "Message landlords and agents directly to ask questions and arrange viewings.",
    "sw": "Wasiliana na wamiliki wa nyumba na mawakala moja kwa moja kuuliza maswali na kupanga ziara."
  },

  // Neighborhoods Section
  "popularNeighborhoods": {
    "en": "Popular Neighborhoods",
    "sw": "Mitaa Maarufu"
  },
  "discoverProperties": {
    "en": "Discover properties in Kenya's most sought-after locations",
    "sw": "Gundua mali katika maeneo yanayotafutwa zaidi nchini Kenya"
  },
  "properties": {
    "en": "Properties",
    "sw": "Mali"
  },

  // Affordability Calculator
  "affordabilityCalculator": {
    "en": "Affordability Calculator",
    "sw": "Kikokotoo cha Uwezo wa Kifedha"
  },
  "calculatorDesc": {
    "en": "Find out how much house you can afford in Kenya",
    "sw": "Jua ni nyumba ya thamani gani unaweza kumudu nchini Kenya"
  },
  "monthlyIncome": {
    "en": "Monthly Income (KSh)",
    "sw": "Mapato ya Kila Mwezi (KSh)"
  },
  "downPayment": {
    "en": "Down Payment (KSh)",
    "sw": "Malipo ya Awali (KSh)"
  },
  "loanTerm": {
    "en": "Loan Term (Years)",
    "sw": "Muda wa Mkopo (Miaka)"
  },
  "interestRate": {
    "en": "Interest Rate (%)",
    "sw": "Kiwango cha Riba (%)"
  },
  "calculate": {
    "en": "Calculate Affordability",
    "sw": "Kokotoa Uwezo"
  },
  "estimatedAffordability": {
    "en": "Your Estimated Affordability",
    "sw": "Uwezo Wako Uliokadiriwa"
  },
  "maxHomePrice": {
    "en": "Maximum home price you can afford",
    "sw": "Bei ya juu zaidi ya nyumba unayoweza kumudu"
  },
  "monthlyMortgage": {
    "en": "Monthly Mortgage Payment",
    "sw": "Malipo ya Kila Mwezi ya Rehani"
  },
  "debtToIncome": {
    "en": "Debt-to-Income Ratio",
    "sw": "Uwiano wa Deni kwa Mapato"
  },
  "totalInterest": {
    "en": "Total Interest Paid",
    "sw": "Jumla ya Riba Iliyolipwa"
  },
  "seeProperties": {
    "en": "See all properties in your price range",
    "sw": "Tazama mali zote katika kiwango chako cha bei"
  },

  // Footer
  "aboutUs": {
    "en": "About Us",
    "sw": "Kuhusu Sisi"
  },
  "careers": {
    "en": "Careers",
    "sw": "Kazi"
  },
  "contactUs": {
    "en": "Contact Us",
    "sw": "Wasiliana Nasi"
  },
  "mediaCentre": {
    "en": "Media Centre",
    "sw": "Kituo cha Vyombo vya Habari"
  },
  "investorRelations": {
    "en": "Investor Relations",
    "sw": "Uhusiano wa Wawekezaji"
  },
  "forTenants": {
    "en": "For Tenants",
    "sw": "Kwa Wapangaji"
  },
  "browseProperties": {
    "en": "Browse Properties",
    "sw": "Vinjari Mali"
  },
  "howToRent": {
    "en": "How to Rent",
    "sw": "Jinsi ya Kupanga"
  },
  "tenantGuide": {
    "en": "Tenant Guide",
    "sw": "Mwongozo wa Mpangaji"
  },
  "areaGuides": {
    "en": "Area Guides",
    "sw": "Miongozo ya Maeneo"
  },
  "forLandlords": {
    "en": "For Landlords",
    "sw": "Kwa Wamiliki wa Nyumba"
  },
  "listYourProperty": {
    "en": "List Your Property",
    "sw": "Orodhesha Mali Yako"
  },
  "landlordGuide": {
    "en": "Landlord Guide",
    "sw": "Mwongozo wa Mmiliki"
  },
  "propertyManagement": {
    "en": "Property Management",
    "sw": "Usimamizi wa Mali"
  },
  "commercialProperties": {
    "en": "Commercial Properties",
    "sw": "Mali za Kibiashara"
  },
  "advertiseWithUs": {
    "en": "Advertise With Us",
    "sw": "Tangaza Nasi"
  },
  "connectWithUs": {
    "en": "Connect With Us",
    "sw": "Ungana Nasi"
  },
  "subscribeNewsletter": {
    "en": "Subscribe to Newsletter",
    "sw": "Jiandikishe kwa Jarida"
  },
  "emailPlaceholder": {
    "en": "Your email",
    "sw": "Barua pepe yako"
  },
  "copyright": {
    "en": "All rights reserved.",
    "sw": "Haki zote zimehifadhiwa."
  },
  "termsOfService": {
    "en": "Terms of Service",
    "sw": "Masharti ya Huduma"
  },
  "privacyPolicy": {
    "en": "Privacy Policy",
    "sw": "Sera ya Faragha"
  },
  "cookiePolicy": {
    "en": "Cookie Policy",
    "sw": "Sera ya Vidakuzi"
  },
  "sitemap": {
    "en": "Sitemap",
    "sw": "Ramani ya Tovuti"
  },

  // Mobile Nav
  "home": {
    "en": "Home",
    "sw": "Nyumbani"
  },
  "saved": {
    "en": "Saved",
    "sw": "Zilizohifadhiwa"
  },

  // Auth
  "username": {
    "en": "Username",
    "sw": "Jina la mtumiaji"
  },
  "password": {
    "en": "Password",
    "sw": "Neno la siri"
  },
  "confirmPassword": {
    "en": "Confirm Password",
    "sw": "Thibitisha Neno la siri"
  },
  "email": {
    "en": "Email",
    "sw": "Barua pepe"
  },
  "fullName": {
    "en": "Full Name",
    "sw": "Jina Kamili"
  },
  "phone": {
    "en": "Phone",
    "sw": "Simu"
  },
  "loginTitle": {
    "en": "Login to Your Account",
    "sw": "Ingia kwenye Akaunti Yako"
  },
  "registerTitle": {
    "en": "Create an Account",
    "sw": "Tengeneza Akaunti"
  },
  "noAccount": {
    "en": "Don't have an account?",
    "sw": "Huna akaunti?"
  },
  "haveAccount": {
    "en": "Already have an account?",
    "sw": "Una akaunti tayari?"
  },
  "loginHere": {
    "en": "Login here",
    "sw": "Ingia hapa"
  },
  "registerHere": {
    "en": "Register here",
    "sw": "Jiandikishe hapa"
  },
  "passwordsDoNotMatch": {
    "en": "Passwords do not match",
    "sw": "Maneno ya siri hayalingani"
  },
};

export function translate(key: string, language: string): string {
  if (!translations[key]) {
    return key;
  }
  
  return translations[key][language] || translations[key]["en"] || key;
}
