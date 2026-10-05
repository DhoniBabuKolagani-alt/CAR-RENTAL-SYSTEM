# DriveEasy – Smart Indian Car Rental System

**DriveEasy** is a web-based Indian car-rental application engineered with modern HTML5, CSS3 (vanilla custom design system), and vanilla ES6+ JavaScript. It features over 100 verified Indian and international car models with real model-specific photographs, automatic road distance calculation across any Indian location, transparent invoice-grade fare breakdowns, distinct Customer & Admin portals, and a dynamic real-time vehicle condition telemetry chart.

---

## 1. Project Structure

```
DriveEasy_Project/
├── index.html              # Core application entry point (Entry Portal, Customer Dashboard, Admin Center)
├── style.css               # Midnight navy & electric blue design system, glassmorphism, responsive grid
├── script.js               # Master application controller & UI orchestrator
├── README.md               # Comprehensive architectural & operational guide
├── data/
│   ├── carsData.js         # 102 distinct car models with real photos, detailed specs & rates
│   └── seedData.js         # Initial mock customers, admin account, and seed bookings
├── services/
│   ├── storageService.js   # LocalStorage layer with inventory versioning (fixes 0-cars bug)
│   ├── locationService.js  # 80+ Indian city coordinates, aliases, distance math & geocoding
│   ├── pricingService.js   # Centralized transparent fare & GST calculator
│   ├── bookingService.js   # Booking management, date overlap checks, status transitions
│   ├── authService.js      # Customer & Admin authentication, session management, validations
│   └── carService.js       # Vehicle inventory CRUD, filtering, sorting, condition breakdown
└── assets/
    ├── hero-driveeasy.jpg  # Realistic cinematic automotive highway background
    └── cars/
        └── placeholder.svg # Fallback graphic for offline resilience
```

---

## 2. How to Run Locally

Because DriveEasy is built with pure client-side standard technologies without heavy build dependencies, you can run it immediately with any local HTTP server:

### Option A: Using Python (Recommended)
Open your terminal in `DriveEasy_Project/` and run:
```bash
# Python 3
python -m http.server 8000
```
Then visit: `http://localhost:8000` in your web browser.

### Option B: Using Node.js / npx
```bash
npx serve .
```

### Option C: VS Code Live Server
Right-click `index.html` and click **"Open with Live Server"**.

---

## 3. Authentication & Entry Flow

When a user visits the application for the first time or logs out, DriveEasy displays an **Entry Screen** with three distinct portals:
1. **Customer Sign In**:
   - Access saved trips, view active bookings, and book in 1 click.
   - Demo customer: `aarav@gmail.com` / `Aarav@123`.
2. **Customer Registration (Sign Up)**:
   - Full Name (minimum 3 characters).
   - Valid 10-digit Indian mobile number (`^[6-9]\d{9}$`).
   - Valid email address (duplicate prevention enforced).
   - Password & confirmation (minimum 6 characters).
   - City selection & Terms checkbox.
   - Upon successful registration, automatically logs the customer in and opens the **Customer Dashboard**.
3. **Admin Operations Portal**:
   - Dedicated access restricted to administrative staff.

---

## 4. Admin Login Credentials

- **Admin Portal URL/Option**: Click **"Admin Operations"** on the entry screen or the **"Admin Panel"** link in the navigation.
- **Default Email**: `admin@driveeasy.in`
- **Default Password**: `Admin@123`
- **Access Scope**: Admin users are directed to the **Admin Operations Command Centre** and cannot use customer booking flows directly. Normal customers cannot access the admin panel.

---

## 5. Car Inventory (102 Distinct Models)

