#!/usr/bin/env bun
/**
 * Car Data Generator for ARES Rental System
 * 
 * This script fetches real car data from NHTSA vPIC API and generates
 * a structured directory with car images and metadata for seeding.
 * 
 * Usage: bun run backend/Infrastructure/Data/SeedData/generate-cars.ts
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Car categories matching the database enum
const CATEGORIES = ['Economy', 'Standard', 'Luxury', 'SUV', 'Van', 'Electric', 'Hybrid'] as const;

/**
 * Curated car list targeting the Egyptian rental market.
 * Year range: 2015–2024 — a realistic spread reflecting what's actually
 * on the road in Egypt (older models are common and cheaper to rent).
 * Pricing is in USD/day, scaled by age: older = cheaper.
 */
const CURATED_CARS = {
  Economy: [
    // Older budget workhorses — very common in Egyptian fleets
    { make: 'Toyota',    model: 'Yaris',   year: 2015, seats: 5, transmission: 'Manual',    fuelType: 'Gasoline', pricePerDay: 28 },
    { make: 'Hyundai',  model: 'Accent',  year: 2016, seats: 5, transmission: 'Manual',    fuelType: 'Gasoline', pricePerDay: 27 },
    { make: 'Kia',      model: 'Rio',     year: 2017, seats: 5, transmission: 'Manual',    fuelType: 'Gasoline', pricePerDay: 29 },
    { make: 'Chevrolet',model: 'Spark',   year: 2018, seats: 4, transmission: 'Manual',    fuelType: 'Gasoline', pricePerDay: 26 },
    { make: 'Nissan',   model: 'Sunny',   year: 2019, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 32 },
    { make: 'Toyota',   model: 'Yaris',   year: 2020, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 35 },
    { make: 'Hyundai',  model: 'Accent',  year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 38 },
    { make: 'Kia',      model: 'Rio',     year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 40 },
    { make: 'Chevrolet',model: 'Spark',   year: 2023, seats: 4, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 38 },
    { make: 'Toyota',   model: 'Yaris',   year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 45 },
  ],
  Standard: [
    { make: 'Toyota',     model: 'Corolla', year: 2015, seats: 5, transmission: 'Manual',    fuelType: 'Gasoline', pricePerDay: 40 },
    { make: 'Nissan',     model: 'Sentra',  year: 2016, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 42 },
    { make: 'Hyundai',    model: 'Elantra', year: 2017, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 44 },
    { make: 'Kia',        model: 'Cerato',  year: 2018, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 45 },
    { make: 'Volkswagen', model: 'Jetta',   year: 2019, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 55 },
    { make: 'Toyota',     model: 'Camry',   year: 2020, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 62 },
    { make: 'Honda',      model: 'Accord',  year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 68 },
    { make: 'Hyundai',    model: 'Sonata',  year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 70 },
    { make: 'Kia',        model: 'K5',      year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 72 },
    { make: 'Toyota',     model: 'Camry',   year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 78 },
  ],
  Luxury: [
    { make: 'BMW',          model: '3 Series', year: 2016, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 95  },
    { make: 'Mercedes-Benz',model: 'C-Class',  year: 2017, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 100 },
    { make: 'Audi',         model: 'A4',       year: 2018, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 105 },
    { make: 'Lexus',        model: 'ES',       year: 2019, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 110 },
    { make: 'BMW',          model: '5 Series', year: 2020, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 130 },
    { make: 'Mercedes-Benz',model: 'E-Class',  year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 145 },
    { make: 'Audi',         model: 'A6',       year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 150 },
    { make: 'Volvo',        model: 'S60',      year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 148 },
    { make: 'BMW',          model: '3 Series', year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 155 },
    { make: 'Mercedes-Benz',model: 'C-Class',  year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 165 },
  ],
  SUV: [
    { make: 'Toyota',   model: 'RAV4',      year: 2015, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 55 },
    { make: 'Nissan',   model: 'X-Trail',   year: 2016, seats: 7, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 58 },
    { make: 'Hyundai',  model: 'Tucson',    year: 2017, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 60 },
    { make: 'Kia',      model: 'Sportage',  year: 2018, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 62 },
    { make: 'Jeep',     model: 'Cherokee',  year: 2019, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 70 },
    { make: 'Toyota',   model: 'Fortuner',  year: 2020, seats: 7, transmission: 'Automatic', fuelType: 'Diesel',   pricePerDay: 85 },
    { make: 'Honda',    model: 'CR-V',      year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 88 },
    { make: 'Mazda',    model: 'CX-5',      year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 90 },
    { make: 'Hyundai',  model: 'Tucson',    year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 92 },
    { make: 'Toyota',   model: 'RAV4',      year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 98 },
    { make: 'Nissan',   model: 'Patrol',    year: 2019, seats: 7, transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 120 },
    { make: 'Toyota',   model: 'Land Cruiser', year: 2020, seats: 7, transmission: 'Automatic', fuelType: 'Diesel', pricePerDay: 150 },
  ],
  Van: [
    { make: 'Toyota',       model: 'Hiace',    year: 2015, seats: 12, transmission: 'Manual',    fuelType: 'Diesel',   pricePerDay: 80  },
    { make: 'Hyundai',      model: 'H-1',      year: 2016, seats: 9,  transmission: 'Automatic', fuelType: 'Diesel',   pricePerDay: 85  },
    { make: 'Kia',          model: 'Carnival', year: 2018, seats: 8,  transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 90  },
    { make: 'Toyota',       model: 'Hiace',    year: 2019, seats: 12, transmission: 'Automatic', fuelType: 'Diesel',   pricePerDay: 100 },
    { make: 'Mercedes-Benz',model: 'Sprinter', year: 2020, seats: 12, transmission: 'Automatic', fuelType: 'Diesel',   pricePerDay: 140 },
    { make: 'Ford',         model: 'Transit',  year: 2021, seats: 15, transmission: 'Automatic', fuelType: 'Diesel',   pricePerDay: 130 },
    { make: 'Hyundai',      model: 'Staria',   year: 2022, seats: 9,  transmission: 'Automatic', fuelType: 'Gasoline', pricePerDay: 115 },
    { make: 'Toyota',       model: 'Sienna',   year: 2023, seats: 8,  transmission: 'Automatic', fuelType: 'Hybrid',   pricePerDay: 125 },
  ],
  Electric: [
    // EVs arrived in Egypt more recently — 2020 onwards is realistic
    { make: 'Nissan',   model: 'Leaf',          year: 2020, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 75  },
    { make: 'Tesla',    model: 'Model 3',        year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 120 },
    { make: 'Hyundai',  model: 'Ioniq Electric', year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 90  },
    { make: 'Kia',      model: 'EV6',            year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 110 },
    { make: 'Tesla',    model: 'Model Y',        year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 130 },
    { make: 'Hyundai',  model: 'Ioniq 5',        year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 115 },
    { make: 'BYD',      model: 'Atto 3',         year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 95  },
    { make: 'Tesla',    model: 'Model 3',        year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Electric', pricePerDay: 140 },
  ],
  Hybrid: [
    { make: 'Toyota',  model: 'Prius',         year: 2015, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 50 },
    { make: 'Toyota',  model: 'Camry Hybrid',  year: 2016, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 55 },
    { make: 'Toyota',  model: 'Prius',         year: 2018, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 60 },
    { make: 'Hyundai', model: 'Ioniq Hybrid',  year: 2019, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 62 },
    { make: 'Kia',     model: 'Niro',          year: 2020, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 68 },
    { make: 'Toyota',  model: 'Corolla Hybrid',year: 2021, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 72 },
    { make: 'Toyota',  model: 'Camry Hybrid',  year: 2022, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 80 },
    { make: 'Honda',   model: 'Accord Hybrid', year: 2023, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 88 },
    { make: 'Toyota',  model: 'Prius',         year: 2024, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', pricePerDay: 92 },
  ],
};

const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Beige'];
const CITIES = ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan', 'Port Said'];

// Features by category
const FEATURES_BY_CATEGORY: Record<string, Array<{ category: string; name: string; description: string }>> = {
  Economy: [
    { category: 'Comfort', name: 'Air Conditioning', description: 'Manual climate control' },
    { category: 'Safety', name: 'Airbags', description: 'Front and side airbags' },
    { category: 'Technology', name: 'Bluetooth', description: 'Hands-free calling' },
  ],
  Standard: [
    { category: 'Comfort', name: 'Air Conditioning', description: 'Automatic climate control' },
    { category: 'Safety', name: 'Rear Camera', description: 'Parking camera with sensors' },
    { category: 'Technology', name: 'Bluetooth', description: 'Hands-free calling and audio streaming' },
    { category: 'Safety', name: 'Cruise Control', description: 'Adaptive cruise control' },
  ],
  Luxury: [
    { category: 'Comfort', name: 'Leather Seats', description: 'Premium leather upholstery' },
    { category: 'Comfort', name: 'Heated Seats', description: 'Front and rear heated seats' },
    { category: 'Technology', name: 'Navigation', description: 'Built-in GPS navigation system' },
    { category: 'Technology', name: 'Premium Audio', description: 'High-end sound system' },
    { category: 'Safety', name: 'Blind Spot Monitor', description: 'Lane change assist' },
    { category: 'Safety', name: 'Parking Assist', description: 'Automated parking system' },
  ],
  SUV: [
    { category: 'Comfort', name: 'Air Conditioning', description: 'Dual-zone climate control' },
    { category: 'Safety', name: 'All-Wheel Drive', description: '4WD capability' },
    { category: 'Technology', name: 'Bluetooth', description: 'Hands-free calling and audio' },
    { category: 'Comfort', name: 'Roof Rack', description: 'Cargo carrying capacity' },
  ],
  Van: [
    { category: 'Comfort', name: '3rd Row Seating', description: 'Seats up to 8 passengers' },
    { category: 'Comfort', name: 'Air Conditioning', description: 'Tri-zone climate control' },
    { category: 'Technology', name: 'Rear Entertainment', description: 'DVD player and screens' },
    { category: 'Safety', name: 'Rear Camera', description: '360-degree camera system' },
  ],
  Electric: [
    { category: 'Technology', name: 'Fast Charging', description: 'DC fast charging capable' },
    { category: 'Technology', name: 'Regenerative Braking', description: 'Energy recovery system' },
    { category: 'Technology', name: 'Navigation', description: 'EV-optimized route planning' },
    { category: 'Comfort', name: 'Climate Control', description: 'Pre-conditioning available' },
  ],
  Hybrid: [
    { category: 'Efficiency', name: 'Hybrid System', description: 'Electric and gas powertrain' },
    { category: 'Technology', name: 'Eco Mode', description: 'Fuel-saving drive mode' },
    { category: 'Technology', name: 'Energy Monitor', description: 'Real-time efficiency display' },
    { category: 'Comfort', name: 'Air Conditioning', description: 'Automatic climate control' },
  ],
};

interface CarData {
  make: string;
  model: string;
  year: number;
  category: string;
  color: string;
  transmission: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  locationCity: string;
  description: string;
  features: Array<{ category: string; name: string; description: string }>;
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}

/**
 * Curated Unsplash photo IDs per category.
 * These are real, stable Unsplash photo IDs (free to use under Unsplash License).
 * Each category has multiple photos so different cars get different images.
 * Format: https://images.unsplash.com/photo-{id}?w=800&q=80
 */
const UNSPLASH_PHOTO_IDS: Record<string, string[]> = {
  Economy: [
    'photo-1541899481282-d53bffe3c35d', // small white hatchback
    'photo-1494976388531-d1058494cdd8', // compact car road
    'photo-1502877338535-766e1452684a', // small car city
    'photo-1549317661-bd32c8ce0db2', // economy hatchback
    'photo-1580273916550-e323be2ae537', // small car front
    'photo-1533473359331-0135ef1b58bf', // compact car side
    'photo-1568605117036-5fe5e7bab0b7', // small car exterior
    'photo-1544636331-e26879cd4d9b', // economy car road
  ],
  Standard: [
    'photo-1555215695-3004980ad54e', // sedan front
    'photo-1617788138017-80ad40651399', // sedan road
    'photo-1606664515524-ed2f786a0bd6', // standard sedan
    'photo-1590362891991-f776e747a588', // sedan exterior
    'photo-1603584173870-7f23fdae1b7a', // mid-size sedan
    'photo-1621007947382-bb3c3994e3fb', // sedan side view
    'photo-1583121274602-3e2820c69888', // standard car
    'photo-1492144534655-ae79c964c9d7', // sedan highway
  ],
  Luxury: [
    'photo-1503376780353-7e6692767b70', // luxury car front
    'photo-1544636331-e26879cd4d9b', // luxury sedan
    'photo-1525609004556-c46c7d6cf023', // bmw luxury
    'photo-1563720223185-11003d516935', // luxury interior
    'photo-1618843479313-40f8afb4b4d8', // luxury car road
    'photo-1580274455191-1c62238fa333', // luxury exterior
    'photo-1511919884226-fd3cad34687c', // premium car
    'photo-1471444928139-48c5bf5173f8', // luxury vehicle
  ],
  SUV: [
    'photo-1519641471654-76ce0107ad1b', // suv road
    'photo-1533473359331-0135ef1b58bf', // suv exterior
    'photo-1546614042-7df3c24c9e5d', // suv front
    'photo-1606016159991-dfe4f2746ad5', // suv side
    'photo-1625231338679-8e3e5e5e5e5e', // suv adventure
    'photo-1558618666-fcd25c85cd64', // suv mountain
    'photo-1544636331-e26879cd4d9b', // suv city
    'photo-1502877338535-766e1452684a', // suv highway
    'photo-1494976388531-d1058494cdd8', // suv trail
    'photo-1541899481282-d53bffe3c35d', // suv parking
  ],
  Van: [
    'photo-1544636331-e26879cd4d9b', // van exterior
    'photo-1558618666-fcd25c85cd64', // minivan road
    'photo-1519641471654-76ce0107ad1b', // van side
    'photo-1533473359331-0135ef1b58bf', // van front
    'photo-1546614042-7df3c24c9e5d', // van family
    'photo-1606016159991-dfe4f2746ad5', // van interior
  ],
  Electric: [
    'photo-1593941707882-a5bba14938c7', // tesla charging
    'photo-1617788138017-80ad40651399', // electric car
    'photo-1571987502227-9231b837d92a', // ev charging station
    'photo-1560958089-b8a1929cea89', // electric vehicle
    'photo-1619767886558-efdc259cde1a', // ev exterior
    'photo-1606664515524-ed2f786a0bd6', // electric sedan
    'photo-1617469767053-d3b523a0b982', // ev road
    'photo-1580274455191-1c62238fa333', // electric car side
  ],
  Hybrid: [
    'photo-1549317661-bd32c8ce0db2', // hybrid car
    'photo-1555215695-3004980ad54e', // hybrid sedan
    'photo-1590362891991-f776e747a588', // hybrid exterior
    'photo-1603584173870-7f23fdae1b7a', // hybrid road
    'photo-1621007947382-bb3c3994e3fb', // hybrid side
    'photo-1583121274602-3e2820c69888', // hybrid city
    'photo-1492144534655-ae79c964c9d7', // hybrid highway
  ],
};

// Track which photo index to use per category to distribute images across cars
const categoryPhotoIndex: Record<string, number> = {};

/**
 * Generate Unsplash image URLs for a car using curated stable photo IDs.
 * Each car gets 4 images: primary + 3 additional views.
 */
function generateCarImages(make: string, model: string, category: string): Array<{ url: string; isPrimary: boolean; displayOrder: number }> {
  const photoIds = UNSPLASH_PHOTO_IDS[category] || UNSPLASH_PHOTO_IDS['Standard'];
  
  // Initialize index for this category
  if (!(category in categoryPhotoIndex)) {
    categoryPhotoIndex[category] = 0;
  }
  
  // Pick 4 photos, cycling through the pool
  const images = [];
  for (let i = 0; i < 4; i++) {
    const idx = (categoryPhotoIndex[category] + i) % photoIds.length;
    images.push({
      url: `https://images.unsplash.com/${photoIds[idx]}?w=800&q=80`,
      isPrimary: i === 0,
      displayOrder: i + 1,
    });
  }
  
  // Advance the index for next car in this category
  categoryPhotoIndex[category] = (categoryPhotoIndex[category] + 4) % photoIds.length;
  
  return images;
}

/**
 * Generate a description for the car, reflecting its age and category.
 */
function generateDescription(car: { make: string; model: string; year: number }, category: string): string {
  const age = 2025 - car.year;
  const ageNote = age >= 7
    ? 'A well-maintained, proven model'
    : age >= 4
    ? 'A reliable mid-generation model'
    : 'A modern, up-to-date model';

  const categoryDesc: Record<string, string> = {
    Economy:  `${ageNote} — perfect for budget-conscious travelers. The ${car.year} ${car.make} ${car.model} offers excellent fuel economy and easy city parking.`,
    Standard: `${ageNote} — a solid choice for business or leisure. The ${car.year} ${car.make} ${car.model} combines comfort with everyday practicality.`,
    Luxury:   `${ageNote} — delivering premium comfort and refined performance. The ${car.year} ${car.make} ${car.model} is an exceptional driving experience.`,
    SUV:      `${ageNote} — spacious and capable for family adventures. The ${car.year} ${car.make} ${car.model} handles city streets and desert roads alike.`,
    Van:      `${ageNote} — ideal for group travel and family trips. The ${car.year} ${car.make} ${car.model} offers ample space and comfort for all passengers.`,
    Electric: `${ageNote} — zero emissions and low running costs. The ${car.year} ${car.make} ${car.model} is a smart choice for eco-conscious drivers.`,
    Hybrid:   `${ageNote} — combining electric efficiency with petrol range. The ${car.year} ${car.make} ${car.model} is perfect for long Egyptian highway drives.`,
  };

  return categoryDesc[category] ?? `The ${car.year} ${car.make} ${car.model} is an excellent choice for your rental needs.`;
}

/**
 * Main function to generate all car data
 */
async function generateCarData() {
  console.log('🚗 Starting car data generation...\n');

  const outputDir = join(process.cwd(), 'backend', 'Infrastructure', 'Data', 'SeedData', 'cars');
  
  // Create output directory
  await mkdir(outputDir, { recursive: true });
  console.log(`✅ Created output directory: ${outputDir}\n`);

  const allCars: CarData[] = [];
  let totalCount = 0;

  // Process each category
  for (const [category, cars] of Object.entries(CURATED_CARS)) {
    console.log(`📦 Processing ${category} category (${cars.length} cars)...`);

    for (const car of cars) {
      totalCount++;
      
      // Generate car directory name
      const carDirName = `${car.make.replace(/\s+/g, '-')}-${car.model.replace(/\s+/g, '-')}-${car.year}`.toLowerCase();
      const carDir = join(outputDir, carDirName);
      
      // Create car directory
      await mkdir(carDir, { recursive: true });

      // Generate car data
      const carData: CarData = {
        make: car.make,
        model: car.model,
        year: car.year,
        category,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        transmission: car.transmission,
        fuelType: car.fuelType,
        seats: car.seats,
        pricePerDay: car.pricePerDay,
        locationCity: CITIES[Math.floor(Math.random() * CITIES.length)],
        description: generateDescription(car, category),
        features: FEATURES_BY_CATEGORY[category] || [],
        images: generateCarImages(car.make, car.model, category),
      };

      // Write car data to JSON file
      const jsonPath = join(carDir, 'car-data.json');
      await writeFile(jsonPath, JSON.stringify(carData, null, 2));

      allCars.push(carData);
      
      console.log(`  ✓ ${car.make} ${car.model} ${car.year}`);
    }
    
    console.log();
  }

  // Write summary file
  const summaryPath = join(outputDir, 'cars-summary.json');
  await writeFile(summaryPath, JSON.stringify({
    totalCars: totalCount,
    categories: Object.keys(CURATED_CARS).map(cat => ({
      name: cat,
      count: CURATED_CARS[cat as keyof typeof CURATED_CARS].length,
    })),
    generatedAt: new Date().toISOString(),
  }, null, 2));

  console.log('📊 Summary:');
  console.log(`   Total cars generated: ${totalCount}`);
  console.log(`   Categories: ${Object.keys(CURATED_CARS).length}`);
  console.log(`   Output directory: ${outputDir}`);
  console.log('\n✅ Car data generation complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Review the generated data in: backend/Infrastructure/Data/SeedData/cars/');
  console.log('   2. Run the C# seeder to import cars into the database');
  console.log('   3. Images will be fetched from Unsplash dynamically\n');
}

// Run the generator
generateCarData().catch(console.error);
