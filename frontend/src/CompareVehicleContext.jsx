import React, { createContext, useState, useContext, useCallback } from 'react';

// Create context for vehicle data
const VehicleContext = createContext();

export const VehicleProvider2 = ({ children }) => {
  const [vehicles, setVehiclesState] = useState({});
  

  const setVehicles = useCallback((updater) => {
    setVehiclesState((prevVehicles) => {
  
      const newVehicles = typeof updater === 'function' 
        ? updater(prevVehicles) 
        : updater;
        
      if (JSON.stringify(prevVehicles) === JSON.stringify(newVehicles)) {
        return prevVehicles;
      }
      
      return newVehicles;
    });
  }, []);
  

  const addVehicleData = useCallback((vehicleId, data) => {
    setVehicles(prev => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || {}),
        ...data,
        lastUpdated: new Date().getTime()
      }
    }));
  }, [setVehicles]);
  

  const removeVehicle = useCallback((vehicleId) => {
    setVehicles(prev => {
      const newVehicles = { ...prev };
      delete newVehicles[vehicleId];
      return newVehicles;
    });
  }, [setVehicles]);
  

  const value = {
    vehicles,
    setVehicles,
    addVehicleData,
    removeVehicle
  };
  
  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
};


export const useVehicleData = () => {
  const context = useContext(VehicleContext);
  
  if (!context) {
    throw new Error('useVehicleData must be used within a VehicleProvider');
  }
  
  return context;
};
