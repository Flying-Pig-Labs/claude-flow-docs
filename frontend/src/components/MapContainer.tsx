import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { Shop } from '../types';

interface MapContainerProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onShopSelect: (shop: Shop) => void;
  center: { lat: number; lng: number };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  shops,
  selectedShop,
  onShopSelect,
  center,
}) => {
  // For demo purposes, we'll create a simple visual representation
  // In production, this would use Mapbox or Google Maps
  
  return (
    <Paper sx={{ height: '100%', position: 'relative', overflow: 'hidden', bgcolor: '#E8F4F8' }}>
      {/* Map Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(45deg, #E8F4F8 25%, #D1E7ED 25%, #D1E7ED 50%, #E8F4F8 50%, #E8F4F8 75%, #D1E7ED 75%, #D1E7ED)',
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />
      
      {/* Center Marker */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: 'error.main',
          border: '3px solid white',
          boxShadow: 2,
          zIndex: 2,
        }}
      />
      
      {/* Shop Markers */}
      {shops.map((shop, index) => {
        // Simple positioning based on distance and index for demo
        const angle = (index / shops.length) * 2 * Math.PI;
        const distance = Math.min(shop.distance || 10, 25) * 10; // Scale distance for display
        const x = 50 + (distance / 5) * Math.cos(angle);
        const y = 50 + (distance / 5) * Math.sin(angle);
        
        return (
          <Box
            key={shop.id}
            sx={{
              position: 'absolute',
              top: `${y}%`,
              left: `${x}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: selectedShop?.id === shop.id ? 3 : 1,
            }}
            onClick={() => onShopSelect(shop)}
          >
            <LocationOn
              sx={{
                fontSize: selectedShop?.id === shop.id ? 48 : 40,
                color: shop.is_maxcare_certified ? 'primary.main' : 'grey.600',
                filter: selectedShop?.id === shop.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            />
            {selectedShop?.id === shop.id && (
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  p: 1,
                  mb: 1,
                  minWidth: 200,
                  boxShadow: 3,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {shop.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {shop.distance} miles • {shop.rating} ★
                </Typography>
              </Paper>
            )}
          </Box>
        );
      })}
      
      {/* Map Controls (simplified) */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Paper sx={{ p: 1, cursor: 'pointer' }}>
          <Typography variant="h6" align="center">+</Typography>
        </Paper>
        <Paper sx={{ p: 1, cursor: 'pointer' }}>
          <Typography variant="h6" align="center">−</Typography>
        </Paper>
      </Box>
      
      {/* Legend */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          p: 2,
        }}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Legend
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <LocationOn sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="caption">MaxCare Certified</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: 'grey.600', fontSize: 20 }} />
          <Typography variant="caption">Standard Shop</Typography>
        </Box>
      </Paper>
    </Paper>
  );
};