const mongoose = require('mongoose');

const CompareSchema = new mongoose.Schema({
  vehicle_type: {
    type: String,
    required: true
  },
  model_name: {
    type: String,
    required: true
  },
  battery_size: {
    type: Number,
    required: true
  },
  battery_soc: {
    type: Number,
    required: true
  },
  battery_temp: {
    type: Number,
    required: true
  },
  battery_health: {
    type: Number,
    required: true
  },
  current_state: {
    type: String,
    required: true
  },
  last_update: {
    type: Date
  },
  fleet_id: {
    type: Number
  },
  fleet_vehicle_id: {
    type: Number
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
});

const Compare = mongoose.model('compare', CompareSchema);
module.exports = Compare;