const { faker } = require("@faker-js/faker");
const db = require("../src/config/firebaseAdmin");

const CITIES = [
  "Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Brasov",
  "Sibiu", "Arad", "Oradea", "Targu Mures", "Baia Mare",
  "Suceava", "Constanta", "Craiova", "Pitesti", "Ploiesti",
  "Budapest", "Debrecen", "Szeged",
  "Vienna", "Graz", "Linz",
  "Prague", "Brno",
  "Munich", "Nuremberg", "Frankfurt", "Stuttgart", "Berlin",
  "Milan", "Venice", "Florence", "Rome", "Bologna", "Naples",
  "Paris", "Lyon", "Marseille", "Nice",
  "Ljubljana", "Zagreb", "Split",
  "Belgrade", "Novi Sad",
  "Bratislava", "Krakow", "Warsaw"
];

function getRandomCity(exclude = []) {
  return faker.helpers.arrayElement(
    CITIES.filter(city => !exclude.includes(city))
  );
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5); // HH:MM
}

function generateStops(startCity, endCity) {
  const numberOfStops = faker.number.int({ min: 1, max: 4 });
  const stops = [];
  const usedCities = [startCity, endCity];

  for (let i = 0; i < numberOfStops; i++) {
    const city = getRandomCity(usedCities);
    usedCities.push(city);

    stops.push({
      city,
      stopDurationMinutes: faker.number.int({ min: 10, max: 40 })
    });
  }

  return stops;
}

function generateTrip(index) {
  const startCity = getRandomCity();
  const endCity = getRandomCity([startCity]);

  const startDateObj = faker.date.future();
  const durationHours = faker.number.int({ min: 4, max: 30 });

  const endDateObj = new Date(
    startDateObj.getTime() + durationHours * 60 * 60 * 1000
  );

  const startDate = formatDate(startDateObj);
  const endDate = formatDate(endDateObj);

  const startTime = formatTime(startDateObj);
  const endTime = formatTime(endDateObj);

  const tripId = `${startCity.slice(0, 3).toUpperCase()}-${endCity
    .slice(0, 3)
    .toUpperCase()}-${startDate.replace(/-/g, "")}-${index + 1}`;

  return {
    tripId,

    startCity,
    endCity,

    startDate,
    startTime,

    endDate,
    endTime,

    durationHours,

    price: faker.number.int({ min: 50, max: 300 }),
    availableSeats: faker.number.int({ min: 10, max: 55 }),

    stops: generateStops(startCity, endCity),

    createdAt: formatDate(new Date())
  };
}

async function generateTrips(count = 25) {
  const batch = db.batch();

  for (let i = 0; i < count; i++) {
    const trip = generateTrip(i);
    const ref = db.collection("trips").doc(trip.tripId);
    batch.set(ref, trip);
  }

  await batch.commit();
  console.log(`✅ ${count} trips generated successfully`);
}

generateTrips()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
