const { faker } = require("@faker-js/faker");
const { db } = require("../src/config/firebaseAdmin");

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

const DESCRIPTIONS = [
  "Călătorie confortabilă cu autobuz modern, dotat cu WiFi gratuit și prize USB. Servicii de calitate superioară pentru o experiență de neuitat.",
  "Descoperă peisaje spectaculoase în timpul călătoriei. Autobuz climatizat cu scaune ergonomice pentru maximum confort.",
  "Călătorie sigură și relaxantă cu personal profesionist. Opțiune ideală pentru excursii de o zi sau vacanțe mai lungi.",
  "Autobuz premium cu facilități moderne: WiFi, prize, spațiu generos pentru bagaje. Confort și siguranță garantate.",
  "Călătorie plăcută prin peisaje variate. Servicii de calitate cu atenție la detalii pentru satisfacerea tuturor pasagerilor.",
  "Autobuz modern și confortabil pentru o călătorie relaxantă. Ideal pentru business sau vacanță, cu toate facilitățile necesare.",
  "Experiență de călătorie superioară cu autobuz dotat cu cele mai moderne facilități. Confort, siguranță și servicii excelente.",
  "Călătorie confortabilă prin orașe și peisaje frumoase. Autobuz cu spațiu generos și servicii de calitate pentru toți pasagerii.",
  "Descoperă destinații noi într-un autobuz modern și confortabil. WiFi gratuit, prize USB și servicii profesioniste.",
  "Călătorie sigură și plăcută cu autobuz premium. Ideal pentru excursii, cu toate facilitățile necesare pentru o experiență memorabilă.",
  "Autobuz climatizat cu scaune confortabile și spațiu generos. Servicii de calitate pentru o călătorie relaxantă și sigură.",
  "Călătorie confortabilă cu facilități moderne: WiFi, prize, spațiu pentru bagaje. Personal profesionist și atenție la detalii.",
  "Experiență premium de călătorie cu autobuz dotat cu toate facilitățile. Confort, siguranță și servicii excelente pentru toți.",
  "Descoperă noi destinații într-un autobuz modern și confortabil. Ideal pentru vacanțe sau călătorii de business.",
  "Călătorie plăcută prin peisaje variate cu autobuz premium. Servicii de calitate superioară pentru satisfacerea tuturor nevoilor."
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

    description: faker.helpers.arrayElement(DESCRIPTIONS),

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
  console.log(` ${count} trips generated successfully`);
}

generateTrips()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
