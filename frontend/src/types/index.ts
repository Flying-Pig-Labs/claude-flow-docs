export interface Location {
  lat: number;
  lng: number;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  location: Location;
  phone: string;
  rating: number;
  review_count: number;
  is_maxcare_certified: boolean;
  services: string[];
  hours: Record<string, string>;
  distance?: number;
}

export interface PriceEstimate {
  shop_id: string;
  service: string;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  maxcare_discount: number;
  customer_cost: number;
  estimated_time_hours: number;
}

export interface Appointment {
  shop_id: string;
  service: string;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  has_maxcare: boolean;
  special_instructions?: string;
}

export interface AppointmentConfirmation {
  confirmation_number: string;
  appointment: Appointment;
  shop: Shop;
  price_estimate: PriceEstimate;
}

export interface DashboardStats {
  network_stats: {
    total_shops: number;
    certified_shops: number;
    certification_rate: number;
    average_rating: number;
    states_covered: number;
  };
  appointment_stats: {
    total_this_month: number;
    growth_rate: number;
    average_booking_value: number;
    maxcare_usage_rate: number;
  };
  financial_stats: {
    booking_fees_mtd: number;
    estimated_annual_savings: number;
    referral_fees_saved: number;
  };
  top_services: Array<{
    service: string;
    count: number;
  }>;
  shop_performance: Array<{
    shop_name: string;
    appointments: number;
    rating: number;
    satisfaction_score: number;
  }>;
}