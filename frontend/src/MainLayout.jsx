// MainLayout.jsx
import React from 'react';
import { Box, CssBaseline, Toolbar, AppBar, Typography } from '@mui/material';
import Sidebar from './SideBar';
import useMqtt from './useMqtt';
import Graph from './Graph';
import GraphD3 from '../GraphD3';
import GraphChart from './GraphChart';

const drawerWidth = 240;

function MainLayout() {
  useMqtt(); 

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <GraphChart/>
      </Box>
    </Box>
  );
}

export default MainLayout;
