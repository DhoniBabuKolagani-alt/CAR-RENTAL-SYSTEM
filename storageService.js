/**
 * DriveEasy – Storage Service
 * Centralizes persistence layer with inventory versioning to prevent the "0 cars" bug.
 */

const INVENTORY_VERSION = "2026-v12-driveeasy-real-cars";

const StorageService = {
  versionKey: "driveeasy_inventory_version",
  carsKey: "driveeasy_cars",
  usersKey: "driveeasy_users",
  bookingsKey: "driveeasy_bookings",
  sessionKey: "driveeasy_session",

  init() {
    const currentVersion = localStorage.getItem(this.versionKey);
    const existingCars = this.readJSON(this.carsKey, null);

    // Resolve data sources whether in browser globals or modular environment
    const initialCars = typeof CARS_DATA !== "undefined" ? CARS_DATA : (typeof require !== "undefined" ? require("../data/carsData.js").CARS_DATA : []);
    const initialUsers = typeof SEED_USERS !== "undefined" ? SEED_USERS : (typeof require !== "undefined" ? require("../data/seedData.js").SEED_USERS : []);
    const initialBookings = typeof SEED_BOOKINGS !== "undefined" ? SEED_BOOKINGS : (typeof require !== "undefined" ? require("../data/seedData.js").SEED_BOOKINGS : []);

    // Initialize or re-sync if version changed, data missing, or empty inventory
    if (currentVersion !== INVENTORY_VERSION || !Array.isArray(existingCars) || existingCars.length < 50) {
      console.info(`[DriveEasy] Initializing fresh inventory version ${INVENTORY_VERSION}...`);
      localStorage.setItem(this.versionKey, INVENTORY_VERSION);
      this.saveJSON(this.carsKey, initialCars);
    }

    // Ensure seed users exist
    const existingUsers = this.readJSON(this.usersKey, null);
    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      this.saveJSON(this.usersKey, initialUsers);
    } else {
      // Ensure admin exists
      const adminExists = existingUsers.some(u => u.email === "admin@driveeasy.in");
      if (!adminExists) {
        const adminUser = initialUsers.find(u => u.role === "admin");
        if (adminUser) {
          existingUsers.push(adminUser);
          this.saveJSON(this.usersKey, existingUsers);
        }
      }
    }

    // Ensure seed bookings exist
    const existingBookings = this.readJSON(this.bookingsKey, null);
    if (!Array.isArray(existingBookings) || existingBookings.length === 0) {
      this.saveJSON(this.bookingsKey, initialBookings);
    }
  },

  readJSON(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : (fallback ? structuredClone(fallback) : null);
    } catch (err) {
      console.warn(`[StorageService] Error reading ${key}:`, err);
      return fallback ? structuredClone(fallback) : null;
    }
  },

  saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`[StorageService] Error writing ${key}:`, err);
    }
  },

  getDefaultCars() {
    return typeof CARS_DATA !== "undefined" ? CARS_DATA : (typeof require !== "undefined" ? require("../data/carsData.js").CARS_DATA : []);
  },

  getDefaultUsers() {
    return typeof SEED_USERS !== "undefined" ? SEED_USERS : (typeof require !== "undefined" ? require("../data/seedData.js").SEED_USERS : []);
  },

  getDefaultBookings() {
    return typeof SEED_BOOKINGS !== "undefined" ? SEED_BOOKINGS : (typeof require !== "undefined" ? require("../data/seedData.js").SEED_BOOKINGS : []);
  },

  getCars() {
    const defaultCars = this.getDefaultCars();
    const cars = this.readJSON(this.carsKey, null);
    if (!Array.isArray(cars) || cars.length === 0) {
      this.saveJSON(this.carsKey, defaultCars);
      return structuredClone(defaultCars);
    }
    return cars;
  },

  saveCars(cars) {
    this.saveJSON(this.carsKey, cars);
  },

  getUsers() {
    const defaultUsers = this.getDefaultUsers();
    const users = this.readJSON(this.usersKey, defaultUsers);
    return Array.isArray(users) && users.length ? users : structuredClone(defaultUsers);
  },

  saveUsers(users) {
    this.saveJSON(this.usersKey, users);
  },

  getBookings() {
    const defaultBookings = this.getDefaultBookings();
    const bookings = this.readJSON(this.bookingsKey, defaultBookings);
    return Array.isArray(bookings) ? bookings : [];
  },

  saveBookings(bookings) {
    this.saveJSON(this.bookingsKey, bookings);
  },

  getSession() {
    return this.readJSON(this.sessionKey, null);
  },

  saveSession(session) {
    this.saveJSON(this.sessionKey, session);
  },

  clearSession() {
    localStorage.removeItem(this.sessionKey);
  },

  resetInventory() {
    localStorage.setItem(this.versionKey, INVENTORY_VERSION);
    this.saveJSON(this.carsKey, CARS_DATA);
    return structuredClone(CARS_DATA);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { StorageService, INVENTORY_VERSION };
}
