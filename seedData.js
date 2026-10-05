/**
 * DriveEasy – Seed Users and Initial Bookings
 * Provides realistic demo accounts and booking history for customer & admin dashboards.
 */

const SEED_USERS = [
  {
    id: "U1001",
    name: "Aarav Kumar",
    phone: "9876543210",
    email: "aarav@gmail.com",
    password: "Aarav@123",
    city: "Vijayawada",
    role: "user"
  },
  {
    id: "U1002",
    name: "Saanvi Reddy",
    phone: "9123456789",
    email: "saanvi@gmail.com",
    password: "Saanvi@123",
    city: "Hyderabad",
    role: "user"
  },
  {
    id: "U1003",
    name: "Rahul Sharma",
    phone: "9811223344",
    email: "rahul@gmail.com",
    password: "Rahul@123",
    city: "Bengaluru",
    role: "user"
  },
  {
    id: "U1004",
    name: "Priya Nair",
    phone: "9744556677",
    email: "priya@gmail.com",
    password: "Priya@123",
    city: "Chennai",
    role: "user"
  },
  {
    id: "U1005",
    name: "Vikram Varma",
    phone: "9955112233",
    email: "vikram@gmail.com",
    password: "Vikram@123",
    city: "Visakhapatnam",
    role: "user"
  },
  {
    id: "A1001",
    name: "Srinivas Reddy",
    phone: "9988776655",
    email: "admin@driveeasy.in",
    password: "Admin@123",
    city: "Vijayawada",
    role: "admin"
  }
];

const SEED_BOOKINGS = [
  {
    id: "DE-882104",
    userId: "U1001",
    customerName: "Aarav Kumar",
    customerEmail: "aarav@gmail.com",
    carId: 35, // Hyundai Creta
    carName: "Hyundai New Creta SX (O)",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/2024_Hyundai_Creta_SX_%28O%29_front_view.jpg/640px-2024_Hyundai_Creta_SX_%28O%29_front_view.jpg",
    location: "Vijayawada",
    destination: "Hyderabad",
    distanceKm: 295,
    pickupDate: "2026-09-22",
    returnDate: "2026-09-24",
    days: 2,
    drivingOption: "Self Driving",
    baseAmount: 4000,
    distanceAmount: 3245,
    driverAmount: 0,
    taxAmount: 362,
    amount: 7607,
    payment: "UPI",
    status: "Confirmed",
    createdAt: "2026-09-21T08:30:00.000Z"
  },
  {
    id: "DE-741982",
    userId: "U1001",
    customerName: "Aarav Kumar",
    customerEmail: "aarav@gmail.com",
    carId: 18, // Maruti Swift
    carName: "Maruti Suzuki New Swift ZXi+",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/2024_Suzuki_Swift_front.jpg/640px-2024_Suzuki_Swift_front.jpg",
    location: "Vijayawada",
    destination: "Guntur",
    distanceKm: 35,
    pickupDate: "2026-09-15",
    returnDate: "2026-09-16",
    days: 1,
    drivingOption: "Self Driving",
    baseAmount: 1250,
    distanceAmount: 298,
    driverAmount: 0,
    taxAmount: 77,
    amount: 1625,
    payment: "Debit / Credit Card",
    status: "Completed",
    createdAt: "2026-09-14T10:15:00.000Z"
  },
  {
    id: "DE-619043",
    userId: "U1002",
    customerName: "Saanvi Reddy",
    customerEmail: "saanvi@gmail.com",
    carId: 58, // Toyota Fortuner
    carName: "Toyota Fortuner 4x4 AT",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/2021_Toyota_Fortuner_2.8_VRZ_front.jpg/640px-2021_Toyota_Fortuner_2.8_VRZ_front.jpg",
    location: "Hyderabad",
    destination: "Warangal",
    distanceKm: 148,
    pickupDate: "2026-09-21",
    returnDate: "2026-09-23",
    days: 2,
    drivingOption: "Driver Required",
    baseAmount: 7600,
    distanceAmount: 2664,
    driverAmount: 2000,
    taxAmount: 613,
    amount: 12877,
    payment: "UPI",
    status: "Active",
    createdAt: "2026-09-20T14:40:00.000Z"
  },
  {
    id: "DE-553219",
    userId: "U1003",
    customerName: "Rahul Sharma",
    customerEmail: "rahul@gmail.com",
    carId: 93, // BMW 3 Series
    carName: "BMW 3 Series Gran Limousine 330Li M Sport",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2023_BMW_330Li_M_Sport_LCI_front.jpg/640px-2023_BMW_330Li_M_Sport_LCI_front.jpg",
    location: "Bengaluru",
    destination: "Mysuru",
    distanceKm: 145,
    pickupDate: "2026-09-25",
    returnDate: "2026-09-27",
    days: 2,
    drivingOption: "Self Driving",
    baseAmount: 11600,
    distanceAmount: 3770,
    driverAmount: 0,
    taxAmount: 769,
    amount: 16139,
    payment: "Net Banking",
    status: "Confirmed",
    createdAt: "2026-09-21T09:12:00.000Z"
  },
  {
    id: "DE-492107",
    userId: "U1004",
    customerName: "Priya Nair",
    customerEmail: "priya@gmail.com",
    carId: 56, // Toyota Innova Crysta
    carName: "Toyota Innova Crysta 2.4 VX",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/2016_Toyota_Innova_2.4_V_front.jpg/640px-2016_Toyota_Innova_2.4_V_front.jpg",
    location: "Chennai",
    destination: "Puducherry",
    distanceKm: 152,
    pickupDate: "2026-09-23",
    returnDate: "2026-09-26",
    days: 3,
    drivingOption: "Driver Required",
    baseAmount: 7800,
    distanceAmount: 2128,
    driverAmount: 2700,
    taxAmount: 631,
    amount: 13259,
    payment: "UPI",
    status: "Confirmed",
    createdAt: "2026-09-20T18:00:00.000Z"
  },
  {
    id: "DE-310842",
    userId: "U1005",
    customerName: "Vikram Varma",
    customerEmail: "vikram@gmail.com",
    carId: 46, // Mahindra Thar
    carName: "Mahindra Thar LX 4x4 Hard Top",
    carImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/2020_Mahindra_Thar_LX_Hard_Top_front_view.jpg/640px-2020_Mahindra_Thar_LX_Hard_Top_front_view.jpg",
    location: "Visakhapatnam",
    destination: "Araku",
    distanceKm: 115,
    pickupDate: "2026-09-10",
    returnDate: "2026-09-12",
    days: 2,
    drivingOption: "Self Driving",
    baseAmount: 4300,
    distanceAmount: 1438,
    driverAmount: 0,
    taxAmount: 287,
    amount: 6025,
    payment: "Cash on Pickup",
    status: "Cancelled",
    createdAt: "2026-09-08T11:20:00.000Z"
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SEED_USERS, SEED_BOOKINGS };
}
