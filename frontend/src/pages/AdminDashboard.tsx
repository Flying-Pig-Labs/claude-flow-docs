import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Store,
  AttachMoney,
  CheckCircle,
  Schedule,
  Star,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats } from '../types';
import { analyticsService } from '../services/api';

const COLORS = ['#0066CC', '#FFC20E', '#4CAF50', '#FF6B6B', '#8B5CF6'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await analyticsService.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Alert severity="error">
        {error || 'Failed to load dashboard data'}
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        CarMax AutoCare Network Dashboard
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Shops
                  </Typography>
                  <Typography variant="h4">
                    {stats.network_stats.total_shops}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {stats.network_stats.certification_rate}% certified
                  </Typography>
                </Box>
                <Store color="primary" sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Monthly Appointments
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.appointment_stats.total_this_month)}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{stats.appointment_stats.growth_rate}% growth
                  </Typography>
                </Box>
                <Schedule color="primary" sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Annual Savings
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats.financial_stats.estimated_annual_savings).replace('.00', '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs RepairPal fees
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Rating
                  </Typography>
                  <Typography variant="h4">
                    {stats.network_stats.average_rating}
                  </Typography>
                  <Rating value={stats.network_stats.average_rating} readOnly size="small" />
                </Box>
                <Star color="warning" sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top Services Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Services This Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_services}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066CC" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* MaxCare Usage Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MaxCare Usage Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'MaxCare', value: stats.appointment_stats.maxcare_usage_rate },
                      { name: 'Non-MaxCare', value: 100 - stats.appointment_stats.maxcare_usage_rate },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#0066CC" />
                    <Cell fill="#FFC20E" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" justifyContent="center" gap={3} mt={2}>
                <Box display="flex" alignItems="center">
                  <Box width={16} height={16} bgcolor="#0066CC" mr={1} />
                  <Typography variant="body2">MaxCare Customers</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box width={16} height={16} bgcolor="#FFC20E" mr={1} />
                  <Typography variant="body2">Regular Customers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary">Booking Fees (MTD)</Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(stats.financial_stats.booking_fees_mtd)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary">Referral Fees Saved</Typography>
                    <Typography variant="h5" color="success.main">
                      {formatCurrency(stats.financial_stats.referral_fees_saved)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary">Avg Booking Value</Typography>
                    <Typography variant="h5">
                      {formatCurrency(stats.appointment_stats.average_booking_value)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shop Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Performing Shops
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shop Name</TableCell>
                  <TableCell align="center">Appointments</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Satisfaction</TableCell>
                  <TableCell align="center">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.shop_performance.map((shop, index) => (
                  <TableRow key={index}>
                    <TableCell>{shop.shop_name}</TableCell>
                    <TableCell align="center">
                      <Chip label={shop.appointments} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <Rating value={shop.rating} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {shop.rating}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {shop.satisfaction_score}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={shop.satisfaction_score}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                          color={shop.satisfaction_score > 90 ? 'success' : 'primary'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {shop.satisfaction_score > 95 ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Excellent"
                          color="success"
                          size="small"
                        />
                      ) : shop.satisfaction_score > 90 ? (
                        <Chip
                          label="Good"
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Needs Improvement"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;