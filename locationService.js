/**
 * DriveEasy – Location & Distance Service
 * Provides Indian city normalization, road distance estimation, geocoding fallback,
 * and comprehensive suggestion lists without restricting inventory.
 */

const CITY_ALIASES = {
  bangalore: "Bengaluru",
  bombay: "Mumbai",
  madras: "Chennai",
  vizag: "Visakhapatnam",
  bezawada: "Vijayawada",
  gurgaon: "Gurugram",
  mysore: "Mysuru",
  mangalore: "Mangaluru",
  trivandrum: "Thiruvananthapuram",
  calcutta: "Kolkata",
  baroda: "Vadodara",
  pune: "Pune",
  hyderabad: "Hyderabad",
  secunderabad: "Hyderabad",
  delhi: "Delhi",
  "new delhi": "Delhi",
  vellore: "Vellore",
  pondicherry: "Puducherry",
  benares: "Varanasi",
  kashi: "Varanasi",
  cochin: "Kochi",
  simla: "Shimla",
  gauhati: "Guwahati"
};

const CITY_COORDS = {
  // Andhra Pradesh & Telangana
  "Vijayawada": [16.5062, 80.6480],
  "Guntur": [16.3067, 80.4365],
  "Hyderabad": [17.3850, 78.4867],
  "Visakhapatnam": [17.6868, 83.2185],
  "Rajahmundry": [17.0005, 81.8040],
  "Kakinada": [16.9891, 82.2475],
  "Tirupati": [13.6288, 79.4192],
  "Nellore": [14.4426, 79.9865],
  "Kurnool": [15.8281, 78.0373],
  "Kadapa": [14.4674, 78.8241],
  "Ongole": [15.5057, 80.0499],
  "Tenali": [16.2430, 80.6400],
  "Machilipatnam": [16.1875, 81.1389],
  "Anantapur": [14.6819, 77.6006],
  "Srikakulam": [18.2949, 83.8938],
  "Vizianagaram": [18.1133, 83.3977],
  "Bhimavaram": [16.5449, 81.5212],
  "Eluru": [16.7107, 81.0952],
  "Nandyal": [15.4886, 78.4851],
  "Proddatur": [14.7527, 78.5524],
  "Chittoor": [13.2172, 79.1003],
  "Hindupur": [13.8299, 77.4932],
  "Narasaraopet": [16.2359, 80.0499],
  "Markapur": [15.7352, 79.2713],
  "Bapatla": [15.9043, 80.4674],
  "Tadepalligudem": [16.8143, 81.5266],
  "Amalapuram": [16.5787, 82.0061],
  "Warangal": [17.9689, 79.5941],
  "Nizamabad": [18.6725, 78.0941],
  "Karimnagar": [18.4386, 79.1288],
  "Khammam": [17.2473, 80.1514],
  "Ramagundam": [18.8016, 79.4542],
  "Mahbubnagar": [16.7488, 77.9864],
  "Nalgonda": [17.0575, 79.2689],
  "Adilabad": [19.6641, 78.5320],
  "Suryapet": [17.1439, 79.6239],
  "Miryalaguda": [16.8718, 79.5631],
  "Siddipet": [18.1018, 78.8520],

  // Pan-India Major Metros & Cities
  "Bengaluru": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Mumbai": [19.0760, 72.8777],
  "Pune": [18.5204, 73.8567],
  "Delhi": [28.6139, 77.2090],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714],
  "Jaipur": [26.9124, 75.7873],
  "Lucknow": [26.8467, 80.9462],
  "Patna": [25.5941, 85.1376],
  "Kochi": [9.9312, 76.2673],
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Bhubaneswar": [20.2961, 85.8245],
  "Indore": [22.7196, 75.8577],
  "Bhopal": [23.2599, 77.4126],
  "Nagpur": [21.1458, 79.0882],
  "Nashik": [19.9975, 73.7898],
  "Surat": [21.1702, 72.8311],
  "Vadodara": [22.3072, 73.1812],
  "Rajkot": [22.3039, 70.8022],
  "Chandigarh": [30.7333, 76.7794],
  "Amritsar": [31.6340, 74.8723],
  "Dehradun": [30.3165, 78.0322],
  "Guwahati": [26.1445, 91.7362],
  "Ranchi": [23.3441, 85.3096],
  "Coimbatore": [11.0168, 76.9558],
  "Madurai": [9.9252, 78.1198],
  "Mysuru": [12.2958, 76.6394],
  "Mangaluru": [12.9141, 74.8560],
  "Vellore": [12.9165, 79.1325],
  "Tiruchirappalli": [10.7905, 78.7047],
  "Salem": [11.6643, 78.1460],
  "Kozhikode": [11.2588, 75.7804],
  "Noida": [28.5355, 77.3910],
  "Gurugram": [28.4595, 77.0266],
  "Faridabad": [28.4089, 77.3178],
  "Agra": [27.1767, 78.0081],
  "Varanasi": [25.3176, 82.9739],
  "Kanpur": [26.4499, 80.3319],
  "Jalandhar": [31.3260, 75.5762],
  "Jammu": [32.7266, 74.8570],
  "Puducherry": [11.9416, 79.8083],
  "Goa": [15.2993, 74.1240]
};

