import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicleData } from './VehicleContext';
import {
  Box,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import Sidebar from './SideBar';
import axios from 'axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CarDashboard = () => {
  const { carId } = useParams();
  const { vehicles, setVehicles } = useVehicleData(); // Access setVehicles
  const navigate = useNavigate();

  const [socHistory, setSocHistory] = useState([]);
  const [tempHistory, setTempHistory] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const [historyOptions, setHistoryOptions] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [car, setCar] = useState(null); // Add state for the current car

  const MAX_DATA_POINTS = 30;

  const prevCarRef = useRef(null);
  const prevCarIdRef = useRef(null);

  const handleHome = () => {
    navigate('/');
  };

  // Fetch history session list when carId changes
  useEffect(() => {
    if (prevCarIdRef.current !== carId) {
      setSocHistory([]);
      setTempHistory([]);
      setTimeLabels([]);
      prevCarRef.current = null;
      prevCarIdRef.current = carId;
      setSelectedHistory('');
      setHistoryLogs([]);
    }

    const fetchHistoryOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching history for car ID: ${carId}`);
        const res = await axios.get(`http://localhost:4111/history/${carId}`);
        console.log('History options received:', res.data);
        setHistoryOptions(res.data);
      } catch (err) {
        console.error('Error fetching history options:', err);
        setError('Failed to fetch history options');
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchHistoryOptions();
    }
  }, [carId]);

  // Fetch specific history logs when dropdown changes
  const handleHistoryChange = async (e) => {
    const historyId = e.target.value;
    setSelectedHistory(historyId);

    if (!historyId) {
      setHistoryLogs([]);
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching history session: ${historyId}`);
      const res = await axios.get(`http://localhost:4111/history/session/${historyId}`);
      console.log('History session data:', res.data);
      setHistoryLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching history logs:', err);
      setError('Failed to fetch history data');
    } finally {
      setLoading(false);
    }
  };

    // Live data tracking
    useEffect(() => {
        const currentCar = vehicles[carId];
        if (!currentCar) return;

        setCar(currentCar); // Update the car state

        if (selectedHistory) return; // Only track live data if no history is selected

        if (
            prevCarRef.current?.battery_soc === currentCar.battery_soc &&
            prevCarRef.current?.battery_temp === currentCar.battery_temp
        ) {
            return;
        }

        prevCarRef.current = { ...currentCar };

        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        setTimeLabels((prev) => [...prev, timeStr].slice(-MAX_DATA_POINTS));
        setSocHistory((prev) => [...prev, currentCar.battery_soc].slice(-MAX_DATA_POINTS));
        setTempHistory((prev) => [...prev, currentCar.battery_temp].slice(-MAX_DATA_POINTS));

    }, [vehicles, carId, selectedHistory]);

  // const car = vehicles[carId]; // Removed this line
  if (!car) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Typography>Loading data for car ID: {carId}...</Typography>
        </Box>
      </Box>
    );
  }

  const chartLabels = historyLogs.length > 0
    ? historyLogs.map((log) => new Date(log.time_stamp).toLocaleTimeString())
    : timeLabels;

  const socData = historyLogs.length > 0
    ? historyLogs.map((log) => log.battery_soc)
    : socHistory;

  const tempData = historyLogs.length > 0
    ? historyLogs.map((log) => log.battery_temp)
    : tempHistory;

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Battery SoC (%)',
        data: socData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Temperature (°C)',
        data: tempData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Battery SoC (%)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `${car.model_name} - Battery Data`,
      },
    },
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Button onClick={handleHome} sx={{ mb: 2 }}>
          Go to Home
        </Button>

        <Typography variant="h4" sx={{ mb: 2 }}>
          {car.model_name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          <Typography variant="body1">
            <strong>Battery SoC:</strong> {car.battery_soc}%
          </Typography>
          <Typography variant="body1">
            <strong>Temperature:</strong> {car.battery_temp}°C
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 300, mb: 3 }}>
          <InputLabel>Select History Cycle</InputLabel>
          <Select
            value={selectedHistory}
            label="Select History Cycle"
            onChange={handleHistoryChange}
            disabled={loading}
          >
            <MenuItem value="">Live (Now)</MenuItem>
            {historyOptions.map((opt) => (
              <MenuItem key={opt._id} value={opt._id}>
                {new Date(opt.cycle_start_time).toLocaleString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Typography>Loading chart data...</Typography>
        ) : (
          <Box sx={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        )}
        
        {historyOptions.length === 0 && (
          <Typography sx={{ mt: 2, fontStyle: 'italic' }}>
            No history data available yet. History cycles are created when the battery is fully charged or drops below 20%.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CarDashboard;

