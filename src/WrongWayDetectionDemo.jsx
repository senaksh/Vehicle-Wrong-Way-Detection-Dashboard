import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, Activity, Car, TrendingUp, Download, Play, Pause, RefreshCw, FileText, MapPin, Clock } from 'lucide-react';

const WrongWayDetectionDemo = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const animationRef = useRef(null);
  const vehiclesRef = useRef([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [stats, setStats] = useState({
    totalVehicles: 0,
    wrongWayVehicles: 0,
    platesRecognized: 0,
    accuracy: 98.5,
    fps: 0
  });

  // Generate random license plate
  const generateLicensePlate = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let plate = '';
    for (let i = 0; i < 2; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 2; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    for (let i = 0; i < 2; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 1; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return plate;
  };

  // Get vehicle type
  const getVehicleType = () => {
    const types = ['Car', 'Truck', 'Bus', 'SUV', 'Van'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Vehicle class with license plate
  class Vehicle {
    constructor(x, y, direction, lane, isWrongWay = false) {
      this.x = x;
      this.y = y;
      this.width = 40;
      this.height = 60;
      this.direction = direction;
      this.speed = isWrongWay ? 2 + Math.random() * 2 : 2 + Math.random() * 3;
      this.lane = lane;
      this.isWrongWay = isWrongWay;
      this.color = isWrongWay ? '#ef4444' : '#3b82f6';
      this.id = Math.random().toString(36).substr(2, 9);
      this.detectionConfidence = 0.85 + Math.random() * 0.14;
      this.trajectory = [];
      this.alertGenerated = false;
      this.licensePlate = generateLicensePlate();
      this.plateConfidence = 0.75 + Math.random() * 0.24;
      this.plateRecognized = Math.random() < 0.85;
      this.vehicleType = getVehicleType();
      this.logged = false;
    }

    update() {
      this.trajectory.push({ x: this.x, y: this.y });
      if (this.trajectory.length > 10) this.trajectory.shift();

      if (this.direction === 'down') {
        this.y += this.speed;
      } else {
        this.y -= this.speed;
      }
    }

    draw(ctx) {
      // Draw trajectory
      ctx.strokeStyle = this.isWrongWay ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.trajectory.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x + this.width / 2, point.y + this.height / 2);
        else ctx.lineTo(point.x + this.width / 2, point.y + this.height / 2);
      });
      ctx.stroke();

      // Draw vehicle
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Draw vehicle details
      ctx.fillStyle = 'white';
      ctx.fillRect(this.x + 5, this.y + 10, 30, 15);
      ctx.fillRect(this.x + 5, this.y + 35, 30, 15);

      // Draw license plate
      if (this.plateRecognized) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(this.x + 5, this.y + this.height - 12, 30, 8);
        ctx.fillStyle = '#000000';
        ctx.font = '6px Arial';
        ctx.fillText(this.licensePlate, this.x + 7, this.y + this.height - 5);
      }

      // Draw bounding box
      ctx.strokeStyle = this.isWrongWay ? '#ef4444' : '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);

      // Draw label with plate info
      const label = `${this.isWrongWay ? 'WRONG WAY' : 'Normal'} ${(this.detectionConfidence * 100).toFixed(1)}%`;
      const plateLabel = this.plateRecognized ? this.licensePlate : 'N/A';
      
      ctx.fillStyle = this.isWrongWay ? '#ef4444' : '#10b981';
      ctx.fillRect(this.x - 5, this.y - 50, 150, 40);
      ctx.fillStyle = 'white';
      ctx.font = '11px Arial';
      ctx.fillText(label, this.x, this.y - 33);
      ctx.font = '10px Arial';
      ctx.fillText(`${this.vehicleType} - ${plateLabel}`, this.x, this.y - 18);
      ctx.fillText(`${(this.plateConfidence * 100).toFixed(0)}% conf`, this.x, this.y - 8);

      // Draw direction arrow
      ctx.fillStyle = this.isWrongWay ? '#fca5a5' : '#93c5fd';
      ctx.beginPath();
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      if (this.direction === 'down') {
        ctx.moveTo(centerX, centerY + 10);
        ctx.lineTo(centerX - 8, centerY - 5);
        ctx.lineTo(centerX + 8, centerY - 5);
      } else {
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX - 8, centerY + 5);
        ctx.lineTo(centerX + 8, centerY + 5);
      }
      ctx.fill();
    }

    isOffScreen(height) {
      return this.y > height + 100 || this.y < -100;
    }
  }

  const initSimulation = () => {
    vehiclesRef.current = [];
    setAlerts([]);
    setDetections([]);
    setRecentDetections([]);
    frameCountRef.current = 0;
    setStats(prev => ({ ...prev, totalVehicles: 0, wrongWayVehicles: 0, platesRecognized: 0, fps: 0 }));
  };

  const spawnVehicle = (canvas) => {
    const lanes = [
      { x: 150, direction: 'down', correctDirection: 'down' },
      { x: 220, direction: 'down', correctDirection: 'down' },
      { x: 450, direction: 'up', correctDirection: 'up' },
      { x: 520, direction: 'up', correctDirection: 'up' }
    ];

    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const isWrongWay = Math.random() < 0.15;
    const direction = isWrongWay ? (lane.correctDirection === 'down' ? 'up' : 'down') : lane.correctDirection;
    const y = direction === 'down' ? -60 : canvas.height + 60;

    const vehicle = new Vehicle(lane.x, y, direction, lane.x, isWrongWay);
    vehiclesRef.current.push(vehicle);

    setStats(prev => ({
      ...prev,
      totalVehicles: prev.totalVehicles + 1,
      wrongWayVehicles: isWrongWay ? prev.wrongWayVehicles + 1 : prev.wrongWayVehicles,
      platesRecognized: vehicle.plateRecognized ? prev.platesRecognized + 1 : prev.platesRecognized
    }));

    if (isWrongWay && !vehicle.alertGenerated) {
      vehicle.alertGenerated = true;
      const alert = {
        id: vehicle.id,
        time: new Date().toLocaleTimeString(),
        lane: lane.x === 150 || lane.x === 220 ? 'Lane 1-2' : 'Lane 3-4',
        confidence: vehicle.detectionConfidence,
        plate: vehicle.plateRecognized ? vehicle.licensePlate : 'Unrecognized',
        action: 'Alert Sent to Traffic Control'
      };
      setAlerts(prev => [alert, ...prev.slice(0, 4)]);
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw road
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lane markings
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    [185, 485].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    });

    // Direction arrows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([]);
    for (let y = 50; y < canvas.height; y += 120) {
      drawArrow(ctx, 185, y, 'down');
      drawArrow(ctx, 485, y, 'up');
    }

    // Update and draw vehicles
    vehiclesRef.current = vehiclesRef.current.filter(vehicle => {
      vehicle.update();
      vehicle.draw(ctx);
      
      // Log to Recent Detections when vehicle reaches middle of screen
      if (!vehicle.logged && vehicle.y > 200 && vehicle.y < 300) {
        vehicle.logged = true;
        const detection = {
          id: vehicle.id,
          time: new Date().toLocaleTimeString(),
          vehicleType: vehicle.vehicleType,
          licensePlate: vehicle.plateRecognized ? vehicle.licensePlate : 'N/A',
          confidence: vehicle.detectionConfidence,
          status: vehicle.isWrongWay ? 'Wrong Direction' : 'Normal'
        };
        setRecentDetections(prev => [detection, ...prev.slice(0, 9)]);
      }
      
      return !vehicle.isOffScreen(canvas.height);
    });

    // Update current detections
    const currentDetections = vehiclesRef.current.map(v => ({
      id: v.id,
      type: v.isWrongWay ? 'Wrong-Way' : 'Normal',
      confidence: v.detectionConfidence,
      lane: v.lane === 150 || v.lane === 220 ? 'Lane 1-2' : 'Lane 3-4',
      plate: v.plateRecognized ? v.licensePlate : 'N/A',
      plateConf: v.plateConfidence
    }));
    setDetections(currentDetections);

    // Calculate FPS
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastTimeRef.current >= 1000) {
      setStats(prev => ({ ...prev, fps: frameCountRef.current }));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (Math.random() < 0.03 && vehiclesRef.current.length < 12) {
      spawnVehicle(canvas);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  const drawArrow = (ctx, x, y, direction) => {
    ctx.beginPath();
    if (direction === 'down') {
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x - 15, y);
      ctx.lineTo(x + 15, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 15, y + 20);
      ctx.lineTo(x + 15, y + 20);
    }
    ctx.fill();
  };

  useEffect(() => {
    if (isRunning) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  const toggleSimulation = () => setIsRunning(!isRunning);
  const resetSimulation = () => {
    setIsRunning(false);
    initSimulation();
  };

  const exportDetections = () => {
    const data = JSON.stringify(recentDetections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_detections_log.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold">Smart Wrong-Way Vehicle Detection System</h1>
          </div>
          <p className="text-gray-300">Edge AI-Powered Real-Time Traffic Monitoring with License Plate Recognition</p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Vehicles</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalVehicles}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-red-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">Wrong-Way</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{stats.wrongWayVehicles}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-900">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Plates Read</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats.platesRecognized}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Accuracy</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.accuracy}%</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">FPS</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.fps}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Canvas */}
          <div className="col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Live Camera Feed - Highway Monitoring
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSimulation}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={700}
                height={500}
                className="w-full border-2 border-gray-600 rounded-lg"
              />
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Normal Traffic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Wrong-Way Vehicle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                    <span>License Plate</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  YOLOv8 + DeepSORT + OCR
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Detections */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Active Detections ({detections.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detections.length === 0 ? (
                  <p className="text-gray-400 text-sm">No vehicles detected</p>
                ) : (
                  detections.map((det, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        det.type === 'Wrong-Way' ? 'bg-red-900/30 border border-red-700' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{det.type}</span>
                        <span className="text-gray-400">{(det.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-gray-400">{det.lane}</div>
                      <div className="text-yellow-400 text-xs mt-1">
                        {det.plate !== 'N/A' ? `📋 ${det.plate}` : '📋 Plate Not Read'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alert Log */}
            <div className="bg-gray-800 rounded-lg p-4 border border-red-900">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Alert Log
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No alerts generated</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="p-2 bg-red-900/30 rounded text-sm border border-red-700">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-red-400">⚠ WRONG WAY</span>
                        <span className="text-gray-400">{alert.time}</span>
                      </div>
                      <div className="text-gray-300">{alert.lane}</div>
                      <div className="text-yellow-400 text-xs mt-1">🚗 Plate: {alert.plate}</div>
                      <div className="text-gray-400 text-xs mt-1">{alert.action}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Vehicle Detections Table */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400" />
              Recent Vehicle Detections
            </h2>
            <button
              onClick={exportDetections}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={recentDetections.length === 0}
            >
              <Download className="w-4 h-4" />
              Export Log
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Vehicle Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">License Plate</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No detections yet. Start the simulation to see vehicle data.
                    </td>
                  </tr>
                ) : (
                  recentDetections.map((detection, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-3 px-4">{detection.time}</td>
                      <td className="py-3 px-4">{detection.vehicleType}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-yellow-900/30 px-2 py-1 rounded text-yellow-400">
                          {detection.licensePlate}
                        </span>
                      </td>
                      <td className="py-3 px-4">{(detection.confidence * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            detection.status === 'Wrong Direction'
                              ? 'bg-red-600 text-white'
                              : 'bg-green-600 text-white'
                          }`}
                        >
                          {detection.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold mb-2">About This Demo</h3>
          <p className="text-sm text-gray-300">
            This interactive simulation demonstrates real-time wrong-way vehicle detection with automatic license plate recognition (ALPR/ANPR). 
            The system uses YOLOv8 for vehicle detection, DeepSORT for tracking, OCR for license plate reading, and lane direction analysis 
            to identify vehicles traveling against traffic flow. All detected vehicles are logged in the "Recent Vehicle Detections" table with 
            complete information including vehicle type, license plate, confidence scores, and traffic status. Click "Export Log" to download 
            the complete detection history as JSON.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WrongWayDetectionDemo;