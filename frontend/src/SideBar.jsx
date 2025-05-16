import React from 'react';
import { Drawer, List, ListItem, Box, Toolbar, Typography } from '@mui/material';
import { useVehicleData } from './VehicleContext';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

export default function Sidebar() {
  const { vehicles } = useVehicleData();
  const navigate = useNavigate();

  const handleIndividualCar = (model_name, id) => {
    const carName = encodeURIComponent(model_name?.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/${carName}/${id}`);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        {Object.values(vehicles).map((car, index) => (
          <ListItem
            button
            key={car._id || index}
            onClick={() => handleIndividualCar(car.model_name, car._id)}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {car.model_name || `Car ${index + 1}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {car.vehicle_type || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Battery: {car.battery_soc?.toFixed(1)}%
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
