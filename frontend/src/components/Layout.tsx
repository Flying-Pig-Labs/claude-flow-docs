import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { DirectionsCar, AdminPanelSettings } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <DirectionsCar sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CarMax AutoCare Network
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => navigate('/search')}
            sx={{ 
              fontWeight: location.pathname === '/search' ? 'bold' : 'normal',
              textDecoration: location.pathname === '/search' ? 'underline' : 'none'
            }}
          >
            Find a Shop
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/admin')}
            startIcon={<AdminPanelSettings />}
            sx={{ 
              fontWeight: location.pathname === '/admin' ? 'bold' : 'normal',
              textDecoration: location.pathname === '/admin' ? 'underline' : 'none'
            }}
          >
            Admin Dashboard
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 CarMax AutoCare Network - Demo Version
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;