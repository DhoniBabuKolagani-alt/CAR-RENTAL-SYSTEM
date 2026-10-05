/**
 * DriveEasy – Car Service
 * Manages vehicle queries, filtering, sorting, admin inventory CRUD, and condition updates.
 */

const CarService = {
  getAllCars() {
    return StorageService.getCars();
  },

  getCarById(id) {
    const cars = this.getAllCars();
    return cars.find(c => c.id === Number(id));
  },

  filterCars({ type = "All Cars", fuel = "All", transmission = "All", seats = "All", sortBy = "popular", searchQuery = "" }) {
    let cars = this.getAllCars();

    // Car Type filter
    if (type && type !== "All Cars" && type !== "All") {
      cars = cars.filter(c => c.type.toLowerCase() === type.toLowerCase());
    }

    // Fuel filter
    if (fuel && fuel !== "All") {
      cars = cars.filter(c => c.fuel.toLowerCase() === fuel.toLowerCase());
    }

    // Transmission filter
    if (transmission && transmission !== "All") {
      cars = cars.filter(c => c.transmission.toLowerCase() === transmission.toLowerCase());
    }

    // Seats filter
    if (seats && seats !== "All") {
      const seatNum = parseInt(seats, 10);
      if (!isNaN(seatNum)) {
        if (seatNum >= 7) cars = cars.filter(c => c.seats >= 7);
        else cars = cars.filter(c => c.seats === seatNum);
      }
    }

    // Search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cars = cars.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    }

    // Sorting
    cars = [...cars].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.dailyRate - b.dailyRate;
        case "price-desc":
          return b.dailyRate - a.dailyRate;
        case "seats":
          return b.seats - a.seats;
        case "newest":
          return (b.year || 2024) - (a.year || 2024);
        case "popular":
        default:
          return (b.id % 7) - (a.id % 7); // deterministic pseudo popularity
      }
    });

    return cars;
  },

  addCar(carData) {
    const cars = this.getAllCars();
    const newId = cars.length ? Math.max(...cars.map(c => c.id)) + 1 : 1;

    const newCar = {
      id: newId,
      brand: carData.brand || carData.name.split(" ")[0],
      model: carData.model || carData.name.split(" ").slice(1).join(" "),
      fullName: carData.fullName || carData.name,
      type: carData.type || "Sedan",
      fuel: carData.fuel || "Petrol",
      transmission: carData.transmission || "Automatic",
      seats: Number(carData.seats) || 5,
      dailyRate: Number(carData.dailyRate || carData.rate) || 1500,
      perKmRate: Number(carData.perKmRate || carData.ratePerKm) || 10,
      driverDailyRate: Number(carData.driverDailyRate || carData.driverDaily) || 750,
      image: carData.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Tata_Nano_GenX_front.jpg/640px-Tata_Nano_GenX_front.jpg",
      imageQuery: carData.imageQuery || carData.fullName || carData.name,
      availability: carData.availability !== false,
      condition: carData.condition || "Good",
      registrationNumber: carData.registrationNumber || `AP 16 DE ${1000 + newId}`,
      year: Number(carData.year) || 2024,
      description: carData.description || "Reliable and verified rental vehicle ready for urban and highway travel."
    };

    cars.unshift(newCar);
    StorageService.saveCars(cars);
    return newCar;
  },

  updateCar(id, carData) {
    const cars = this.getAllCars();
    const index = cars.findIndex(c => c.id === Number(id));
    if (index === -1) return null;

    cars[index] = {
      ...cars[index],
      ...carData,
      id: Number(id),
      dailyRate: Number(carData.dailyRate || cars[index].dailyRate),
      perKmRate: Number(carData.perKmRate || cars[index].perKmRate),
      driverDailyRate: Number(carData.driverDailyRate || cars[index].driverDailyRate),
      seats: Number(carData.seats || cars[index].seats)
    };

    StorageService.saveCars(cars);
    return cars[index];
  },

  deleteCar(id) {
    let cars = this.getAllCars();
    cars = cars.filter(c => c.id !== Number(id));
    StorageService.saveCars(cars);
    return true;
  },

  toggleAvailability(id) {
    const cars = this.getAllCars();
    const car = cars.find(c => c.id === Number(id));
    if (!car) return null;

    car.availability = !car.availability;
    StorageService.saveCars(cars);
    return car.availability;
  },

  updateCondition(id, newCondition) {
    const cars = this.getAllCars();
    const car = cars.find(c => c.id === Number(id));
    if (!car) return null;

    car.condition = newCondition;
    StorageService.saveCars(cars);
    return car.condition;
  },

  getConditionBreakdown() {
    const cars = this.getAllCars();
    const counts = {
      "Excellent": 0,
      "Good": 0,
      "Needs Service": 0,
      "Maintenance": 0
    };

    cars.forEach(c => {
      let cond = c.condition || "Good";
      if (cond === "Under Maintenance" || cond === "In Service") cond = "Maintenance";
      if (counts[cond] !== undefined) {
        counts[cond]++;
      } else {
        counts["Good"]++;
      }
    });

    return counts;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CarService };
}
