/**
 * DriveEasy – Pricing Service
 * Centralized, completely transparent pricing calculator used consistently across
 * vehicle cards, details modal, checkout invoice, customer dashboard, and admin console.
 */

const PricingService = {
  TAX_RATE: 0.05, // 5% GST

  calculateBookingPrice({ car, days = 1, distanceKm = 0, drivingMode = "self", applyTax = true }) {
    if (!car) {
      return {
        dailyRate: 0,
        perKmRate: 0,
        driverDailyRate: 0,
        days: 1,
        distanceKm: 0,
        drivingMode: "self",
        baseAmount: 0,
        distanceAmount: 0,
        driverAmount: 0,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        selfSubtotal: 0,
        selfTotal: 0,
        driverSubtotal: 0,
        driverTotal: 0
      };
    }

    const safeDays = Math.max(1, parseInt(days, 10) || 1);
    const safeDistance = Math.max(0, parseFloat(distanceKm) || 0);
    const isDriver = drivingMode === "driver" || drivingMode === "Driver Required";

    const dailyRate = Number(car.dailyRate || car.rate || 0);
    const perKmRate = Number(car.perKmRate || car.ratePerKm || 0);
    const driverDailyRate = Number(car.driverDailyRate || car.driverDaily || 700);

    const baseAmount = Math.round(dailyRate * safeDays);
    const distanceAmount = Math.round(perKmRate * safeDistance);
    const driverAmount = isDriver ? Math.round(driverDailyRate * safeDays) : 0;

    const subtotal = baseAmount + distanceAmount + driverAmount;
    const taxAmount = applyTax ? Math.round(subtotal * this.TAX_RATE) : 0;
    const totalAmount = subtotal + taxAmount;

    // Self driving calculation
    const selfSubtotal = baseAmount + distanceAmount;
    const selfTax = applyTax ? Math.round(selfSubtotal * this.TAX_RATE) : 0;
    const selfTotal = selfSubtotal + selfTax;

    // With driver calculation
    const driverSubtotal = baseAmount + distanceAmount + Math.round(driverDailyRate * safeDays);
    const driverTax = applyTax ? Math.round(driverSubtotal * this.TAX_RATE) : 0;
    const driverTotal = driverSubtotal + driverTax;

    return {
      dailyRate,
      perKmRate,
      driverDailyRate,
      days: safeDays,
      distanceKm: safeDistance,
      drivingMode: isDriver ? "Driver Required" : "Self Driving",
      baseAmount,
      distanceAmount,
      driverAmount,
      subtotal,
      taxAmount,
      totalAmount,
      selfSubtotal,
      selfTotal,
      driverSubtotal,
      driverTotal
    };
  },

  formatINR(amount) {
    const num = Number(amount || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PricingService };
}
