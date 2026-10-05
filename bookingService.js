/**
 * DriveEasy – Booking Service
 * Handles booking creation, date conflict checks, cancellations, and status transitions.
 */

const BookingService = {
  getAllBookings() {
    return StorageService.getBookings();
  },

  getUserBookings(userId) {
    const bookings = this.getAllBookings();
    return bookings.filter(b => b.userId === userId);
  },

  isCarBookedForDates(carId, pickupDate, returnDate) {
    if (!pickupDate || !returnDate) return false;
    const bookings = this.getAllBookings();

    return bookings.some(b => {
      if (b.carId !== Number(carId)) return false;
      if (b.status === "Cancelled") return false;

      // Check date overlap: Not overlapping if returnDate <= b.pickupDate OR pickupDate >= b.returnDate
      const noOverlap = (returnDate <= b.pickupDate) || (pickupDate >= b.returnDate);
      return !noOverlap;
    });
  },

  createBooking({ user, car, location, destination, distanceKm, pickupDate, returnDate, days, drivingOption, paymentMethod }) {
    if (!user) throw new Error("Customer authentication required to book.");
    if (!car) throw new Error("Invalid vehicle selected.");
    if (this.isCarBookedForDates(car.id, pickupDate, returnDate)) {
      throw new Error("This vehicle is already booked for the selected date range. Please select another car or adjust your dates.");
    }

    const pricing = PricingService.calculateBookingPrice({
      car,
      days,
      distanceKm,
      drivingMode: drivingOption
    });

    const bookingId = `DE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = {
      id: bookingId,
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      carId: car.id,
      carName: car.fullName || car.name,
      carImage: car.image,
      brand: car.brand,
      carType: car.type,
      location,
      destination,
      distanceKm: pricing.distanceKm,
      pickupDate,
      returnDate,
      days: pricing.days,
      drivingOption: pricing.drivingMode,
      dailyRate: pricing.dailyRate,
      perKmRate: pricing.perKmRate,
      driverDailyRate: pricing.driverDailyRate,
      baseAmount: pricing.baseAmount,
      distanceAmount: pricing.distanceAmount,
      driverAmount: pricing.driverAmount,
      taxAmount: pricing.taxAmount,
      amount: pricing.totalAmount,
      payment: paymentMethod || "UPI",
      status: "Confirmed",
      paymentStatus: "Completed",
      createdAt: new Date().toISOString()
    };

    const bookings = this.getAllBookings();
    bookings.unshift(newBooking);
    StorageService.saveBookings(bookings);

    return newBooking;
  },

  updateStatus(bookingId, newStatus) {
    const bookings = this.getAllBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return false;

    bookings[index].status = newStatus;
    StorageService.saveBookings(bookings);
    return true;
  },

  cancelBooking(bookingId, userId = null) {
    const bookings = this.getAllBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    if (userId && booking.userId !== userId) {
      throw new Error("Unauthorized to cancel this booking.");
    }

    booking.status = "Cancelled";
    StorageService.saveBookings(bookings);
    return true;
  },

  getCustomerStats(userId) {
    const userBookings = this.getUserBookings(userId);
    const totalBookings = userBookings.length;
    const active = userBookings.filter(b => b.status === "Active" || b.status === "Confirmed").length;
    const completed = userBookings.filter(b => b.status === "Completed").length;
    const cancelled = userBookings.filter(b => b.status === "Cancelled").length;
    const totalSpent = userBookings
      .filter(b => b.status !== "Cancelled")
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    const now = new Date().toISOString().split("T")[0];
    const upcoming = userBookings.filter(b => b.status !== "Cancelled" && b.pickupDate >= now).length;

    return {
      totalBookings,
      active,
      upcoming,
      completed,
      cancelled,
      totalSpent
    };
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BookingService };
}
