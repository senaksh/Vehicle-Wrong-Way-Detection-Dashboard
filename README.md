# Smart Wrong-Way Vehicle Detection System (React Simulation)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.6.0-lightgrey?logo=vite)](https://vitejs.dev/)

---
## Deployed Model

https://claude.ai/public/artifacts/184ea378-6b73-4af5-a679-6fd01b9db34a

## Overview

This interactive React-based simulation demonstrates a **real-time wrong-way vehicle detection system** with automatic license plate recognition (ALPR/ANPR). It mimics a smart traffic monitoring system using:

- **YOLOv8** for vehicle detection (simulated)
- **DeepSORT** for tracking
- **OCR** for license plate recognition
- **Lane direction analysis** to identify wrong-way vehicles

The simulation features a live dashboard with:

- Vehicle statistics and FPS
- Active detections and alerts
- Recent vehicle detection logs with confidence and status
- Exportable JSON logs

---

## Features

1. **Live Vehicle Simulation**
   - Vehicles spawn randomly in lanes
   - Wrong-way vehicles detected with red/green color coding
   - Trajectory visualization for each vehicle

2. **Dashboard**
   - Total vehicles, wrong-way vehicles, plates read, accuracy, and FPS
   - Active detection panel with vehicle type, confidence, lane, and plate info
   - Alert log for wrong-way vehicles

3. **Recent Detections**
   - Tracks latest vehicles passing through lanes
   - Includes vehicle type, license plate, confidence, and traffic status
   - Export detection logs as JSON

4. **Interactive Controls**
   - Start/Pause simulation
   - Reset simulation
   - Export detection history

---

## Tech Stack

- **Frontend:** React, JavaScript, HTML5 Canvas  
- **Icons:** Lucide React  
- **Styling:** TailwindCSS  
- **Animation:** `requestAnimationFrame` for real-time rendering  

---

## Installation & Setup

### Prerequisites
- Node.js (LTS recommended)  
- npm (comes with Node.js)  
- VSCode or any code editor  

### Steps

1. Clone the repository:

```bash
git clone <your-repo-url>
cd wrong-way-demo
