# Real-Time CCTV Monitoring with YOLO

This folder contains Python scripts for real-time CCTV monitoring, YOLO-based PPE violation detection, and automated alerts.

## 📁 Files

- **`test_model.py`** - Test your YOLO model (.pt file) with webcam or images
- **`real_time_monitor.py`** - Main script for real-time CCTV monitoring with alarms and phone calls

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install opencv-python ultralytics requests twilio
```

### Step 2: Configure Settings

Edit `real_time_monitor.py` and update these values:

```python
# Camera
RTSP_URL = '0'  # Use '0' for webcam, or 'rtsp://user:pass@ip/stream' for CCTV
YOLO_MODEL_PATH = r'C:\Users\dsvai\Downloads\best.pt'  # Your model path

# Supabase
SUPABASE_FN_URL = 'https://YOUR_PROJECT.functions.supabase.co/detect-ppe'
CAMERA_ID = 'your-camera-id'
CAMERA_ZONE = 'Zone A'

# Twilio (for phone calls)
TWILIO_SID = "your_twilio_sid"
TWILIO_TOKEN = "your_twilio_token"
TWILIO_NUMBER = "your_twilio_phone_number"

# Supervisor phone numbers
CAMERA_TO_SUPERVISOR = {
    "Zone A": "+1234567890",
}
```

### Step 3: Test Your Model

```bash
python test_model.py
```

This will test your YOLO model with your webcam. Press 'q' to quit.

### Step 4: Run Real-Time Monitor

```bash
python real_time_monitor.py
```

This will:
- Connect to your camera
- Run YOLO detection on every frame
- Push violations to Supabase (appears on dashboard instantly)
- Play alarm sound for violations
- Call supervisor for high-severity violations

## 🔧 Configuration Details

### Camera Setup

- **Webcam**: Use `RTSP_URL = '0'`
- **IP Camera (RTSP)**: Use `rtsp://username:password@camera_ip:port/stream`
- **Test Video File**: Use `RTSP_URL = 'path/to/video.mp4'`

### Detection Settings

- `DETECTION_INTERVAL`: Seconds between detections (default: 1)
- `MIN_CONFIDENCE`: Minimum confidence for detections (default: 0.5)
- `VIOLATION_CLASSES`: List of classes your model detects

### Alarm & Phone Calls

- **Alarm**: Plays automatically on the device when violation detected
- **Phone Calls**: Only for high-severity violations, max 1 call per 5 minutes per zone

## 📊 How It Works

1. **Frame Capture**: Grabs frames from camera every N seconds
2. **YOLO Detection**: Runs your model on each frame
3. **Violation Analysis**: Checks for PPE violations (missing helmet, vest, etc.)
4. **Supabase Push**: Sends detection to your Edge Function
5. **Dashboard Update**: Your web dashboard shows violations in real-time
6. **Alerts**: Plays alarm + calls supervisor if high-severity

## 🎯 Integration with Frontend

The Python worker automatically pushes detections to Supabase. Your dashboard:
- Shows live detection status in the `LiveDetectionStatus` component
- Displays violations in real-time via Supabase Realtime subscriptions
- Plays voice alerts and shows toast notifications

## 🐛 Troubleshooting

### Model not loading
- Check the path to your `.pt` file
- Make sure you have `ultralytics` installed: `pip install ultralytics`

### Camera not connecting
- Check RTSP URL format
- Make sure camera is accessible on your network
- Try using webcam first (`RTSP_URL = '0'`)

### Supabase errors
- Verify your Edge Function URL is correct
- Check that your Supabase project is active
- Make sure the function is deployed

### Twilio calls not working
- Verify your Twilio credentials
- Make sure supervisor number is verified in Twilio
- Check you have Twilio credits/balance

## 📝 Notes

- The script runs continuously until you press Ctrl+C
- Detections are throttled to avoid spam (1 per second by default)
- Phone calls are throttled (max 1 per 5 minutes per zone)
- All detections are saved to Supabase for dashboard viewing

## 🎬 Demo Tips

For your demo:
1. Start your web dashboard: `npm run dev`
2. Start the Python worker: `python real_time_monitor.py`
3. Show violations in front of camera
4. Watch dashboard update in real-time
5. Hear alarm sound
6. Show phone call notification

Good luck! 🚀

