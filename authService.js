/**
 * DriveEasy – Authentication & User Management Service
 * Manages customer registration, login, session persistence, and distinct Admin access.
 */

const AuthService = {
  getCurrentUser() {
    return StorageService.getSession();
  },

  isAdmin() {
    const session = this.getCurrentUser();
    return !!session && session.role === "admin";
  },

  loginCustomer(email, password, rememberMe = false) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      throw new Error("Please enter both email and password.");
    }

    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);

    if (!user) {
      throw new Error("Invalid email or password. Please check your credentials.");
    }

    if (user.role === "admin") {
      throw new Error("This is an administrative account. Please use the Admin Portal.");
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city || "Vijayawada",
      role: "user",
      loginAt: new Date().toISOString()
    };

    StorageService.saveSession(session);
    return session;
  },

  loginAdmin(email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      throw new Error("Please enter admin credentials.");
    }

    const users = StorageService.getUsers();
    const admin = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword && u.role === "admin");

    if (!admin) {
      throw new Error("Invalid administrative credentials. Access restricted.");
    }

    const session = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: "admin",
      loginAt: new Date().toISOString()
    };

    StorageService.saveSession(session);
    return session;
  },

  registerCustomer({ name, email, phone, password, confirmPassword, city, termsAccepted }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone || "").trim();
    const cleanCity = String(city || "").trim();

    if (!cleanName || cleanName.length < 3) {
      throw new Error("Please enter a valid full name (at least 3 characters).");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(cleanPhone)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      throw new Error("Password and confirm password do not match.");
    }

    if (!cleanCity) {
      throw new Error("Please enter your city.");
    }

    if (!termsAccepted) {
      throw new Error("You must accept the Terms & Conditions to register.");
    }

    const users = StorageService.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    const newUser = {
      id: `U${Math.floor(1000 + Math.random() * 9000)}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: password,
      city: cleanCity,
      role: "user",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageService.saveUsers(users);

    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      city: newUser.city,
      role: "user",
      loginAt: new Date().toISOString()
    };

    StorageService.saveSession(session);
    return session;
  },

  logout() {
    StorageService.clearSession();
  },

  getAllCustomers() {
    const users = StorageService.getUsers();
    const bookings = StorageService.getBookings();

    return users
      .filter(u => u.role === "user")
      .map(u => {
        const userBookings = bookings.filter(b => b.userId === u.id);
        const totalSpent = userBookings
          .filter(b => b.status !== "Cancelled")
          .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        const lastBooking = userBookings.length ? userBookings[0] : null;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          city: u.city || "-",
          totalBookings: userBookings.length,
          totalSpent,
          lastBookingDate: lastBooking ? lastBooking.pickupDate : "-"
        };
      });
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AuthService };
}
