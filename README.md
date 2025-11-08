# 🏗️ Construction Site Risk & Safety Intelligence

An AI-powered system that ensures real-time construction site safety by detecting PPE compliance (helmets, vests) and hazardous situations from CCTV feeds.

---

## 🚨 Problem
Construction sites still face frequent accidents due to:
- Lack of real-time monitoring  
- Manual supervision and delayed reporting  
- PPE non-compliance going unnoticed  

Our solution automates safety monitoring using AI and IoT for proactive risk management.

---

## 💡 Solution
**Construction Site Risk & Safety Intelligence** uses real-time video analytics to:
- Detect PPE (helmets, vests) using AI (YOLO model)  
- Monitor unsafe behavior via CCTV streams  
- Send instant alerts to supervisors via a live dashboard  
- Log incidents in a database for safety audits  

---

## ⚙️ Tech Stack
**Frontend:** React + Tailwind CSS  
**Backend:** FastAPI (Python)  
**Database:** MySQL  
**AI Model:** YOLOv8 (Ultralytics)  
**Libraries:** OpenCV, Uvicorn, SQLAlchemy  
**Deployment:** Render / Localhost  

---

## 🧩 System Workflow
1. **Video Stream Capture:** CCTV/RTSP feeds captured using OpenCV.  
2. **AI Detection:** YOLO model identifies PPE and unsafe actions in real time.  
3. **Backend Processing:** FastAPI handles detection requests and WebSocket alerts.  
4. **Database Logging:** MySQL stores incidents and compliance stats.  
5. **Dashboard Display:** React frontend visualizes live camera view + alerts.

---

## 🧱 Folder Structure
dev-hack/
│
├── frontend/ # React + Vite + Tailwind dashboard
│ ├── package.json # npm scripts & deps
│ ├── vite.config.ts
│ ├── tailwind.config.ts
│ ├── tsconfig.json
│ ├── index.html
│ ├── public/
│ │ └── robots.txt
│ └── src/
│ ├── main.tsx
│ ├── App.tsx
│ ├── index.css
│ ├── components/ # UI + feature components
│ │ ├── CameraFeed.tsx # Upload + webcam capture UI (live capture)
│ │ ├── LiveDetectionStatus.tsx
│ │ ├── Dashboard.tsx
│ │ └── ui/ # design system primitives (buttons, cards...)
│ ├── hooks/
│ ├── integrations/
│ │ └── supabase/ # supabase client for frontend
│ └── lib/
│
├── python-worker/ # Local inference / real-time worker (YOLO)
│ ├── real_time_monitor.py # Main real-time monitoring script (YOLO loop -> Supabase)
│ ├── test_model.py
│ ├── check_errors.py
│ └── best.pt # YOLO model weights (binary)
│
├── supabase/ # Supabase project: functions, storage & DB migrations
│ ├── functions/
│ │ └── detect-ppe/
│ │ └── index.ts # Edge Function: receives image, runs analysis, inserts detections
│ ├── config.toml
│ └── migrations/ # SQL migrations to create cameras, detections, etc.
│
├── dataset/ # Training / test data and labels
│ ├── images/
│ │ ├── train/
│ │ ├── val/
│ │ └── test/
│ └── labels/
│
├── models/ # (optional) model artifacts / checkpoints
│ └── best.pt # (or link to python-worker/best.pt)
│
├── .gitignore
├── README.md # How to run frontend, python worker, and deploy functions
└── (dev tool config files)
├── .eslintrc / eslint.config.js
├── postcss.config.js
└── other tooling configs

##  Setup Instructions

### 🔧 Backend
cd backend/app
python -m venv venv
venv\Scripts\activate   # (Windows)
pip install -r requirements.txt
uvicorn main:app --reload

💻 Frontend
cd frontend
npm install
npm start

🗄️ Database

Create a MySQL database and update connection settings in config.py.

 Features

 Real-time PPE (helmet/vest) detection

 Instant alert system

 Incident logging dashboard

 AI-driven safety analytics

 Scalable backend with FastAPI

What We Learned

Integrating AI models into full-stack apps

Real-time computer vision with FastAPI & WebSockets

Building responsive UIs with React + Tailwind

Managing teamwork and Git-based version control in a 36-hour hackathon

🏁 Conclusion

This project transforms ordinary CCTV footage into an intelligent safety monitoring system — helping prevent accidents, improve compliance, and protect lives on construction sites.

Built with ❤️ by [CODE4CHANGE]

