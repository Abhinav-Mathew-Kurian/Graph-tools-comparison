import React, { useEffect, useState, useRef, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useVehicleData } from './VehicleContext';

const Graph = () => {
  const { vehicles } = useVehicleData();
  const chartRef = useRef(null);
  const [vehicleHistory, setVehicleHistory] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('battery_soc');
  const maxDataPoints = 60;

  const metrics = {
    battery_soc: { name: 'Battery SoC (%)', min: 0, max: 100, color: 'rgba(33, 150, 243, 1)', format: '{value}%' },
    battery_temp: { name: 'Battery Temp (°C)', min: 10, max: 50, color: 'rgba(244, 67, 54, 1)', format: '{value}°C' }
  };

  // Initial chart options setup
  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: 'line',
      height: '600px',
      animation: false,
      style: {
        fontFamily: 'Arial, sans-serif'
      },
      zoomType: 'x' // Allow zooming on x-axis
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Vehicle Data Tracking',
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333'
      }
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time',
        style: {
          fontWeight: 'bold',
          fontSize: '16px'
        }
      },
      labels: {
        format: '{value:%H:%M:%S}',
        style: {
          fontSize: '12px'
        }
      },
      tickPixelInterval: 100
    },
    yAxis: {
      title: {
        text: metrics[selectedMetric].name,
        style: {
          color: metrics[selectedMetric].color,
          fontWeight: 'bold'
        }
      },
      labels: {
        format: metrics[selectedMetric].format,
        style: {
          color: metrics[selectedMetric].color
        }
      },
      min: metrics[selectedMetric].min,
      max: metrics[selectedMetric].max
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      xDateFormat: '%Y-%m-%d %H:%M:%S',
      headerFormat: '<b>{point.x:%H:%M:%S}</b><br/>',
      pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.2f}</b><br/>',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#ccc',
      borderRadius: 10,
      borderWidth: 1
    },
    legend: {
      enabled: true,
      layout: 'horizontal',
      align: 'center',
      verticalAlign: 'bottom',
      maxHeight: 80,
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderWidth: 1,
      borderRadius: 5,
      itemStyle: {
        fontSize: '10px'
      },
      // Scrollable legend for many vehicles
      navigation: {
        activeColor: '#3E576F',
        animation: true,
        arrowSize: 12,
        inactiveColor: '#CCC',
        style: {
          fontWeight: 'bold',
          color: '#333'
        }
      }
    },
    plotOptions: {
      line: {
        marker: {
          enabled: false
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3
          }
        }
      },
      series: {
        animation: false
      }
    },
    series: [],
    credits: {
      enabled: false
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          chart: {
            height: '400px'
          },
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          }
        }
      }]
    }
  });

  // Process incoming vehicle data - add dependency on metrics[selectedMetric]
  useEffect(() => {
    if (Object.keys(vehicles).length === 0) return;

    const currentTime = Date.now();

    setVehicleHistory(prevHistory => {
      const newHistory = { ...prevHistory };

      Object.values(vehicles).forEach(vehicle => {
        const vehicleId = vehicle._id;
        const displayName = vehicle.model_name
          ? `${vehicle.model_name} (${vehicleId.slice(-4)})`
          : vehicleId.slice(-4);

        if (!newHistory[vehicleId]) {
          newHistory[vehicleId] = {
            id: vehicleId,
            name: displayName,
            battery_soc: [],
            battery_temp: []
          };
        }

        // Only update the current selected metric data
        const value = parseFloat(vehicle[selectedMetric]);
        if (!isNaN(value)) {
          newHistory[vehicleId][selectedMetric].push({
            x: currentTime,
            y: value
          });

          if (newHistory[vehicleId][selectedMetric].length > maxDataPoints) {
            newHistory[vehicleId][selectedMetric].shift();
          }
        }
      });

      return newHistory;
    });
  }, [vehicles, selectedMetric]); // Include selectedMetric but not metrics object

  // Memoize the series data calculation to avoid unnecessary updates
  const createSeries = useCallback(() => {
    return Object.values(vehicleHistory).map((vehicleData, index) => {
      const hue = (index * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 50%)`;

      return {
        name: vehicleData.name,
        data: [...vehicleData[selectedMetric]],
        color: color,
        type: 'line'
      };
    });
  }, [vehicleHistory, selectedMetric]);

  // Update chart options based on vehicleHistory and selectedMetric
  useEffect(() => {
    // Skip updating if there's no data
    if (Object.keys(vehicleHistory).length === 0) {
      return;
    }

    const currentMetric = metrics[selectedMetric];
    const newSeries = createSeries();

    setChartOptions(prevOptions => ({
      ...prevOptions,
      yAxis: {
        ...prevOptions.yAxis,
        title: {
          text: currentMetric.name,
          style: {
            color: currentMetric.color,
            fontWeight: 'bold'
          }
        },
        labels: {
          format: currentMetric.format,
          style: {
            color: currentMetric.color
          }
        },
        min: currentMetric.min,
        max: currentMetric.max
      },
      series: newSeries
    }));
  }, [vehicleHistory, selectedMetric, createSeries]);

  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  if (Object.keys(vehicles).length === 0) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: 'auto',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f4f4f4',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p>No vehicle data available</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: 'auto',
      padding: '20px',
      backgroundColor: '#f4f4f4',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Vehicle Data Monitor</h2>
        <div>
          <label htmlFor="metric-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Select Metric:
          </label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={handleMetricChange}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="battery_soc">Battery SoC (%)</option>
            <option value="battery_temp">Battery Temperature (°C)</option>
          </select>
        </div>
      </div>

      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
      />

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        Showing last {maxDataPoints} seconds of data • {Object.keys(vehicleHistory).length} vehicles tracked
      </div>
    </div>
  );
};

export default Graph;