
class FitnessDataManager {
  constructor() {
    this.lastPowerData = { watts: 0, cadence: 0 };
    this.lastHeartRateData = { heartRate: 0 };
    this.displayInterval = null;
    this.startTime = Date.now();
  }

  updatePowerData(data) {
    this.lastPowerData = {
      watts: data.Power || 0,
      cadence: data.Cadence || 0
    };
  }

  updateHeartRateData(data) {
    this.lastHeartRateData = {
      heartRate: data.ComputedHeartRate || 0
    };
  }

  getElapsedTime() {
    const seconds = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  getZone(heartRate) {
    if (heartRate < 60) return 'Rest';
    if (heartRate < 117) return 'Zone 1 - Recovery';
    if (heartRate < 137) return 'Zone 2 - Endurance';
    if (heartRate < 157) return 'Zone 3 - Tempo';
    if (heartRate < 177) return 'Zone 4 - Threshold';
    return 'Zone 5 - Maximum';
  }

  startDisplay() {
    console.clear();
    this.displayInterval = setInterval(() => {
      console.clear();
      const hr = this.lastHeartRateData.heartRate;
      const zone = this.getZone(hr);
      
      console.log('\x1b[1m\x1b[36m╔═══════════ FITNESS DATA DISPLAY ═══════════╗\x1b[0m');
      console.log(`\x1b[1m║ Elapsed Time: ${this.getElapsedTime()}                     ║\x1b[0m`);
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║ Power:     \x1b[33m${this.lastPowerData.watts.toString().padStart(3)}\x1b[0m W                           ║`);
      console.log(`║ Cadence:   \x1b[32m${this.lastPowerData.cadence.toString().padStart(3)}\x1b[0m RPM                         ║`);
      console.log(`║ Heart Rate: \x1b[31m${hr.toString().padStart(3)}\x1b[0m BPM                        ║`);
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║ Training Zone: \x1b[35m${zone.padEnd(25)}\x1b[0m   ║`);
      console.log('\x1b[1m\x1b[36m╚════════════════════════════════════════════╝\x1b[0m');
    }, 1000);
  }

  stopDisplay() {
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
    }
  }
}

module.exports = FitnessDataManager;

