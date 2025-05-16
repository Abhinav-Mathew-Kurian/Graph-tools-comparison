import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVehicleData } from './CompareVehicleContext';
import mqtt from 'mqtt';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const CombinedDashboard = () => {
  const { vehicles } = useVehicleData();
  
  // State for tracking data points
  const [weatherData, setWeatherData] = useState({});
  const [vehicleHistory, setVehicleHistory] = useState({});
  
  // Refs for better performance with real-time data
  const chartDataRef = useRef({});
  const maxDataPoints = 30;

  // Handle weather data fetching
  useEffect(() => {
    if (!vehicles || Object.keys(vehicles).length === 0) return;
    
    const client = mqtt.connect('ws://localhost:9001');
    
    client.on('connect', () => {
      console.log('Connected to MQTT broker for weather data');
      
      Object.entries(vehicles).forEach(([vehicleId, vehicle]) => {
        const { latitude, longitude } = vehicle;
        
        if (!latitude || !longitude) return;
        
        const API_KEY = '2b257603eccc625605b64cbec768d86d';
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
        
        fetch(weatherUrl)
          .then(response => response.json())
          .then(data => {
            setWeatherData(prev => ({
              ...prev,
              [vehicleId]: {
                temp: data.main.temp,
                city: data.name,
                icon: data.weather[0].icon,
                description: data.weather[0].description
              }
            }));
            
            // Publish to MQTT
            const topic = `car/${vehicleId}/weather`;
            const payload = JSON.stringify({ outsideTemperature: data.main.temp });
            
            client.publish(topic, payload);
          })
          .catch(error => {
            console.error(`Error fetching weather data:`, error);
          });
      });
    });
    
    return () => {
      client.end();
    };
  }, [vehicles]);
  
  // Update chart data whenever vehicle data changes (real-time updates)
  useEffect(() => {
    if (!vehicles || Object.keys(vehicles).length === 0) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    // Initialize chart data structure if not present
    if (!chartDataRef.current.combinedData) {
      chartDataRef.current.combinedData = [];
      
      // Add initial data points to make the chart look better from the start
      for (let i = 10; i > 0; i--) {
        const pastTime = new Date(now.getTime() - (i * 1000));
        const initialPoint = {
          time: pastTime.toLocaleTimeString(),
          timestamp: pastTime.getTime()
        };
        
        // Add placeholder data for each vehicle
        Object.entries(vehicles).forEach(([vehicleId, vehicle]) => {
          // Slightly randomize initial values for better visualization
          const socVariation = (Math.random() * 3) - 1.5;  // -1.5 to +1.5
          const tempVariation = (Math.random() * 1) - 0.5; // -0.5 to +0.5
          
          initialPoint[`${vehicleId}_soc`] = Math.max(0, Math.min(100, vehicle.battery_soc + socVariation));
          initialPoint[`${vehicleId}_temp`] = vehicle.battery_temp + tempVariation;
          initialPoint[`${vehicleId}_model`] = vehicle.model_name;
        });
        
        chartDataRef.current.combinedData.push(initialPoint);
      }
    }
    
    // Add new data point for current values
    const newDataPoint = {
      time: timeStr,
      timestamp: now.getTime(),
    };
    
    // Add data for each vehicle
    Object.entries(vehicles).forEach(([vehicleId, vehicle]) => {
      newDataPoint[`${vehicleId}_soc`] = vehicle.battery_soc;
      newDataPoint[`${vehicleId}_temp`] = vehicle.battery_temp;
      newDataPoint[`${vehicleId}_model`] = vehicle.model_name;
    });
    
    // Add to chart data and limit to max points
    chartDataRef.current.combinedData = [
      ...chartDataRef.current.combinedData,
      newDataPoint
    ].slice(-maxDataPoints);
    
    
    setVehicleHistory({ ...vehicleHistory, lastUpdate: now.getTime() });
  }, [vehicles]);
  
  
  const chart = useMemo(() => {
    if (!chartDataRef.current.combinedData || chartDataRef.current.combinedData.length === 0) {
      return <div>No data available yet</div>;
    }
    
    const data = chartDataRef.current.combinedData;
    
    // Generate lines for each vehicle
    const vehicleLines = [];
    Object.keys(vehicles).forEach((vehicleId, index) => {
      const colorSet = [
        { soc: '#3182CE', temp: '#E53E3E' }, // Blue/Red 
        { soc: '#38A169', temp: '#DD6B20' }  // Green/Orange
      ];
      const colors = colorSet[index % colorSet.length];
      
      vehicleLines.push(
        <Line
          key={`${vehicleId}_soc`}
          type="monotone"
          dataKey={`${vehicleId}_soc`}
          name={`${vehicles[vehicleId].model_name || 'Vehicle'} SoC (%)`}
          stroke={colors.soc}
          strokeWidth={2}
          dot={false}
          yAxisId="soc"
          isAnimationActive={true} 
        />
      );
      
      vehicleLines.push(
        <Line
          key={`${vehicleId}_temp`}
          type="monotone"
          dataKey={`${vehicleId}_temp`}
          name={`${vehicles[vehicleId].model_name || 'Vehicle'} Temp (°C)`}
          stroke={colors.temp}
          strokeWidth={2}
          dot={false}
          yAxisId="temp"
          isAnimationActive={false} // Disable animation for better performance with real-time data
        />
      );
    });
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveEnd"
            minTickGap={30}
          />
          <YAxis 
            yAxisId="soc" 
            domain={[0, 100]}
            tickCount={6} 
            label={{ value: 'SoC (%)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="temp"
            orientation="right"
            label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            formatter={(value, name) => [
              `${parseFloat(value).toFixed(1)}${name.includes('SoC') ? '%' : '°C'}`, 
              name
            ]}
          />
          <Legend />
          {vehicleLines}
        </LineChart>
      </ResponsiveContainer>
    );
  }, [vehicles, vehicleHistory.lastUpdate]);
  
  // Component for the vehicle cards
  const VehicleCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(vehicles).map(([vehicleId, vehicle]) => {
          const vehicleWeather = weatherData[vehicleId] || {};
          
          return (
            <div key={vehicleId} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-2">{vehicle.model_name}</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500 text-sm">Battery SoC</div>
                  <div className="text-xl font-semibold">{vehicle.battery_soc}%</div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500 text-sm">Battery Temp</div>
                  <div className="text-xl font-semibold">{vehicle.battery_temp}°C</div>
                </div>
              </div>
              
              <div>
                <div className="mb-1">
                  <span className="font-medium">Status:</span> {vehicle.current_state || 'Unknown'}
                </div>
                
                {vehicleWeather?.temp && (
                  <div className="flex items-center">
                    <span className="font-medium">Weather:</span> 
                    <span className="ml-1">{vehicleWeather.temp}°C in {vehicleWeather.city || 'location'}</span>
                    {vehicleWeather.icon && (
                      <img
                        src={`http://openweathermap.org/img/wn/${vehicleWeather.icon}.png`}
                        alt={vehicleWeather.description}
                        width="24"
                        height="24"
                        className="ml-1"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  if (!vehicles || Object.keys(vehicles).length === 0) {
    return <div className="p-4">Loading vehicle data...</div>;
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vehicle Battery Comparison</h1>
        <button 
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => window.history.back()}
        >
          Back
        </button>
      </div>
      
      {/* Main Chart Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Combined Battery Data</h2>
        {chart}
      </div>
      
      {/* Vehicle Cards */}
      <VehicleCards />
    </div>
  );
};

export default CombinedDashboard;