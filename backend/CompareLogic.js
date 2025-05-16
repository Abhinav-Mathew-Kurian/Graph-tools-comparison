const mqtt = require('mqtt');
const Compare = require('./Compare'); 
const History = require('./History'); 

const client = mqtt.connect('mqtt://localhost:1883');
const activeHistories = {};
const external_temp_map = {}; 

client.on('connect', () => {
  console.log("✅ MQTT Broker for Comparison Car has started");

  client.subscribe('car/+/weather', (err) => {
    if (err) {
      console.error("❌ Failed to subscribe to weather topic", err);
    } else {
      console.log("📡 Subscribed to weather topics");
    }
  });
});


client.on('message', (topic, message) => {
  if (topic.startsWith('car/') && topic.endsWith('/weather')) {
    try {
      const [, vehicleId] = topic.split('/');
      const payload = JSON.parse(message.toString());
      const temp = payload.outsideTemperature;

      external_temp_map[vehicleId] = temp;

      console.log(`🌤️  Weather received: ${temp}°C for vehicle ${vehicleId}`);
    } catch (err) {
      console.error("❌ Error parsing weather data", err);
    }
  }
});

const startCompareSimulation = () => {
  setInterval(async () => {
    try {
      const vehicles = await Compare.find();

      for (const vehicle of vehicles) {
        const vehicleId = vehicle._id.toString();
        const external_temp = external_temp_map[vehicleId] || 25; 

        let newSoc = vehicle.battery_soc - Math.random() * 1;
        const isReset = newSoc < 20;
        if (isReset) newSoc = 100;

        let soc_factor = 1;
        let newTemp;
        const cold_thermal_insulation = external_temp + Math.random() * (8 - 6) + 6;

        if (external_temp <= 10) {
          soc_factor = 2;
          newTemp = cold_thermal_insulation;
        } else if (external_temp <= 20) {
          soc_factor = 1;
          newTemp = Math.random() * (25 - 15) + 15;
        } else if (external_temp <= 30) {
          soc_factor = 1.2;
          newTemp = Math.random() * (35 - 25) + 25;
        } else if (external_temp <= 40) {
          soc_factor = 1.4;
          newTemp = Math.random() * (42 - 35) + 35;
        } else {
          soc_factor = 1.4;
          newTemp = Math.random() * (50 - 40) + 40;
        }

        vehicle.battery_soc = parseFloat(newSoc.toFixed(2));
        vehicle.battery_temp = parseFloat(newTemp.toFixed(2));
        vehicle.last_update = new Date();
        await vehicle.save();

     
        const logEntry = {
          battery_soc: vehicle.battery_soc,
          battery_temp: vehicle.battery_temp,
          time_stamp: new Date()
        };

        if (!activeHistories[vehicleId] || isReset) {
          const newHistory = new History({
            vehicle_id: vehicleId,
            cycle_start_time: new Date(),
            logs: [logEntry]
          });
          await newHistory.save();
          activeHistories[vehicleId] = newHistory._id;
          console.log(`🆕 New history started for ${vehicle.model_name} (${vehicleId})`);
        } else {
          await History.findByIdAndUpdate(activeHistories[vehicleId], {
            $push: { logs: logEntry }
          });
        }

        
        const topic = `carCompare/${vehicle._id}/data`;
        const message = JSON.stringify(vehicle);
        client.publish(topic, message);

        console.log(`🚗 CarCompare Simulated +  Published data for ${vehicle.model_name}`);
      }
    } catch (err) {
      console.error("❌ Error in compare simulation logic", err);
    }
  }, 1000); 
};

module.exports = {
  startCompareSimulation
};