The fleet includes 102 individual models from top Indian and international manufacturers:
- **Tata Motors**: Nano GenX, Tiago, Tigor, Altroz Racer, Punch, Nexon Facelift, Curvv, Harrier Dark, Safari Accomplished, Tiago EV, Punch EV, Nexon EV Max, Curvv EV.
- **Maruti Suzuki**: Alto K10, S-Presso, Celerio, Wagon R 1.2, Swift 2024, Dzire 5-Star GNCAP, Baleno Alpha, Fronx Turbo, Brezza ZXi, Ertiga AT, XL6, Grand Vitara Hybrid, Jimny 4x4, Invicto Strong Hybrid.
- **Hyundai**: Grand i10 NIOS, i20, i20 N Line DCT, Aura, Exter, Venue, Venue N Line, Creta 2024, Creta N Line, Creta EV, Alcazar, Verna Turbo, Tucson AWD, Ioniq 5 EV.
- **Mahindra**: Bolero, Bolero Neo, Scorpio Classic S11, Scorpio-N 4x4, Thar 4x4, Thar Roxx 5-Door, XUV 3XO, XUV700 AWD, XUV400 EV, BE 6e, XEV 9e.
- **Toyota**: Glanza, Urban Cruiser Hyryder, Rumion, Innova Crysta, Innova Hycross ZX(O), Fortuner 4x4, Fortuner Legender, Hilux 4x4, Camry Hybrid, Vellfire VIP Lounge.
- **Honda**: Amaze, City 5th Gen, City e:HEV Hybrid, Elevate.
- **Kia**: Sonet, Seltos X-Line, Carens, Carnival Limousine, EV6 GT-Line.
- **MG**: Comet EV, Astor AI, Hector Savvy, Windsor EV, Gloster 4x4.
- **Volkswagen & Skoda**: Virtus GT TSI, Taigun GT, Tiguan 4MOTION, Slavia Style, Kushaq Monte Carlo, Kodiaq 4x4, Superb L&K.
- **Renault & Nissan**: Kwid Climber, Triber, Kiger Turbo, Magnite Kuro.
- **Jeep & Citroen**: Compass Model S, Meridian 4x4, Wrangler Rubicon, Basalt Coupe.
- **Luxury Fleet**: BMW 2 Series, 3 Series Gran Limousine, 5 Series LWB, X1, Mercedes-Benz A-Class, C-Class, E-Class LWB, GLC 300, Audi A4, Q5 Quattro, BYD Seal AWD.

---

## 6. Real Model-Specific Photographs & Licensing

- Every car in `data/carsData.js` is mapped to an **authentic model-specific photograph** sourced from high-resolution, openly licensed Wikimedia Commons automotive archives.
- **Resilient Fallback Mechanism**: If an external image link fails due to network filtering, the application’s `handleCarImageError()` dynamically provides a verified fallback without breaking card layouts or typography.

---

## 7. Location & Distance Routing System

