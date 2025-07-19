import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Close,
  CheckCircle,
  AttachMoney,
  Schedule,
  DirectionsCar,
  Person,
} from '@mui/icons-material';
import { format, addDays, isWeekend } from 'date-fns';
import { Shop, PriceEstimate, Appointment, AppointmentConfirmation } from '../types';
import { pricingService, appointmentService, servicesService } from '../services/api';

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  shop: Shop;
  preselectedService?: string;
  maxCareCoverage: Record<string, number>;
}

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onClose,
  shop,
  preselectedService = '',
  maxCareCoverage,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null);
  
  // Form data
  const [selectedService, setSelectedService] = useState(preselectedService);
  const [selectedDate, setSelectedDate] = useState<Date | null>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('');
  const [hasMaxCare, setHasMaxCare] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleYear: new Date().getFullYear(),
    vehicleMake: '',
    vehicleModel: '',
    specialInstructions: '',
  });
  
  // Price estimate
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  const steps = ['Select Service', 'Choose Date & Time', 'Vehicle & Contact Info', 'Review & Confirm'];

  useEffect(() => {
    if (open) {
      loadServices();
      setSelectedService(preselectedService);
    }
  }, [open, preselectedService]);

  useEffect(() => {
    if (selectedService) {
      fetchPriceEstimate();
    }
  }, [selectedService, hasMaxCare]);

  const loadServices = async () => {
    try {
      const data = await servicesService.getAll();
      setAvailableServices(data.services);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const fetchPriceEstimate = async () => {
    if (!selectedService) return;
    
    setLoading(true);
    try {
      const estimate = await pricingService.getEstimate(
        shop.id,
        selectedService,
        hasMaxCare && shop.is_maxcare_certified
      );
      setPriceEstimate(estimate);
    } catch (err) {
      setError('Failed to get price estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const appointment: Appointment = {
        shop_id: shop.id,
        service: selectedService,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        vehicle_year: customerData.vehicleYear,
        vehicle_make: customerData.vehicleMake,
        vehicle_model: customerData.vehicleModel,
        has_maxcare: hasMaxCare && shop.is_maxcare_certified,
        special_instructions: customerData.specialInstructions,
      };
      
      const result = await appointmentService.book(appointment);
      setConfirmation(result);
      setActiveStep(4); // Go to confirmation
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setActiveStep(0);
    setConfirmation(null);
    setError(null);
    onClose();
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      slots.push(`${hour}:00 AM`);
      slots.push(`${hour}:30 AM`);
    }
    return slots.map(time => time.replace('12:00 AM', '12:00 PM').replace('12:30 AM', '12:30 PM'));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Service</InputLabel>
              <Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                label="Select Service"
              >
                {shop.services.map((service) => (
                  <MenuItem key={service} value={service}>
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <span>{service}</span>
                      {maxCareCoverage[service] > 0 && (
                        <Chip
                          size="small"
                          label={`${maxCareCoverage[service] * 100}% MaxCare`}
                          color="secondary"
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {shop.is_maxcare_certified && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasMaxCare}
                    onChange={(e) => setHasMaxCare(e.target.checked)}
                  />
                }
                label="I have MaxCare warranty"
              />
            )}
            
            {priceEstimate && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Price Estimate
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Parts:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>${priceEstimate.parts_cost.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Labor:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>${priceEstimate.labor_cost.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Total:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography fontWeight="bold">
                        ${priceEstimate.total_cost.toFixed(2)}
                      </Typography>
                    </Grid>
                    {priceEstimate.maxcare_discount > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography color="secondary.main">MaxCare Saves:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography color="secondary.main">
                            -${priceEstimate.maxcare_discount.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6" color="primary">You Pay:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography variant="h6" color="primary">
                            ${priceEstimate.customer_cost.toFixed(2)}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Estimated time: {priceEstimate.estimated_time_hours} hours
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDate={addDays(new Date(), 1)}
              maxDate={addDays(new Date(), 30)}
              shouldDisableDate={(date) => isWeekend(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 3 }
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Select Time</InputLabel>
              <Select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                label="Select Time"
              >
                {generateTimeSlots().map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <DirectionsCar sx={{ verticalAlign: 'middle', mr: 1 }} />
              Vehicle Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={customerData.vehicleYear}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    vehicleYear: parseInt(e.target.value)
                  })}
                  inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Make"
                  value={customerData.vehicleMake}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    vehicleMake: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Model"
                  value={customerData.vehicleModel}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    vehicleModel: e.target.value
                  })}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>
              <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    name: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    phone: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    email: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Instructions (Optional)"
                  multiline
                  rows={3}
                  value={customerData.specialInstructions}
                  onChange={(e) => setCustomerData({
                    ...customerData,
                    specialInstructions: e.target.value
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your appointment details before confirming.
            </Alert>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Shop Details</Typography>
                <Typography>{shop.name}</Typography>
                <Typography color="text.secondary">
                  {shop.address}, {shop.city}, {shop.state} {shop.zip_code}
                </Typography>
                <Typography color="text.secondary">{shop.phone}</Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Service & Schedule</Typography>
                <Typography>Service: {selectedService}</Typography>
                <Typography>
                  Date: {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography>Time: {selectedTime}</Typography>
                <Typography>
                  Estimated Duration: {priceEstimate?.estimated_time_hours} hours
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Vehicle & Contact</Typography>
                <Typography>
                  Vehicle: {customerData.vehicleYear} {customerData.vehicleMake} {customerData.vehicleModel}
                </Typography>
                <Typography>Name: {customerData.name}</Typography>
                <Typography>Phone: {customerData.phone}</Typography>
                <Typography>Email: {customerData.email}</Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Price Summary</Typography>
                <Typography variant="h5" color="primary">
                  Total: ${priceEstimate?.customer_cost.toFixed(2)}
                </Typography>
                {priceEstimate?.maxcare_discount! > 0 && (
                  <Typography color="secondary.main">
                    MaxCare Savings: ${priceEstimate?.maxcare_discount.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );
        
      default:
        return null;
    }
  };

  if (confirmation) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Appointment Confirmed!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your appointment has been successfully booked.
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Confirmation Number: {confirmation.confirmation_number}
          </Typography>
          
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {confirmation.shop.name}
              </Typography>
              <Typography color="text.secondary">
                {format(new Date(confirmation.appointment.date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Typography color="text.secondary">
                {confirmation.appointment.time}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Service: {confirmation.appointment.service}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                Total: ${confirmation.price_estimate.customer_cost.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            A confirmation email has been sent to {confirmation.appointment.customer_email}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Book Appointment at {shop.name}</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent()
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Confirm Booking
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;