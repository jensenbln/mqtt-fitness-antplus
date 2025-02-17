const Ant = require('ant-plus');
const mqtt = require('mqtt');
const FitnessDataManager = require('./src/displayManager');
const mqttConfig = require('./config/mqtt-config');
const winston = require('winston');
const http = require('http');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).option('noDisplay', {
  alias: 'd',
  type: 'boolean',
  description: 'Disable display manager',
  default: false
}).argv;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'fitness-data.log' })
  ]
});

const client = mqtt.connect({
  host: mqttConfig.host,
  port: mqttConfig.port,
  username: mqttConfig.username,
  password: mqttConfig.password
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  logger.info('Connected to MQTT broker');
});

const stick = new Ant.GarminStick2();
let powerSensor = null;
let heartRateSensor = null;
const fitnessDisplay = new FitnessDataManager();

stick.on('startup', function() {
  logger.info('ANT+ stick initialized');
  console.log('ANT+ stick initialized');

  // Create power sensor connection
  powerSensor = new Ant.BicyclePowerSensor(stick);

  powerSensor.on('powerData', data => {
    fitnessDisplay.updatePowerData(data);
    client.publish(`${mqttConfig.topic}/power`, JSON.stringify({
      watts: data.Power || 0,
      cadence: data.Cadence || 0
    }));
  });

  // Create heart rate sensor connection
  heartRateSensor = new Ant.HeartRateSensor(stick);

  heartRateSensor.on('hbData', data => {
    fitnessDisplay.updateHeartRateData(data);
    client.publish(`${mqttConfig.topic}/heart_rate`, JSON.stringify({
      heartRate: data.ComputedHeartRate || 0
    }));
  });

  // Start the display if not disabled
  if (!argv.noDisplay) {
    fitnessDisplay.startDisplay();
  }

  // Start scanning both sensors
  powerSensor.attach(1, 0);
  heartRateSensor.attach(0, 0);
});

stick.on('error', error => {
  console.error('ANT+ error:', error);
  logger.error('ANT+ error:', error);
});

// Initialize stick
if (!stick.open()) {
  console.error('Failed to open ANT+ stick');
  logger.error('Failed to open ANT+ stick');
  process.exit(1);
}

// Handle cleanup
process.on('SIGINT', () => {
  logger.info('Closing ANT+ connections');
  console.log('Closing ANT+ connections');
  fitnessDisplay.stopDisplay();
  if (powerSensor) {
    powerSensor.detach();
  }
  if (heartRateSensor) {
    heartRateSensor.detach();
  }
  stick.close();
  process.exit();
});

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8080, '0.0.0.0', () => {
  logger.info('HTTP server listening on port 8080');
  console.log('HTTP server listening on port 8080');
});
