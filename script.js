/**
 * DriveEasy – Main Application Controller
 * Connects all services, coordinates UI state, handles real-time distance calculation,
 * transparent billing, dynamic vehicle condition charts, customer portal, and admin center.
 */

// Application State
const appState = {
  session: null,
  search: {
    pickupCity: "Vijayawada",
    destCity: "Hyderabad",
    pickupDate: "",
    returnDate: "",
    distanceKm: 295,
    type: "All Cars",
    fuel: "All",
    transmission: "All",
    sortBy: "popular",
    query: ""
  },
  activeCarForModal: null,
  activeCheckoutDraft: null,
  activeAdminTab: "fleet"
};

// DOM Helper
const $ = id => document.getElementById(id);

// Toast Notification
function showToast(message, type = "info") {
  const container = $("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ️"}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
}

// Date Helpers
function formatDateIndian(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

function calculateDaysDifference(startStr, endStr) {
  if (!startStr || !endStr) return 1;
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

function getTomorrowString(offsetDays = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  StorageService.init();
  appState.session = AuthService.getCurrentUser();

  // Setup Dates Defaults
  const today = getTomorrowString(0);
  const tomorrow = getTomorrowString(1);
  const dayAfter = getTomorrowString(2);

  appState.search.pickupDate = tomorrow;
  appState.search.returnDate = dayAfter;

  $("pickupDateInput").min = today;
  $("returnDateInput").min = today;
  $("pickupDateInput").value = tomorrow;
  $("returnDateInput").value = dayAfter;

  $("checkoutPickupDate").min = today;
  $("checkoutReturnDate").min = today;

  $("pickupCityInput").value = appState.search.pickupCity;
  $("destCityInput").value = appState.search.destCity;

  // Populate Autocomplete Cities Suggestions
  populateCitySuggestions();

  // Initial Distance calculation
  updateSearchRouteDisplay();

  // Setup Event Listeners
  setupEventListeners();

  // Render UI
  renderHeader();
  renderAppViews();
  renderCarsCatalog();

  // Live Clock
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
});

// Populate City Autocomplete
function populateCitySuggestions() {
  const datalist = $("citySuggestions");
  if (!datalist) return;
  datalist.innerHTML = CITY_SUGGESTIONS.map(c => `<option value="${c}"></option>`).join("");
}

// Live Clock in IST
function updateLiveClock() {
  const clock = $("liveClockDisplay");
  if (!clock) return;
  const now = new Date();
  const istTime = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
  clock.textContent = `IST: ${istTime}`;
}

// =========================================================================
// HEADER & VIEW ORCHESTRATION
// =========================================================================
function renderHeader() {
  const actions = $("headerActions");
  const navDashboard = $("navDashboard");
  const navAdmin = $("navAdmin");
  const statusIndicator = $("userStatusIndicator");
  const session = appState.session;

  if (session && session.role === "admin") {
    // Admin Session
    actions.innerHTML = `
      <div class="admin-badge-btn" id="headerAdminControlBtn">
        <span>🛡️</span> Admin Console
      </div>
      <button class="btn-danger" id="headerLogoutBtn">Logout</button>
    `;
    navDashboard.classList.add("hidden");
    navAdmin.classList.remove("hidden");
    if (statusIndicator) statusIndicator.textContent = `Admin: ${session.name}`;
  } else if (session && session.role === "user") {
    // Customer Session
    const initials = session.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    actions.innerHTML = `
      <div class="user-chip" id="headerUserChip" title="View My Dashboard">
        <div class="user-chip-avatar">${initials}</div>
        <span>${session.name}</span>
      </div>
      <button class="btn-secondary" id="headerLogoutBtn">Logout</button>
    `;
    navDashboard.classList.remove("hidden");
    navAdmin.classList.add("hidden");
    if (statusIndicator) statusIndicator.textContent = `Customer: ${session.name}`;
  } else {
    // Guest Mode
    actions.innerHTML = `
      <button class="btn-ghost" id="headerLoginBtn">Sign In</button>
      <button class="btn-primary" id="headerRegisterBtn">Sign Up</button>
      <button class="btn-secondary" id="headerAdminBtn" style="border-color: rgba(139, 92, 246, 0.4); color: #c084fc;">Admin</button>
    `;
    navDashboard.classList.add("hidden");
    navAdmin.classList.add("hidden");
    if (statusIndicator) statusIndicator.textContent = "Guest Mode";
  }

  wireHeaderActions();
}

function wireHeaderActions() {
  $("headerLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  $("headerRegisterBtn")?.addEventListener("click", () => openAuthModal("register"));
  $("headerAdminBtn")?.addEventListener("click", openAdminLoginModal);
  $("headerLogoutBtn")?.addEventListener("click", handleLogout);
  $("headerUserChip")?.addEventListener("click", () => {
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });
  });
  $("headerAdminControlBtn")?.addEventListener("click", () => {
    switchView("admin");
    $("adminControlSection")?.scrollIntoView({ behavior: "smooth" });
  });
}

function switchView(viewName) {
  const entryPortal = $("entryPortal");
  const customerHero = $("customerHero");
  const searchSection = $("searchSection");
  const carsSection = $("carsSection");
  const customerDashboardSection = $("customerDashboardSection");
  const adminControlSection = $("adminControlSection");

  // Update Nav links active state
  document.querySelectorAll(".site-nav a").forEach(a => a.classList.remove("active"));

  if (viewName === "portal") {
    entryPortal.classList.remove("hidden");
    customerHero.classList.add("hidden");
    searchSection.classList.remove("hidden");
    carsSection.classList.remove("hidden");
    customerDashboardSection.classList.add("hidden");
    adminControlSection.classList.add("hidden");
    $("navHome")?.classList.add("active");
  } else if (viewName === "dashboard") {
    entryPortal.classList.add("hidden");
    customerHero.classList.remove("hidden");
    searchSection.classList.remove("hidden");
    carsSection.classList.remove("hidden");
    customerDashboardSection.classList.remove("hidden");
    adminControlSection.classList.add("hidden");
    $("navDashboard")?.classList.add("active");
    renderCustomerDashboard();
  } else if (viewName === "admin") {
    entryPortal.classList.add("hidden");
    customerHero.classList.add("hidden");
    searchSection.classList.add("hidden");
    carsSection.classList.add("hidden");
    customerDashboardSection.classList.add("hidden");
    adminControlSection.classList.remove("hidden");
    $("navAdmin")?.classList.add("active");
    renderAdminControlCentre();
  } else if (viewName === "cars") {
    entryPortal.classList.add("hidden");
    customerHero.classList.remove("hidden");
    searchSection.classList.remove("hidden");
    carsSection.classList.remove("hidden");
    adminControlSection.classList.add("hidden");
    $("navCars")?.classList.add("active");
    $("carsSection")?.scrollIntoView({ behavior: "smooth" });
  }
}

