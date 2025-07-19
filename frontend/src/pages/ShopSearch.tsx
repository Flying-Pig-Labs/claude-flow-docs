import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Rating,
  Checkbox,
  FormControlLabel,
  Slider,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Schedule,
  CheckCircle,
  Search,
} from '@mui/icons-material';
// Simplified map component for demo
import { MapContainer } from '../components/MapContainer';
import { Shop } from '../types';
import { shopService, servicesService } from '../services/api';
import BookingDialog from '../components/BookingDialog';

// Map component is simplified for demo

const ShopSearch: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  
  // Search parameters
  const [location, setLocation] = useState({ lat: 37.5407, lng: -77.4360 }); // Richmond, VA
  const [zipCode, setZipCode] = useState('23220');
  const [selectedService, setSelectedService] = useState('');
  const [maxCareOnly, setMaxCareOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [radius, setRadius] = useState(25);
  
  // Services
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [maxCareCoverage, setMaxCareCoverage] = useState<Record<string, number>>({});

  useEffect(() => {
    loadServices();
    searchShops();
  }, []);

  const loadServices = async () => {
    try {
      const data = await servicesService.getAll();
      setAvailableServices(data.services);
      setMaxCareCoverage(data.maxcare_coverage);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const searchShops = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await shopService.searchShops({
        lat: location.lat,
        lng: location.lng,
        radius,
        service: selectedService || undefined,
        maxcare_only: maxCareOnly,
        min_rating: minRating || undefined,
      });
      setShops(results);
    } catch (err) {
      setError('Failed to search shops. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleZipCodeSearch = () => {
    // For demo, we'll use predefined coordinates for common zip codes
    const zipCoordinates: Record<string, { lat: number; lng: number }> = {
      '23220': { lat: 37.5407, lng: -77.4360 }, // Richmond
      '30303': { lat: 33.7490, lng: -84.3880 }, // Atlanta
      '75201': { lat: 32.7767, lng: -96.7970 }, // Dallas
      '85001': { lat: 33.4484, lng: -112.0740 }, // Phoenix
      '90001': { lat: 34.0522, lng: -118.2437 }, // LA
    };
    
    const coords = zipCoordinates[zipCode] || location;
    setLocation(coords);
    searchShops();
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setBookingOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Find a Certified Repair Shop
      </Typography>
      
      {/* Search Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleZipCodeSearch()}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Service Needed</InputLabel>
                <Select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  label="Service Needed"
                >
                  <MenuItem value="">All Services</MenuItem>
                  {availableServices.map((service) => (
                    <MenuItem key={service} value={service}>
                      {service}
                      {maxCareCoverage[service] > 0 && (
                        <Chip
                          size="small"
                          label={`${maxCareCoverage[service] * 100}% MaxCare`}
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={maxCareOnly}
                    onChange={(e) => setMaxCareOnly(e.target.checked)}
                  />
                }
                label="MaxCare Only"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography gutterBottom>Min Rating</Typography>
              <Rating
                value={minRating}
                onChange={(_, value) => setMinRating(value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Search />}
                onClick={searchShops}
                disabled={loading}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Search Radius: {radius} miles</Typography>
            <Slider
              value={radius}
              onChange={(_, value) => setRadius(value as number)}
              min={5}
              max={50}
              marks
              step={5}
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={7}>
          <Box sx={{ height: 600 }}>
            <MapContainer
              shops={shops}
              selectedShop={selectedShop}
              onShopSelect={handleShopSelect}
              center={location}
            />
          </Box>
        </Grid>

        {/* Shop List */}
        <Grid item xs={12} md={5}>
          <Box sx={{ height: 600, overflow: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : shops.length === 0 ? (
              <Alert severity="info">
                No shops found. Try adjusting your search criteria.
              </Alert>
            ) : (
              shops.map((shop) => (
                <Card key={shop.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Typography variant="h6" component="div">
                          {shop.name}
                          {shop.is_maxcare_certified && (
                            <Chip
                              icon={<CheckCircle />}
                              label="MaxCare Certified"
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Rating value={shop.rating} size="small" readOnly />
                          <Typography variant="body2" color="text.secondary">
                            ({shop.review_count} reviews)
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <LocationOn fontSize="small" sx={{ verticalAlign: 'middle' }} />
                          {shop.address}, {shop.city}, {shop.state} {shop.zip_code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <Phone fontSize="small" sx={{ verticalAlign: 'middle' }} />
                          {shop.phone}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          {shop.distance} miles away
                        </Typography>
                      </Box>
                    </Box>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleShopSelect(shop)}
                      >
                        View Details & Book
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      {selectedShop && (
        <BookingDialog
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          shop={selectedShop}
          preselectedService={selectedService}
          maxCareCoverage={maxCareCoverage}
        />
      )}
    </Box>
  );
};

export default ShopSearch;