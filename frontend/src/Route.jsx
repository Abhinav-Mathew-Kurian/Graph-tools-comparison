import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CarDashboard from './CarDashboard';
import MainLayout from './MainLayout';
import CompareCarDash from './CompareCarDash';


const CarRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/:carName/:carId" element={<CarDashboard />} />
      <Route path="/carcompare" element={<CompareCarDash/>}/>
    </Routes>
  );
};

export default CarRoutes;
