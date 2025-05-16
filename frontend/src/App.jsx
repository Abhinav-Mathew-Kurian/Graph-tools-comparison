import React from 'react';
import { VehicleProvider } from './VehicleContext';
import { VehicleProvider2 } from './CompareVehicleContext';
import { BrowserRouter as Router } from 'react-router-dom';
import CarRoutes from './Route';
import useMqtt from './useMqtt';
import compareMqtt from './compareMqtt';

// Create a component that only handles the MQTT connection
function MqttHandler() {
  useMqtt();
  compareMqtt();
  return null; 
}

function App() {
  return (
    <VehicleProvider>
      <VehicleProvider2>
        <Router>
          <MqttHandler />
          <CarRoutes />
        </Router>
        </VehicleProvider2>
    </VehicleProvider>
  );
}

export default App;