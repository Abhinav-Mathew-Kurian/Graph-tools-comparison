require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const Car = require('./Car');
const History = require('./History');
const { startSimulation } = require('./publisher');
const {startCompareSimulation} =require('./CompareLogic')

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

const port = process.env.PORT;
const mongo_URL = process.env.MONGO_URL;

// ----------------> CONNECT TO MONGO DB
const connectDb = async () => {
  try {
    await mongoose.connect(mongo_URL);
    console.log('MongoDB Atlas Connection successful and running');
  } catch (err) {
    console.error("MongoDB Atlas connection error", err);
    throw err;
  }
};

app.get('/', (req, res) => {
  res.send("Hello World");
});

app.get('/cars', async (req, res) => {
  console.log('Received GET request for /cars');
  
  try {
    const allCars = await Car.find();
    res.json(allCars);
  } catch (err) {
    console.error("Error Getting All car Data", err);
    res.status(500).send("Error fetching car data");
  }
});

app.get('/test', async (req, res) => {
  const allCars = await Car.find();
  const id = allCars.map(car => car._id)
  res.json(id)
});


app.get('/history/:vehicleId', async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const histories = await History.find({ vehicle_id: vehicleId }, '_id cycle_start_time');
    res.json(histories);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching history cycles' });
  }
});


app.get('/history/session/:historyId', async (req, res) => {
  try {
    const history = await History.findById(req.params.historyId);
    if (!history) return res.status(404).json({ error: 'History not found' });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching history session' });
  }
});


const startServer = async () => {
  try {
    await connectDb();
    startSimulation();
    startCompareSimulation();
    app.listen(port, () => {
      console.log(`Server running on port ${port} successfully`);
    });
  } catch (err) {
    console.error("Problem Starting server", err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

startServer();