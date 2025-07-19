import axios from 'axios';
import { Shop, PriceEstimate, Appointment, AppointmentConfirmation, DashboardStats } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const shopService = {
  searchShops: async (params: {
    lat: number;
    lng: number;
    radius?: number;
    service?: string;
    maxcare_only?: boolean;
    min_rating?: number;
  }): Promise<Shop[]> => {
    const response = await api.get('/api/shops/search', { params });
    return response.data;
  },
};

export const pricingService = {
  getEstimate: async (
    shop_id: string,
    service: string,
    has_maxcare: boolean
  ): Promise<PriceEstimate> => {
    const response = await api.post('/api/pricing/estimate', {
      shop_id,
      service,
      has_maxcare,
    });
    return response.data;
  },
};

export const appointmentService = {
  book: async (appointment: Appointment): Promise<AppointmentConfirmation> => {
    const response = await api.post('/api/appointments/book', appointment);
    return response.data;
  },
};

export const servicesService = {
  getAll: async (): Promise<{ services: string[]; maxcare_coverage: Record<string, number> }> => {
    const response = await api.get('/api/services');
    return response.data;
  },
};

export const analyticsService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
  },
};