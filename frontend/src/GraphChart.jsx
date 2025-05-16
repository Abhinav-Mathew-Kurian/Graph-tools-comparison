import React, { useRef, useEffect, useState } from 'react';
import { useVehicleData } from './VehicleContext';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

// Register all Chart.js components
Chart.register(...registerables);

const GraphChart = () => {
  const { vehicles } = useVehicleData();
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);
  const navigate = useNavigate();

  const toCompareCarDash = () => {
    navigate('/carcompare');
  };

  // Cleanup function to destroy chart instance when component unmounts
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!vehicles || Object.keys(vehicles).length === 0) return;

    const getSocColor = (soc) => {
      if (soc < 30) return 'rgba(244, 67, 54, 0.8)'; 
      if (soc < 50) return 'rgba(255, 152, 0, 0.8)';
      if (soc < 80) return 'rgba(33, 150, 243, 0.8)'; 
      return 'rgba(76, 175, 80, 0.8)'; 
    };
    
    const getTempColor = (temp) => {
      const normalizedTemp = Math.max(0, Math.min(1, (temp - 10) / 40));
      const r = Math.round(normalizedTemp * 255);
      const b = Math.round((1 - normalizedTemp) * 255);
      return `rgba(${r}, 0, ${b}, 0.8)`;
    };

    const vehicleArray = Object.values(vehicles);
    
    // Prepare data for ChartJS
    const data = {
      labels: vehicleArray.map(v => v.model_name),
      datasets: [
        {
          label: 'Battery SoC (%)',
          data: vehicleArray.map(v => v.battery_soc || 0),
          backgroundColor: vehicleArray.map(v => getSocColor(v.battery_soc || 0)),
          borderColor: vehicleArray.map(v => getSocColor(v.battery_soc || 0).replace('0.8', '1')),
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Battery Temperature (°C)',
          data: vehicleArray.map(v => v.battery_temp || 0),
          backgroundColor: vehicleArray.map(v => getTempColor(v.battery_temp || 0)),
          borderColor: vehicleArray.map(v => getTempColor(v.battery_temp || 0).replace('0.8', '1')),
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };

    // Define options outside of the useEffect
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            }
          },
          title: {
            display: true,
            text: 'Vehicle Models',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: { top: 20 }
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Battery SoC (%)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 50,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Battery Temperature (°C)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (context) => {
              const dataset = context.dataset.label;
              const value = context.raw;
              const unit = dataset.includes('Temperature') ? '°C' : '%';
              return `${dataset}: ${value}${unit}`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: { bottom: 30 }
        }
      }
    };

    setChartData({ data, options });
  }, [vehicles]); 

  return (
    <>
      <Card sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
            Vehicle Battery Analysis
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {chartData && <Bar data={chartData.data} options={chartData.options} />}
            {!chartData && (
              <Typography variant="body1" sx={{ textAlign: 'center', pt: 10 }}>
                Loading data...
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Battery state of charge (SoC) and temperature side by side
          </Typography>
        </CardContent>
      </Card>
      <Button onClick={toCompareCarDash}>To Car Compare Dashboard</Button>
    </>
  );
};

export default GraphChart;