function renderAppViews() {
  const session = appState.session;
  if (!session) {
    switchView("portal");
  } else if (session.role === "admin") {
    switchView("admin");
  } else {
    switchView("dashboard");
  }
}

// =========================================================================
// ROUTE & DISTANCE ESTIMATION (NO DISTANCE INPUT IN SEARCH)
// =========================================================================
async function updateSearchRouteDisplay() {
  const pickup = LocationService.normalize($("pickupCityInput").value.trim()) || "Vijayawada";
  const dest = LocationService.normalize($("destCityInput").value.trim()) || "Hyderabad";
  const pickupDate = $("pickupDateInput").value;
  const returnDate = $("returnDateInput").value;

  appState.search.pickupCity = pickup;
  appState.search.destCity = dest;
  appState.search.pickupDate = pickupDate;
  appState.search.returnDate = returnDate;

  $("currentRouteDisplay").textContent = `${pickup} → ${dest}`;
  $("currentDistanceBadge").textContent = "Calculating distance…";

  const days = calculateDaysDifference(pickupDate, returnDate);
  $("searchDatesDisplay").textContent = `${days} Day${days === 1 ? "" : "s"} (${formatDateIndian(pickupDate)} to ${formatDateIndian(returnDate)})`;

  const distanceKm = await LocationService.resolveDistance(pickup, dest);
  appState.search.distanceKm = distanceKm;
  $("currentDistanceBadge").textContent = `~${distanceKm.toLocaleString("en-IN")} km estimated`;

  // Re-render car rates with updated distance
  renderCarsCatalog();
}

