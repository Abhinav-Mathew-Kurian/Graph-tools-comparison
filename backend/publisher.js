const mqtt = require('mqtt');
const mongoose = require('mongoose');
const client = mqtt.connect('mqtt://localhost:1883');
const Car = require('./Car');
const History = require('./History');


const activeHistories = {};

client.on('connect', () => {
  console.log("Connected to MOSQUITTO MQTT Broker");
});

const startSimulation = () => {
  setInterval(async () => {
    try {
      const vehicles = await Car.find();

      for (const vehicle of vehicles) {
        let newSoc = vehicle.battery_soc - Math.random() * 1;
        const isReset = newSoc < 20;
        if (isReset) newSoc = 100;

        const newTemp = Math.floor(Math.random() * (45 - 15 + 1)) + 15;

        // Update vehicle in DB
        vehicle.battery_soc = parseFloat(newSoc.toFixed(2));
        vehicle.battery_temp = newTemp;
        vehicle.last_update = new Date();
        await vehicle.save();

        const vehicleId = vehicle._id.toString();
        const logEntry = {
          battery_soc: vehicle.battery_soc,
          battery_temp: vehicle.battery_temp,
          time_stamp: new Date()
        };

        // Manage history session
        if (!activeHistories[vehicleId] || isReset) {
          // Start a new cycle
          const newHistory = new History({
            vehicle_id: vehicleId,
            cycle_start_time: new Date(),
            logs: [logEntry]
          });
          await newHistory.save();
          activeHistories[vehicleId] = newHistory._id;
          
          // Log when a new history cycle is created
          console.log(`Created new history cycle for vehicle ${vehicle.model_name} (${vehicleId})`);
        } else {
          // Append to existing history document
          await History.findByIdAndUpdate(activeHistories[vehicleId], {
            $push: { logs: logEntry }
          });
        }

        // Publish via MQTT
        const topic = `car/${vehicle._id}/data`;
        const message = JSON.stringify(vehicle);
        client.publish(topic, message);

        console.log(`🚗 Simulated + Published data for ${vehicle.model_name}`);
      }

    } catch (err) {
      console.error("Error in simulation loop:", err);
    }
  }, 1000);
};

module.exports = {
  startSimulation
};