- **No Artificial Boundaries**: Any Indian city or destination can be entered (Vijayawada, Guntur, Hyderabad, Visakhapatnam, Bengaluru, Chennai, Mumbai, Delhi, Nellore, Markapur, etc.).
- **Automatic Distance Calculation**:
  - Distance field is **removed** from the initial search form.
  - An internal coordinates database covers 80+ major Indian cities.
  - If a city is unlisted, the system automatically geocodes it via the Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`) and applies the standard Indian highway detour factor (`straightLineKm × 1.18`).
  - Estimated road kilometres are displayed in the route badge and directly near the final bill.

---

## 8. Transparent Pricing Formula

The application uses **one centralized calculation function** (`PricingService.calculateBookingPrice`):

$$\text{Subtotal} = (\text{dailyRate} \times \text{rentalDays}) + (\text{perKmRate} \times \text{distanceKm}) + \text{driverFee}$$

$$\text{GST (Taxes)} = \text{Subtotal} \times 0.05 \quad (5\%)$$

$$\text{Total Payable} = \text{Subtotal} + \text{GST}$$

- **Daily Rate**: Depends on car tier (Economy ₹850–₹1,400, Mid-size ₹1,400–₹2,500, Premium SUV ₹2,500–₹4,500, Luxury ₹5,000–₹8,500).
- **Per-Km Rate**: Segments charge ₹7 to ₹36 per estimated kilometre.

---

## 9. Driver Pricing (Chauffeur Option)

Before confirming payment, the customer selects between:
- **Self Driving**: Chauffeur fee = ₹0.
- **Driver Required**: Chauffeur fee = `driverDailyRate × rentalDays` (typically ₹600 to ₹1,500/day depending on vehicle segment).
- The bill displays a side-by-side comparison of **Without Driver** vs **With Driver** totals.

---

## 10. Booking Storage & Persistence

- Data is persisted in browser `localStorage` using keys:
  - `driveeasy_inventory_version`
  - `driveeasy_cars`
  - `driveeasy_users`
  - `driveeasy_bookings`
  - `driveeasy_session`
- A modular service layer (`StorageService`) wraps all read/write operations so backend database migration is simple.

---

## 11. Inventory Versioning & "0 Cars" Bug Fix

Earlier versions suffered from a bug where stale or empty localStorage caused "0 cars" to be displayed.
DriveEasy implements **Inventory Versioning**:
```javascript
const INVENTORY_VERSION = "2026-v10-driveeasy-smart";
```
If `StorageService.init()` detects a version change or empty fleet array, it automatically refreshes and re-syncs the complete 102-car inventory while preserving user bookings.

---

## 12. Database & Backend Configuration Guide

To migrate from `localStorage` to a persistent database (PostgreSQL / Supabase / Firebase):
1. **Supabase / PostgreSQL**:
   - Create tables for `vehicles`, `users`, and `bookings`.
   - In `services/storageService.js`, replace `localStorage.getItem` and `localStorage.setItem` with Supabase client methods (`supabase.from('bookings').select()`).
2. **Environment Variables**:
   - For production hosting (Vercel, Netlify, Cloud Run), configure:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ADMIN_EMAIL=admin@driveeasy.in
     ADMIN_INITIAL_PASSWORD=YourSecurePassword
     ```

---

## 13. Simulated Payment Behavior

- Payment modes displayed: **UPI (Google Pay / PhonePe)**, **Credit/Debit Card**, **Net Banking**, and **Cash on Pickup**.
- For demonstration purposes, transactions are simulated instantly upon clicking **"Confirm Booking & Generate ID"**.
- Generates an official booking ID (e.g. `DE-882104`) and immediately reflects in both the Customer Dashboard and Admin Bookings table.

---

## 14. How to Add More Cars

To add cars programmatically or permanently:
1. Open `data/carsData.js`.
2. Add a new object following the schema:
   ```javascript
   {
     id: 103,
     brand: "Mahindra",
     model: "XUV700",
     fullName: "Mahindra XUV700 AX7 Luxury AWD",
     type: "SUV",
     fuel: "Diesel",
     transmission: "Automatic",
     seats: 7,
     dailyRate: 2700,
     perKmRate: 14,
     driverDailyRate: 900,
     image: "https://...jpg",
     availability: true,
     condition: "Excellent",
     registrationNumber: "AP 16 DE 1103",
     year: 2025,
     description: "..."
   }
   ```
3. Alternatively, login as Admin, navigate to **Fleet Management**, and click **"+ Add New Vehicle"**.

---

## 15. How to Change City / Location Configuration

- Pre-cached cities and coordinate definitions reside in `services/locationService.js` under `CITY_COORDS`.
- Add new coordinates or custom city aliases directly into `CITY_ALIASES` and `CITY_COORDS`.
- Any unlisted city typed by a customer is automatically geocoded on the fly.

---

## 16. Deployment Guide

### Deploying to Vercel / Netlify / GitHub Pages
1. Push this repository to GitHub.
2. Link the repository to Vercel or Netlify.
3. Build Command: *None* (static application).
4. Publish Directory: `DriveEasy_Project/`.
5. Access your live custom URL.