// =========================================================================
// CAR CATALOG RENDERING & FILTERING
// =========================================================================
function renderCarsCatalog() {
  const container = $("carsContainer");
  if (!container) return;

  const cars = CarService.filterCars({
    type: appState.search.type,
    fuel: appState.search.fuel,
    transmission: appState.search.transmission,
    sortBy: appState.search.sortBy,
    searchQuery: appState.search.query
  });

  const countPill = $("catalogCountPill");
  if (countPill) countPill.textContent = `${cars.length} Cars Available`;

  if (cars.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🚗</div>
        <h3>No vehicles found matching your current filter criteria.</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">
          Try selecting "All Cars" or clearing specific fuel/transmission filters. Location never removes vehicles from the nationwide fleet.
        </p>
        <button class="btn-primary" style="margin-top: 1.25rem;" onclick="resetSearchFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  const days = calculateDaysDifference(appState.search.pickupDate, appState.search.returnDate);
  const distanceKm = appState.search.distanceKm || 295;
  const pickupDate = appState.search.pickupDate;
  const returnDate = appState.search.returnDate;

  container.innerHTML = cars.map(car => {
    const isBooked = BookingService.isCarBookedForDates(car.id, pickupDate, returnDate);
    const isAvailable = car.availability && !isBooked;

    const selfPrice = PricingService.calculateBookingPrice({ car, days, distanceKm, drivingMode: "self" });
    const driverPrice = PricingService.calculateBookingPrice({ car, days, distanceKm, drivingMode: "driver" });

    const conditionClass = (car.condition || "Good").toLowerCase().replace(/\s+/g, "-");

    return `
      <article class="car-card ${isAvailable ? "" : "unavailable"}" data-car-id="${car.id}">
        <div class="car-card-media">
          <img class="car-card-photo" src="${car.image}" alt="${car.fullName} photo" loading="lazy" onerror="handleCarImageError(this, '${car.brand}')">
          <span class="car-type-badge">${car.type}</span>
          <span class="car-condition-badge condition-${conditionClass}">${car.condition || "Good"}</span>
          ${isBooked ? `<div class="car-booked-overlay">Booked for Selected Dates</div>` : !car.availability ? `<div class="car-booked-overlay" style="background: rgba(245, 158, 11, 0.9);">Under Maintenance</div>` : ""}
        </div>
        <div class="car-card-body">
          <div class="car-card-header">
            <span class="car-brand-name">${car.brand}</span>
            <h3 class="car-model-title">${car.fullName}</h3>
          </div>
          <div class="car-specs-row">
            <span class="car-spec-tag">⚙️ ${car.transmission}</span>
            <span class="car-spec-tag">👥 ${car.seats} Seats</span>
            <span class="car-spec-tag">⛽ ${car.fuel}</span>
            <span class="car-spec-tag">📅 ${car.year}</span>
          </div>
          <div class="car-route-preview">
            📍 ${appState.search.pickupCity} → ${appState.search.destCity} • ~${distanceKm} km
          </div>
          <div class="car-rates-block">
            <div class="car-rate-primary">
              <strong>${PricingService.formatINR(selfPrice.totalAmount)}</strong>
              <span>Self-Drive (${days}d)</span>
            </div>
            <div class="car-rate-secondary">
              <span>Chauffeur: ${PricingService.formatINR(driverPrice.totalAmount)}</span>
              <span>Rate: ${PricingService.formatINR(car.dailyRate)}/d + ${PricingService.formatINR(car.perKmRate)}/km</span>
            </div>
          </div>
          <div class="car-card-actions">
            <button class="btn-details" onclick="openCarDetailsModal(${car.id})">Details</button>
            <button class="btn-book" onclick="initiateCarBooking(${car.id})" ${isAvailable ? "" : "disabled"}>
              ${isBooked ? "Booked" : !car.availability ? "Unavailable" : "Book Now"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Fallback if image fails to load - uses company-specific automotive SVG
function handleCarImageError(imgElement, brand) {
  imgElement.onerror = null;
  const b = String(brand || "").toLowerCase().trim();
  const known = ["tata", "mahindra", "maruti", "hyundai", "toyota", "kia", "honda", "mg", "volkswagen", "skoda", "jeep", "bmw", "mercedes-benz", "audi"];
  let matched = "default";
  for (const k of known) {
    if (b.includes(k) || (k === "maruti" && b.includes("suzuki"))) {
      matched = k;
      break;
    }
  }
  imgElement.src = `assets/cars/${matched}.svg`;
}

function resetSearchFilters() {
  appState.search.type = "All Cars";
  appState.search.fuel = "All";
  appState.search.transmission = "All";
  appState.search.sortBy = "popular";
  appState.search.query = "";

  document.querySelectorAll("#typeFilterTabs .filter-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === "All Cars");
  });
  $("fuelFilterSelect").value = "All";
  $("transFilterSelect").value = "All";
  $("sortCarsSelect").value = "popular";
  $("carModelSearchInput").value = "";

  renderCarsCatalog();
}

// =========================================================================
// CAR DETAILS MODAL
// =========================================================================
function openCarDetailsModal(carId) {
  const car = CarService.getCarById(carId);
  if (!car) return;

  appState.activeCarForModal = car;

  $("detailsCarPhoto").src = car.image;
  $("detailsCarPhoto").onerror = function() { handleCarImageError(this, car.brand); };
  $("detailsCarBrand").textContent = car.brand;
  $("detailsCarTitle").textContent = car.fullName;
  $("detailsCarDesc").textContent = car.description;
  $("detailsCarCondition").textContent = car.condition;
  $("detailsCarCondition").className = `car-condition-badge condition-${(car.condition || "Good").toLowerCase().replace(/\s+/g, "-")}`;
  $("detailsCarType").textContent = car.type;
  $("detailsCarSeats").textContent = `${car.seats} Seater`;
  $("detailsCarFuel").textContent = car.fuel;
  $("detailsCarTrans").textContent = car.transmission;
  $("detailsCarReg").textContent = car.registrationNumber || "Commercial Permit";
  $("detailsCarYear").textContent = car.year;
  $("detailsDailyRate").textContent = `${PricingService.formatINR(car.dailyRate)}/day`;
  $("detailsPerKmRate").textContent = `Distance: ${PricingService.formatINR(car.perKmRate)}/km`;
  $("detailsDriverRate").textContent = `Chauffeur: ${PricingService.formatINR(car.driverDailyRate)}/day`;

  const isBooked = BookingService.isCarBookedForDates(car.id, appState.search.pickupDate, appState.search.returnDate);
  const bookBtn = $("detailsBookNowBtn");
  if (bookBtn) {
    if (isBooked) {
      bookBtn.textContent = "Currently Booked for Selected Dates";
      bookBtn.disabled = true;
    } else if (!car.availability) {
      bookBtn.textContent = "Vehicle Under Maintenance";
      bookBtn.disabled = true;
    } else {
      bookBtn.textContent = `Book ${car.model} Now`;
      bookBtn.disabled = false;
    }
  }

  openModal("carDetailsModal");
}

// =========================================================================
// BOOKING & TRANSPARENT CHECKOUT FLOW
// =========================================================================
function initiateCarBooking(carId) {
  // Authentication Guard: Normal customer login required
  if (!appState.session) {
    showToast("Please sign in or create an account to book.", "info");
    openAuthModal("login");
    return;
  }

  if (appState.session.role === "admin") {
    showToast("You are logged in as Admin. Customer bookings are made through user accounts.", "info");
    return;
  }

  const car = CarService.getCarById(carId);
  if (!car) return;

  closeModal("carDetailsModal");
  appState.activeCarForModal = car;

  // Populate Booking Checkout form
  $("checkoutCarId").value = car.id;
  $("checkoutCarPhoto").src = car.image;
  $("checkoutCarTitle").textContent = car.fullName;
  $("checkoutCarMeta").textContent = `${car.transmission} • ${car.seats} Seats • ${car.fuel} • Condition: ${car.condition}`;

  $("checkoutPickupCity").value = appState.search.pickupCity;
  $("checkoutDestCity").value = appState.search.destCity;
  $("checkoutPickupDate").value = appState.search.pickupDate;
  $("checkoutReturnDate").value = appState.search.returnDate;

  // Reset driving mode selection to Self Driving
  setDrivingModeOption("self");

  // Calculate live checkout pricing
  recalculateCheckoutBill();

  openModal("bookingModal");
}

function setDrivingModeOption(mode) {
  const optSelf = $("optSelfDrive");
  const optDriver = $("optDriverRequired");
  const radioSelf = optSelf.querySelector("input");
  const radioDriver = optDriver.querySelector("input");

  if (mode === "self") {
    optSelf.classList.add("selected");
    optDriver.classList.remove("selected");
    radioSelf.checked = true;
    radioDriver.checked = false;
  } else {
    optSelf.classList.remove("selected");
    optDriver.classList.add("selected");
    radioSelf.checked = false;
    radioDriver.checked = true;
  }

  recalculateCheckoutBill();
}

async function recalculateCheckoutBill() {
  const car = appState.activeCarForModal;
  if (!car) return;

  const pickupCity = LocationService.normalize($("checkoutPickupCity").value.trim()) || "Vijayawada";
  const destCity = LocationService.normalize($("checkoutDestCity").value.trim()) || "Hyderabad";
  const pickupDate = $("checkoutPickupDate").value;
  const returnDate = $("checkoutReturnDate").value;

  $("checkoutRouteTitle").textContent = `${pickupCity} → ${destCity}`;
  const days = calculateDaysDifference(pickupDate, returnDate);
  $("checkoutDurationBadge").textContent = `${days} Day${days === 1 ? "" : "s"}`;

  // Resolve road distance
  const distanceKm = await LocationService.resolveDistance(pickupCity, destCity);
  $("checkoutDistanceKm").textContent = `~${distanceKm} km estimated`;

  // Determine driving mode
  const isDriverSelected = $("optDriverRequired").classList.contains("selected");
  const drivingMode = isDriverSelected ? "driver" : "self";

  $("checkoutDriverFeeLabel").textContent = `+ ${PricingService.formatINR(car.driverDailyRate)}/day`;

  // Centralized pricing calculation
  const pricing = PricingService.calculateBookingPrice({
    car,
    days,
    distanceKm,
    drivingMode
  });

  appState.activeCheckoutDraft = {
    car,
    pickupCity,
    destCity,
    distanceKm,
    pickupDate,
    returnDate,
    days,
    drivingMode: pricing.drivingMode,
    pricing
  };

  // Populate Invoice Breakdown
  $("invoiceDailyRate").textContent = PricingService.formatINR(car.dailyRate);
  $("invoiceDays").textContent = days;
  $("invoiceBaseAmount").textContent = PricingService.formatINR(pricing.baseAmount);

  $("invoicePerKm").textContent = PricingService.formatINR(car.perKmRate);
  $("invoiceKm").textContent = distanceKm;
  $("invoiceDistanceAmount").textContent = PricingService.formatINR(pricing.distanceAmount);

  $("invoiceDriverAmount").textContent = PricingService.formatINR(pricing.driverAmount);
  $("invoiceTaxAmount").textContent = PricingService.formatINR(pricing.taxAmount);
  $("invoiceTotalAmount").textContent = PricingService.formatINR(pricing.totalAmount);

  // Side-by-side comparison
  $("compareSelfTotal").textContent = PricingService.formatINR(pricing.selfTotal);
  $("compareDriverTotal").textContent = PricingService.formatINR(pricing.driverTotal);
}

// Confirm Booking Form Submission
function handleConfirmBooking(e) {
  e.preventDefault();

  if (!appState.session || appState.session.role !== "user") {
    showToast("Please sign in as customer to book.", "error");
    return;
  }

  const draft = appState.activeCheckoutDraft;
  if (!draft) return;

  const paymentMethod = $("checkoutPaymentMethod").value;

  try {
    const booking = BookingService.createBooking({
      user: appState.session,
      car: draft.car,
      location: draft.pickupCity,
      destination: draft.destCity,
      distanceKm: draft.distanceKm,
      pickupDate: draft.pickupDate,
      returnDate: draft.returnDate,
      days: draft.days,
      drivingOption: draft.drivingMode,
      paymentMethod
    });

    closeModal("bookingModal");
    showToast(`Booking Successful! ID: ${booking.id} for ${draft.car.fullName}`, "success");

    // Redirect to customer dashboard
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });

    // Refresh inventory and dashboard
    renderCustomerDashboard();
    renderCarsCatalog();
  } catch (err) {
    showToast(err.message || "Failed to create booking.", "error");
  }
}

// =========================================================================
// CUSTOMER DASHBOARD
// =========================================================================
function renderCustomerDashboard() {
  if (!appState.session || appState.session.role !== "user") return;

  const user = appState.session;
  $("dashboardGreeting").textContent = `Welcome back, ${user.name}!`;
  $("dashboardUserMeta").textContent = `Customer ID: ${user.id} • ${user.city || "Vijayawada"} • ${user.phone || "-"}`;

  const stats = BookingService.getCustomerStats(user.id);
  $("statTotalBookings").textContent = stats.totalBookings;
  $("statActiveBookings").textContent = stats.active;
  $("statUpcomingBookings").textContent = stats.upcoming;
  $("statCompletedBookings").textContent = stats.completed;
  $("statTotalSpent").textContent = PricingService.formatINR(stats.totalSpent);

  const bookings = BookingService.getUserBookings(user.id);
  $("dashboardBookingsCount").textContent = `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`;

  const listContainer = $("customerBookingsList");
  if (!listContainer) return;

  if (bookings.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-bookings-box">
        <div class="empty-icon">🚗</div>
        <h3>No trips booked yet</h3>
        <p>Browse our verified fleet of 100+ vehicles and plan your first Indian road journey.</p>
        <button class="btn-primary" style="margin-top: 1rem;" onclick="switchView('cars')">Browse Cars Now</button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = bookings.map(b => {
    const statusClass = b.status.toLowerCase();
    const isCancellable = b.status !== "Cancelled" && b.status !== "Completed";

    return `
      <div class="booking-item-card">
        <div class="booking-car-thumb">
          <img src="${b.carImage || 'assets/cars/placeholder.svg'}" alt="${b.carName}" onerror="handleCarImageError(this, '')">
        </div>
        <div class="booking-item-details">
          <h4>${b.carName}</h4>
          <div class="booking-route-line">📍 ${b.location} → ${b.destination} (${b.distanceKm} km)</div>
          <div class="booking-meta-chips">
            <span class="booking-meta-chip">🪪 ID: ${b.id}</span>
            <span class="booking-meta-chip">📅 ${formatDateIndian(b.pickupDate)} → ${formatDateIndian(b.returnDate)} (${b.days}d)</span>
            <span class="booking-meta-chip">🧑 ${b.drivingOption}</span>
            <span class="booking-meta-chip">💳 ${b.payment}</span>
          </div>
          <div class="booking-fare-summary">
            Base: ${PricingService.formatINR(b.baseAmount)} • Distance: ${PricingService.formatINR(b.distanceAmount)} • Driver: ${PricingService.formatINR(b.driverAmount)} • GST: ${PricingService.formatINR(b.taxAmount)}
          </div>
        </div>
        <div class="booking-item-action">
          <span class="badge-status badge-${statusClass}">${b.status}</span>
          <div class="booking-total-amount">${PricingService.formatINR(b.amount)}</div>
          ${isCancellable ? `<button class="btn-danger" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;" onclick="handleCancelCustomerBooking('${b.id}')">Cancel Booking</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function handleCancelCustomerBooking(bookingId) {
  if (!confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;

  try {
    BookingService.cancelBooking(bookingId, appState.session.id);
    showToast(`Booking ${bookingId} has been cancelled.`, "info");
    renderCustomerDashboard();
    renderCarsCatalog();
  } catch (err) {
    showToast(err.message || "Could not cancel booking.", "error");
  }
}

// =========================================================================
// ADMIN CONTROL CENTRE
// =========================================================================
function renderAdminControlCentre() {
  if (!appState.session || appState.session.role !== "admin") return;

  const cars = CarService.getAllCars();
  const bookings = BookingService.getAllBookings();
  const customers = AuthService.getAllCustomers();

  const activeBookings = bookings.filter(b => b.status === "Active" || b.status === "Confirmed");
  const bookedCarIds = new Set(activeBookings.map(b => b.carId));
  const maintenanceCars = cars.filter(c => c.condition === "Needs Service" || c.condition === "Maintenance");
  const availableCars = cars.filter(c => c.availability && !bookedCarIds.has(c.id));
  const cancelledBookings = bookings.filter(b => b.status === "Cancelled");
  const totalRevenue = bookings
    .filter(b => b.status !== "Cancelled")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Update Admin KPI Cards
  $("kpiTotalVehicles").textContent = cars.length;
  $("kpiAvailableVehicles").textContent = availableCars.length;
  $("kpiBookedVehicles").textContent = bookedCarIds.size;
  $("kpiMaintenanceVehicles").textContent = maintenanceCars.length;
  $("kpiTotalCustomers").textContent = customers.length;
  $("kpiTotalBookings").textContent = bookings.length;
  $("kpiActiveBookings").textContent = activeBookings.length;
  $("kpiCancelledBookings").textContent = cancelledBookings.length;
  $("kpiTotalRevenue").textContent = PricingService.formatINR(totalRevenue);

  // Render Dynamic Condition Chart
  renderAdminConditionChart();

  // Render Booked Vehicles Table
  renderAdminBookedVehiclesTable(activeBookings);

  // Render Current Tab Content
  if (appState.activeAdminTab === "fleet") {
    renderAdminVehiclesTable();
  } else if (appState.activeAdminTab === "bookings") {
    renderAdminBookingsTable();
  } else if (appState.activeAdminTab === "customers") {
    renderAdminCustomersTable();
  }
}

// DYNAMIC VEHICLE CONDITION PIE / DOUGHNUT CHART
function renderAdminConditionChart() {
  const chartElement = $("conditionDoughnutChart");
  const legendElement = $("conditionChartLegend");
  const chartTotalVehicles = $("chartTotalVehicles");
  if (!chartElement || !legendElement) return;

  const counts = CarService.getConditionBreakdown();
  const cars = CarService.getAllCars();
  const total = Math.max(cars.length, 1);

  if (chartTotalVehicles) chartTotalVehicles.textContent = cars.length;

  const palette = {
    "Excellent": "#10b981",    // Emerald
    "Good": "#38bdf8",         // Sky Blue
    "Needs Service": "#fbbf24", // Amber
    "Maintenance": "#f87171"    // Rose Red
  };

  let currentAngle = 0;
  const gradientStops = Object.entries(counts).map(([cond, count]) => {
    const startPct = currentAngle;
    const slicePct = (count / total) * 100;
    currentAngle += slicePct;
    return `${palette[cond]} ${startPct.toFixed(1)}% ${currentAngle.toFixed(1)}%`;
  }).join(", ");

  chartElement.style.background = `conic-gradient(${gradientStops})`;

  legendElement.innerHTML = Object.entries(counts).map(([cond, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="chart-legend-item">
        <div style="display: flex; align-items: center;">
          <span class="legend-color-dot" style="background: ${palette[cond]};"></span>
          <span>${cond}</span>
        </div>
        <div>
          <strong>${count}</strong>
          <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.35rem;">(${pct}%)</span>
        </div>
      </div>
    `;
  }).join("");
}

// Booked Vehicles Mini Snapshot Table
function renderAdminBookedVehiclesTable(activeBookings) {
  const tbody = $("adminBookedVehiclesTableBody");
  if (!tbody) return;

  if (activeBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No vehicles are currently booked.</td></tr>`;
    return;
  }

  tbody.innerHTML = activeBookings.map(b => `
    <tr>
      <td><strong>${b.carName}</strong></td>
      <td>${b.customerName}</td>
      <td><code>${b.id}</code></td>
      <td>${b.location} → ${b.destination}</td>
      <td>${formatDateIndian(b.pickupDate)} → ${formatDateIndian(b.returnDate)}</td>
      <td><span class="badge-status badge-${b.status.toLowerCase()}">${b.status}</span></td>
    </tr>
  `).join("");
}

// Admin Tab 1: Fleet Management Table
function renderAdminVehiclesTable() {
  const tbody = $("adminVehiclesTableBody");
  if (!tbody) return;

  const searchQuery = ($("adminCarSearchInput")?.value || "").toLowerCase().trim();
  let cars = CarService.getAllCars();

  if (searchQuery) {
    cars = cars.filter(c => c.fullName.toLowerCase().includes(searchQuery) || c.type.toLowerCase().includes(searchQuery));
  }

  const activeBookings = BookingService.getAllBookings().filter(b => b.status === "Active" || b.status === "Confirmed");
  const bookedCarIds = new Set(activeBookings.map(b => b.carId));

  tbody.innerHTML = cars.map(car => {
    const isBooked = bookedCarIds.has(car.id);

    return `
      <tr>
        <td>
          <div class="table-car-cell">
            <img class="table-car-thumb" src="${car.image}" alt="${car.fullName}" onerror="handleCarImageError(this, '')">
            <div>
              <strong>${car.fullName}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${car.registrationNumber || "AP 16 DE 1000"}</div>
            </div>
          </div>
        </td>
        <td><span class="car-type-badge" style="position: static;">${car.type}</span></td>
        <td>
          <select class="condition-select" onchange="handleAdminUpdateCondition(${car.id}, this.value)">
            <option value="Excellent" ${car.condition === "Excellent" ? "selected" : ""}>Excellent</option>
            <option value="Good" ${car.condition === "Good" ? "selected" : ""}>Good</option>
            <option value="Needs Service" ${car.condition === "Needs Service" ? "selected" : ""}>Needs Service</option>
            <option value="Maintenance" ${car.condition === "Maintenance" ? "selected" : ""}>Maintenance</option>
          </select>
        </td>
        <td>${PricingService.formatINR(car.dailyRate)}</td>
        <td>${PricingService.formatINR(car.perKmRate)}/km</td>
        <td>${PricingService.formatINR(car.driverDailyRate)}</td>
        <td>
          <span class="badge-status ${isBooked ? "badge-active" : car.availability ? "badge-confirmed" : "badge-cancelled"}">
            ${isBooked ? "Booked" : car.availability ? "Available" : "Disabled"}
          </span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button class="action-btn-sm" onclick="openAdminEditVehicleModal(${car.id})">Edit</button>
            <button class="action-btn-sm" onclick="handleAdminToggleCar(${car.id})">${car.availability ? "Disable" : "Enable"}</button>
            <button class="action-btn-sm danger" onclick="handleAdminDeleteCar(${car.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Admin Tab 2: Bookings Management Table
function renderAdminBookingsTable() {
  const tbody = $("adminBookingsTableBody");
  if (!tbody) return;

  const bookings = BookingService.getAllBookings();

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No customer bookings recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><code>${b.id}</code></td>
      <td>
        <strong>${b.customerName}</strong>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${b.customerEmail}</div>
      </td>
      <td>${b.carName}</td>
      <td>
        ${b.location} → ${b.destination}
        <div style="font-size: 0.78rem; color: var(--accent);">${b.distanceKm} km estimated</div>
      </td>
      <td>
        ${formatDateIndian(b.pickupDate)} → ${formatDateIndian(b.returnDate)}
        <div style="font-size: 0.78rem; color: var(--text-muted);">${b.days} day${b.days === 1 ? "" : "s"}</div>
      </td>
      <td>${b.drivingOption}</td>
      <td><strong>${PricingService.formatINR(b.amount)}</strong></td>
      <td>${b.payment}</td>
      <td>
        <select class="status-select" onchange="handleAdminUpdateBookingStatus('${b.id}', this.value)">
          <option value="Pending" ${b.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Confirmed" ${b.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="Active" ${b.status === "Active" ? "selected" : ""}>Active</option>
          <option value="Completed" ${b.status === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${b.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join("");
}

// Admin Tab 3: Customer Directory Table
function renderAdminCustomersTable() {
  const tbody = $("adminCustomersTableBody");
  if (!tbody) return;

  const customers = AuthService.getAllCustomers();

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No registered customers yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.city}</td>
      <td><strong>${c.totalBookings}</strong></td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${PricingService.formatINR(c.totalSpent)}</td>
      <td>${formatDateIndian(c.lastBookingDate)}</td>
    </tr>
  `).join("");
}

// Admin Action Handlers
function handleAdminUpdateCondition(carId, newCondition) {
  CarService.updateCondition(carId, newCondition);
  showToast(`Vehicle condition updated to ${newCondition}`, "success");
  renderAdminControlCentre();
  renderCarsCatalog();
}

function handleAdminToggleCar(carId) {
  const newState = CarService.toggleAvailability(carId);
  showToast(`Vehicle is now ${newState ? "Available" : "Disabled"}`, "info");
  renderAdminControlCentre();
  renderCarsCatalog();
}

function handleAdminDeleteCar(carId) {
  const car = CarService.getCarById(carId);
  if (!car) return;
  if (!confirm(`Are you sure you want to delete ${car.fullName}?`)) return;

  CarService.deleteCar(carId);
  showToast(`${car.fullName} has been removed from inventory.`, "success");
  renderAdminControlCentre();
  renderCarsCatalog();
}

function handleAdminUpdateBookingStatus(bookingId, newStatus) {
  BookingService.updateStatus(bookingId, newStatus);
  showToast(`Booking ${bookingId} status updated to ${newStatus}.`, "success");
  renderAdminControlCentre();
  renderCustomerDashboard();
  renderCarsCatalog();
}

function openAdminEditVehicleModal(carId = null) {
  const modal = $("adminVehicleModal");
  const title = $("adminVehicleModalTitle");
  const form = $("adminVehicleForm");

  if (carId) {
    const car = CarService.getCarById(carId);
    if (!car) return;
    title.textContent = "Edit Vehicle Details";
    $("adminVehicleId").value = car.id;
    $("adminCarNameInput").value = car.fullName;
    $("adminCarTypeSelect").value = car.type;
    $("adminCarConditionSelect").value = car.condition || "Good";
    $("adminCarDailyRate").value = car.dailyRate;
    $("adminCarPerKmRate").value = car.perKmRate;
    $("adminCarDriverDaily").value = car.driverDailyRate;
    $("adminCarSeatsInput").value = car.seats;
    $("adminCarFuelSelect").value = car.fuel;
    $("adminCarTransSelect").value = car.transmission;
    $("adminCarImageInput").value = car.image;
  } else {
    title.textContent = "Add New Vehicle to Fleet";
    form.reset();
    $("adminVehicleId").value = "";
    $("adminCarDailyRate").value = 1800;
    $("adminCarPerKmRate").value = 10;
    $("adminCarDriverDaily").value = 750;
    $("adminCarSeatsInput").value = 5;
  }

  openModal("adminVehicleModal");
}

function handleSaveVehicleForm(e) {
  e.preventDefault();

  const id = $("adminVehicleId").value;
  const fullName = $("adminCarNameInput").value.trim();
  const brand = fullName.split(" ")[0];
  const model = fullName.split(" ").slice(1).join(" ") || fullName;

  const payload = {
    brand,
    model,
    fullName,
    type: $("adminCarTypeSelect").value,
    condition: $("adminCarConditionSelect").value,
    dailyRate: Number($("adminCarDailyRate").value),
    perKmRate: Number($("adminCarPerKmRate").value),
    driverDailyRate: Number($("adminCarDriverDaily").value),
    seats: Number($("adminCarSeatsInput").value),
    fuel: $("adminCarFuelSelect").value,
    transmission: $("adminCarTransSelect").value,
    image: $("adminCarImageInput").value.trim() || undefined
  };

  if (id) {
    CarService.updateCar(id, payload);
    showToast(`${fullName} updated successfully.`, "success");
  } else {
    CarService.addCar(payload);
    showToast(`New vehicle ${fullName} added to fleet.`, "success");
  }

  closeModal("adminVehicleModal");
  renderAdminControlCentre();
  renderCarsCatalog();
}

// =========================================================================
// AUTHENTICATION MODALS & FLOWS
// =========================================================================
function openAuthModal(mode = "login") {
  const tabLogin = $("tabAuthLogin");
  const tabReg = $("tabAuthRegister");
  const formLogin = $("customerLoginForm");
  const formReg = $("customerRegisterForm");

  if (mode === "login") {
    tabLogin.classList.add("active");
    tabReg.classList.remove("active");
    formLogin.classList.remove("hidden");
    formReg.classList.add("hidden");
  } else {
    tabLogin.classList.remove("active");
    tabReg.classList.add("active");
    formLogin.classList.add("hidden");
    formReg.classList.remove("hidden");
  }

  openModal("authModal");
}

function openAdminLoginModal() {
  openModal("adminLoginModal");
}

function handleCustomerLogin(e) {
  e.preventDefault();
  const email = $("loginEmailInput").value.trim();
  const password = $("loginPasswordInput").value;
  const rememberMe = $("loginRememberMe").checked;

  try {
    const session = AuthService.loginCustomer(email, password, rememberMe);
    appState.session = session;
    closeModal("authModal");
    showToast(`Welcome back, ${session.name}! Login successful.`, "success");

    renderHeader();
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast(err.message || "Invalid credentials.", "error");
  }
}

function handleCustomerRegister(e) {
  e.preventDefault();

  const name = $("regNameInput").value.trim();
  const phone = $("regPhoneInput").value.trim();
  const city = $("regCityInput").value.trim();
  const email = $("regEmailInput").value.trim();
  const password = $("regPasswordInput").value;
  const confirmPassword = $("regConfirmPasswordInput").value;
  const termsAccepted = $("regTermsCheckbox").checked;

  try {
    const session = AuthService.registerCustomer({
      name,
      email,
      phone,
      password,
      confirmPassword,
      city,
      termsAccepted
    });

    appState.session = session;
    closeModal("authModal");
    showToast(`Registration successful! Welcome to DriveEasy, ${session.name}.`, "success");

    $("customerRegisterForm").reset();
    renderHeader();
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast(err.message || "Registration failed.", "error");
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const email = $("adminEmailInput").value.trim();
  const password = $("adminPasswordInput").value;

  try {
    const session = AuthService.loginAdmin(email, password);
    appState.session = session;
    closeModal("adminLoginModal");
    showToast("Admin access authenticated successfully.", "success");

    renderHeader();
    switchView("admin");
    $("adminControlSection")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast(err.message || "Admin authentication failed.", "error");
  }
}

function handleLogout() {
  const oldName = appState.session?.name || "User";
  AuthService.logout();
  appState.session = null;
  showToast(`${oldName} logged out successfully.`, "info");

  renderHeader();
  switchView("portal");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================================
// EVENT LISTENERS WIRING
// =========================================================================
function setupEventListeners() {
  // Brand Logo Click -> Reset to top
  $("logoLink")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Entry Screen 3-Way Portal Buttons
  $("portalLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  $("portalRegisterBtn")?.addEventListener("click", () => openAuthModal("register"));
  $("portalAdminBtn")?.addEventListener("click", openAdminLoginModal);

  // Customer Hero Buttons
  $("heroBrowseCarsBtn")?.addEventListener("click", () => {
    $("carsSection")?.scrollIntoView({ behavior: "smooth" });
  });
  $("heroViewDashboardBtn")?.addEventListener("click", () => {
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });
  });

  // Nav Links
  $("navHome")?.addEventListener("click", e => {
    e.preventDefault();
    if (!appState.session) switchView("portal");
    else if (appState.session.role === "admin") switchView("admin");
    else switchView("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("navCars")?.addEventListener("click", e => {
    e.preventDefault();
    switchView("cars");
  });

  $("navDashboard")?.addEventListener("click", e => {
    e.preventDefault();
    switchView("dashboard");
    $("customerDashboardSection")?.scrollIntoView({ behavior: "smooth" });
  });

  $("navAdmin")?.addEventListener("click", e => {
    e.preventDefault();
    switchView("admin");
    $("adminControlSection")?.scrollIntoView({ behavior: "smooth" });
  });

  $("footerAdminLink")?.addEventListener("click", e => {
    e.preventDefault();
    if (appState.session?.role === "admin") {
      switchView("admin");
      $("adminControlSection")?.scrollIntoView({ behavior: "smooth" });
    } else {
      openAdminLoginModal();
    }
  });

  // Search Form Submit
  $("carSearchForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    await updateSearchRouteDisplay();
    $("carsSection")?.scrollIntoView({ behavior: "smooth" });
  });

  // Search Form Reset
  $("searchResetBtn")?.addEventListener("click", () => {
    $("pickupCityInput").value = "Vijayawada";
    $("destCityInput").value = "Hyderabad";
    $("carTypeSelect").value = "All Cars";
    $("pickupDateInput").value = getTomorrowString(1);
    $("returnDateInput").value = getTomorrowString(2);
    updateSearchRouteDisplay();
    resetSearchFilters();
  });

  // Car Type dropdown in search box syncs with category tabs
  $("carTypeSelect")?.addEventListener("change", e => {
    appState.search.type = e.target.value;
    document.querySelectorAll("#typeFilterTabs .filter-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === e.target.value);
    });
    renderCarsCatalog();
  });

  // Category Filter Tabs
  document.querySelectorAll("#typeFilterTabs .filter-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#typeFilterTabs .filter-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.search.type = btn.dataset.type;
      $("carTypeSelect").value = btn.dataset.type;
      renderCarsCatalog();
    });
  });

  // Fuel, Transmission, Sort, Search Filters
  $("fuelFilterSelect")?.addEventListener("change", e => {
    appState.search.fuel = e.target.value;
    renderCarsCatalog();
  });

  $("transFilterSelect")?.addEventListener("change", e => {
    appState.search.transmission = e.target.value;
    renderCarsCatalog();
  });

  $("sortCarsSelect")?.addEventListener("change", e => {
    appState.search.sortBy = e.target.value;
    renderCarsCatalog();
  });

  $("carModelSearchInput")?.addEventListener("input", e => {
    appState.search.query = e.target.value;
    renderCarsCatalog();
  });

  // Dashboard buttons
  $("dashboardQuickBookBtn")?.addEventListener("click", () => {
    $("carsSection")?.scrollIntoView({ behavior: "smooth" });
  });
  $("dashboardRefreshBtn")?.addEventListener("click", () => {
    renderCustomerDashboard();
    showToast("Dashboard refreshed.", "info");
  });

  // Checkout Modal Driving Mode Toggle
  $("optSelfDrive")?.addEventListener("click", () => setDrivingModeOption("self"));
  $("optDriverRequired")?.addEventListener("click", () => setDrivingModeOption("driver"));

  // Checkout Modal dynamic recalculations on input change
  $("checkoutPickupCity")?.addEventListener("change", recalculateCheckoutBill);
  $("checkoutDestCity")?.addEventListener("change", recalculateCheckoutBill);
  $("checkoutPickupDate")?.addEventListener("change", recalculateCheckoutBill);
  $("checkoutReturnDate")?.addEventListener("change", recalculateCheckoutBill);

  // Confirm Booking Submit
  $("bookingCheckoutForm")?.addEventListener("submit", handleConfirmBooking);

  // Car Details Modal buttons
  $("detailsBookNowBtn")?.addEventListener("click", () => {
    if (appState.activeCarForModal) initiateCarBooking(appState.activeCarForModal.id);
  });
  $("detailsCloseBtn")?.addEventListener("click", () => closeModal("carDetailsModal"));

  // Auth Modal Forms
  $("customerLoginForm")?.addEventListener("submit", handleCustomerLogin);
  $("customerRegisterForm")?.addEventListener("submit", handleCustomerRegister);
  $("adminLoginForm")?.addEventListener("submit", handleAdminLogin);

  $("tabAuthLogin")?.addEventListener("click", () => openAuthModal("login"));
  $("tabAuthRegister")?.addEventListener("click", () => openAuthModal("register"));
  $("forgotPasswordLink")?.addEventListener("click", e => {
    e.preventDefault();
    showToast("For demo purposes, use demo customer password Aarav@123 or reset via localStorage.", "info");
  });

  // Admin Modal Forms & Tabs
  $("adminAddCarBtn")?.addEventListener("click", () => openAdminEditVehicleModal());
  $("adminRefreshBtn")?.addEventListener("click", () => {
    renderAdminControlCentre();
    showToast("Admin statistics refreshed.", "info");
  });
  $("adminLogoutBtn")?.addEventListener("click", handleLogout);
  $("adminVehicleForm")?.addEventListener("submit", handleSaveVehicleForm);

  $("adminCarSearchInput")?.addEventListener("input", renderAdminVehiclesTable);

  $("tabBtnFleet")?.addEventListener("click", () => switchAdminTab("fleet"));
  $("tabBtnBookings")?.addEventListener("click", () => switchAdminTab("bookings"));
  $("tabBtnCustomers")?.addEventListener("click", () => switchAdminTab("customers"));

  // SDC Specs Modal
  $("navSystemInfo")?.addEventListener("click", e => {
    e.preventDefault();
    openModal("systemSpecsModal");
  });
  $("closeSystemSpecsModalBtn")?.addEventListener("click", () => closeModal("systemSpecsModal"));
  $("systemSpecsOkBtn")?.addEventListener("click", () => closeModal("systemSpecsModal"));

  // Modal Close Buttons
  $("closeAuthModalBtn")?.addEventListener("click", () => closeModal("authModal"));
  $("closeAdminLoginModalBtn")?.addEventListener("click", () => closeModal("adminLoginModal"));
  $("closeBookingModalBtn")?.addEventListener("click", () => closeModal("bookingModal"));
  $("closeCarDetailsModalBtn")?.addEventListener("click", () => closeModal("carDetailsModal"));
  $("closeAdminVehicleModalBtn")?.addEventListener("click", () => closeModal("adminVehicleModal"));

  // Close modals on clicking backdrop
  document.querySelectorAll(".modal-backdrop, .modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function switchAdminTab(tabName) {
  appState.activeAdminTab = tabName;

  $("tabBtnFleet")?.classList.toggle("active", tabName === "fleet");
  $("tabBtnBookings")?.classList.toggle("active", tabName === "bookings");
  $("tabBtnCustomers")?.classList.toggle("active", tabName === "customers");

  $("adminFleetTabContent")?.classList.toggle("hidden", tabName !== "fleet");
  $("adminBookingsTabContent")?.classList.toggle("hidden", tabName !== "bookings");
  $("adminCustomersTabContent")?.classList.toggle("hidden", tabName !== "customers");

  renderAdminControlCentre();
}