const CITY_SUGGESTIONS = Object.keys(CITY_COORDS).sort();

const LocationService = {
  normalize(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const key = raw.toLowerCase().replace(/\s+/g, " ");
    return CITY_ALIASES[key] || raw;
  },

  calculateDistance(from, to) {
    const fromCity = this.normalize(from);
    const toCity = this.normalize(to);

    if (!fromCity || !toCity) return 25;
    if (fromCity.toLowerCase() === toCity.toLowerCase()) return 25;

    // Direct check in coordinates database
    const a = CITY_COORDS[fromCity];
    const b = CITY_COORDS[toCity];

    if (a && b) {
      const toRad = deg => deg * Math.PI / 180;
      const dLat = toRad(b[0] - a[0]);
      const dLon = toRad(b[1] - a[1]);
      const lat1 = toRad(a[0]);
      const lat2 = toRad(b[0]);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      const straightKm = 6371 * 2 * Math.asin(Math.sqrt(h));
      // Standard Indian highway detour factor ~1.18
      return Math.max(10, Math.round(straightKm * 1.18));
    }

    return null;
  },

  async geocodeCity(city) {
    const query = String(city || "").trim();
    if (!query) return null;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json&countryCode=IN`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const result = data.results?.[0];
      return result ? [Number(result.latitude), Number(result.longitude)] : null;
    } catch (e) {
      return null;
    }
  },

  async resolveDistance(from, to) {
    const fromCity = this.normalize(from);
    const toCity = this.normalize(to);

    if (!fromCity || !toCity) return 25;
    if (fromCity.toLowerCase() === toCity.toLowerCase()) return 25;

    // Check pre-cached coords first
    const fastDist = this.calculateDistance(fromCity, toCity);
    if (fastDist !== null) return fastDist;

    // Fallback: Geocode unlisted cities
    try {
      const [posA, posB] = await Promise.all([
        CITY_COORDS[fromCity] || this.geocodeCity(fromCity),
        CITY_COORDS[toCity] || this.geocodeCity(toCity)
      ]);

      if (posA && posB) {
        const toRad = deg => deg * Math.PI / 180;
        const dLat = toRad(posB[0] - posA[0]);
        const dLon = toRad(posB[1] - posA[1]);
        const lat1 = toRad(posA[0]);
        const lat2 = toRad(posB[0]);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const straightKm = 6371 * 2 * Math.asin(Math.sqrt(h));
        return Math.max(10, Math.round(straightKm * 1.18));
      }
    } catch (err) {
      console.warn("[LocationService] Geocoding fallback failed:", err);
    }

    // Heuristic default if network unavailable and city unknown
    return 120;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LocationService, CITY_ALIASES, CITY_COORDS, CITY_SUGGESTIONS };
}
