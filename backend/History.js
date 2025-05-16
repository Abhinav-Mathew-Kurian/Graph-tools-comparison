const mongoose = require('mongoose');

const LogEntrySchema = new mongoose.Schema({
  battery_soc: Number,
  battery_temp: Number,
  time_stamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const HistorySchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true
  },
  cycle_start_time: {
    type: Date,
    default: Date.now
  },
  logs: [LogEntrySchema]
});

const History = mongoose.model('History', HistorySchema);
module.exports = History;
