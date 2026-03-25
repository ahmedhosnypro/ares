export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: "manual" | "automatic";
  fuelType: "petrol" | "diesel" | "electric" | "hybrid";
  seats: number;
  doors: number;
  features: string[];
  description: string;
  images: string[];
  location: string;
  owner: Owner;
  pricing: Pricing;
  specs: Specs;
  availability: Availability;
  rating: Rating;
}

export interface Owner {
  id: string;
  name: string;
  rating: number;
  trips: number;
  joined: string;
  isSuperhost: boolean;
}

export interface Pricing {
  basePrice: number;
  currency: string;
  discountWeekly: number;
  discountMonthly: number;
  insurance: Insurance;
  deposit: number;
}

export interface Insurance {
  basic: number;
  premium: number;
  full: number;
}

export interface Specs {
  engine: string;
  power: string;
  acceleration: string;
  topSpeed: string;
  consumption: string;
  range?: string;
}

export interface Availability {
  nextAvailable: string;
  bookedDates: string[];
}

export interface Rating {
  average: number;
  count: number;
  breakdown: RatingBreakdown;
}

export interface RatingBreakdown {
  cleanliness: number;
  communication: number;
  accuracy: number;
  location: number;
  value: number;
}

export interface Review {
  id: string;
  user: ReviewUser;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface ReviewUser {
  name: string;
  image: string;
}

export interface PricingBreakdown {
  basePrice: number;
  days: number;
  subtotal: number;
  discount: number;
  insurance: number;
  services: number;
  deposit: number;
  total: number;
  currency: string;
}