"""
Real-Time CCTV Monitor with YOLO Detection
This script connects to a CCTV camera, runs YOLO detection, and pushes violations to Supabase.
It also triggers local alarms and phone calls for serious violations.
"""

import cv2
import base64
import time
import os
import platform
import requests
from ultralytics import YOLO

# Optional: Twilio for phone calls (install with: pip install twilio)
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("⚠️  Twilio not installed - phone call alerts will be disabled")
    print("   Install with: pip install twilio")

# ===== CONFIGURATION =====
# Camera Configuration
RTSP_URL = '0'  # Use '0' for webcam, or 'rtsp://user:pass@ip:port/stream' for CCTV
YOLO_MODEL_PATH = r'C:\Users\dsvai\Downloads\best.pt'  # Your YOLO model path

# Supabase Configuration
SUPABASE_FN_URL = 'https://iscxriwdxxvzhcoguvyk.supabase.co/functions/v1/detect-ppe'  # UPDATE THIS!
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3hyaXdkeHh2emhjb2d1dnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTUyOTksImV4cCI6MjA3ODAzMTI5OX0.l7H9OBbwhyWnuaVbd54ErZy7TnJJKNNBQjiKWTmbw18'  # Get this from Supabase Dashboard > Settings > API
SUPABASE_URL = 'https://iscxriwdxxvzhcoguvyk.supabase.co'  # Your Supabase project URL
CAMERA_ID = 'default-camera-1'  # Update with your actual camera ID from database
CAMERA_ZONE = 'Zone A'  # Update with your zone

# Supervisor phone numbers by zone
CAMERA_TO_SUPERVISOR = {
    "Zone A": "+1234567890",  # UPDATE with real supervisor phone
    "Zone B": "+1987654321",
}

# Twilio Configuration (for phone calls)
TWILIO_SID = "YOUR_TWILIO_ACCOUNT_SID"  # UPDATE THIS!
TWILIO_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"  # UPDATE THIS!
TWILIO_NUMBER = "YOUR_TWILIO_PHONE_NUMBER"  # UPDATE THIS!

# Detection Settings
DETECTION_INTERVAL = 1  # Analyze 1 frame per second (adjust as needed)
MIN_CONFIDENCE = 0.5  # Minimum confidence threshold for detections
VIOLATION_CLASSES = ['NO-Mask', 'NO-Hardhat', 'NO-Safety Vest', 'Person', 'Safety Vest']  # Your model classes

# ===== FUNCTIONS =====

def sound_alarm():
    """Play a loud alarm sound on the local device."""
    print("🔔 ALARM: Violation detected!")
    try:
        for _ in range(3):
            if platform.system() == "Windows":
                import winsound
                winsound.Beep(1600, 1000)  # Frequency, duration in ms
            elif platform.system() == "Darwin":  # macOS
                os.system('say "Warning! Safety violation detected!"')
            else:  # Linux
                os.system('play -nq -t alsa synth 1 sine 1600 2>/dev/null || echo "Alarm!"')
    except Exception as e:
        print(f"Could not play alarm: {e}")

def make_voice_call(message: str, supervisor_number: str):
    """Make a voice call to supervisor using Twilio."""
    if not TWILIO_AVAILABLE:
        print(f"⚠️  Twilio not available - skipping phone call to {supervisor_number}")
        print(f"   Message would be: {message}")
        return
    
    try:
        print(f"📞 Calling supervisor {supervisor_number}...")
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        call = client.calls.create(
            twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
            to=supervisor_number,
            from_=TWILIO_NUMBER
        )
        print(f"✅ Call initiated: {call.sid}")
    except Exception as e:
        print(f"❌ Failed to make call: {e}")

def frame_to_base64(frame):
    """Convert OpenCV frame to base64 data URL."""
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

def upload_image_to_storage(img_b64, violation_type):
    """Upload image to Supabase storage and return public URL."""
    try:
        # Extract base64 data (remove data:image/jpeg;base64, prefix)
        if ',' in img_b64:
            img_data = img_b64.split(',')[1]
        else:
            img_data = img_b64
        
        import base64
        image_bytes = base64.b64decode(img_data)
        
        # Generate unique filename
        import uuid
        filename = f"detections/{uuid.uuid4()}.jpg"
        
        # Upload to storage
        storage_url = f"{SUPABASE_URL}/storage/v1/object/detection-images/{filename}"
        headers = {
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
        }
        
        response = requests.post(storage_url, data=image_bytes, headers=headers, timeout=15)
        
        if response.status_code in [200, 201]:
            # Get public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/detection-images/{filename}"
            return public_url
        else:
            print(f"⚠️ Image upload failed: {response.status_code} - {response.text[:100]}")
            return None
    except Exception as e:
        print(f"⚠️ Error uploading image: {e}")
        return None

def ensure_camera_exists(camera_id, camera_zone):
    """Ensure camera exists in database, create if not. Returns actual camera UUID."""
    try:
        import uuid
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Check if camera exists by name or location
        check_url = f"{SUPABASE_URL}/rest/v1/cameras?name=eq.Camera {camera_zone}&location=eq.{camera_zone}"
        response = requests.get(check_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            cameras = response.json()
            if len(cameras) > 0:
                actual_camera_id = cameras[0]['id']
                return actual_camera_id  # Return existing camera ID
        
        # Create camera if it doesn't exist (let DB generate UUID)
        camera_data = {
            'name': f'Camera {camera_zone}',
            'location': camera_zone,
            'status': 'active',
            'zone': camera_zone
        }
        
        create_url = f"{SUPABASE_URL}/rest/v1/cameras"
        response = requests.post(create_url, json=camera_data, headers=headers, timeout=10)
        
        if response.status_code in [200, 201]:
            created_camera = response.json()
            if isinstance(created_camera, list) and len(created_camera) > 0:
                actual_camera_id = created_camera[0]['id']
                print(f"✅ Created camera: {actual_camera_id} for {camera_zone}")
                return actual_camera_id
            else:
                print(f"⚠️ Camera created but couldn't get ID")
                return None
        else:
            print(f"⚠️ Could not create camera: {response.status_code} - {response.text[:100]}")
            return None
    except Exception as e:
        print(f"⚠️ Error checking/creating camera: {e}")
        return None

def push_detection_to_supabase(img_b64, camera_id, violation_type, severity='medium', confidence=0.75):
    """Push detection result to Supabase Edge Function or directly to database."""
    try:
        # Ensure camera exists first and get actual camera UUID
        actual_camera_id = ensure_camera_exists(camera_id, CAMERA_ZONE)
        if not actual_camera_id:
            print(f"⚠️ Could not get/create camera, using provided ID: {camera_id}")
            actual_camera_id = camera_id
        
        # Method 1: Try Edge Function first
        if SUPABASE_FN_URL and 'YOUR_PROJECT_REF' not in SUPABASE_FN_URL:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
            }
            
            data = {
                'imageBase64': img_b64,
                'cameraId': actual_camera_id,
            }
            
            print(f"📤 Pushing to Supabase Edge Function...")
            response = requests.post(SUPABASE_FN_URL, json=data, headers=headers, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Detection pushed via Edge Function: {violation_type}")
                return True
            else:
                print(f"⚠️ Edge Function failed ({response.status_code}), trying direct insert...")
                print(f"   Error: {response.text[:150]}")
        
        # Method 2: Direct database insert (more reliable)
        if SUPABASE_URL and SUPABASE_ANON_KEY and 'YOUR_PROJECT_REF' not in SUPABASE_URL:
            print(f"📤 Inserting directly to database...")
            
            # Upload image to storage
            image_url = upload_image_to_storage(img_b64, violation_type)
            if not image_url:
                # Fallback: use a placeholder
                image_url = "https://via.placeholder.com/640x480?text=Detection+Image"
            
            # Prepare detection data
            detection_data = {
                'camera_id': actual_camera_id,
                'violation_type': violation_type,
                'confidence': int(confidence * 100) if isinstance(confidence, float) else 75,
                'severity': severity,
                'status': 'new',
                'image_url': image_url
            }
            
            headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            db_url = f"{SUPABASE_URL}/rest/v1/detections"
            print(f"   URL: {db_url}")
            print(f"   Data: {violation_type} (severity: {severity})")
            
            response = requests.post(db_url, json=detection_data, headers=headers, timeout=15)
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ Detection inserted to database! ID: {result[0].get('id', 'unknown') if isinstance(result, list) and len(result) > 0 else 'success'}")
                return True
            else:
                print(f"❌ Database insert failed: {response.status_code}")
                print(f"   Full response: {response.text}")
                return False
        else:
            print("❌ Supabase configuration not set properly!")
            print(f"   SUPABASE_URL: {'✅' if SUPABASE_URL and 'YOUR_PROJECT_REF' not in SUPABASE_URL else '❌'}")
            print(f"   SUPABASE_ANON_KEY: {'✅' if SUPABASE_ANON_KEY and 'YOUR_SUPABASE_ANON_KEY' not in SUPABASE_ANON_KEY else '❌'}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error pushing to Supabase: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_supabase_connection():
    """Test if we can connect to Supabase and insert data."""
    print("\n🧪 Testing Supabase Connection...")
    
    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Test 1: Check if we can read cameras table
        test_url = f"{SUPABASE_URL}/rest/v1/cameras?limit=1"
        response = requests.get(test_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Can read from Supabase (cameras table accessible)")
        else:
            print(f"⚠️ Cannot read cameras table: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
        
        # Test 2: Try to insert a test detection (will be rolled back)
        test_detection = {
            'violation_type': 'TEST - Connection Check',
            'confidence': 100,
            'severity': 'low',
            'status': 'new',
            'image_url': 'https://via.placeholder.com/640x480?text=Test'
        }
        
        # First ensure camera exists
        camera_id = ensure_camera_exists(CAMERA_ID, CAMERA_ZONE)
        if camera_id:
            test_detection['camera_id'] = camera_id
            
            test_insert_url = f"{SUPABASE_URL}/rest/v1/detections"
            response = requests.post(test_insert_url, json=test_detection, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                print("✅ Can insert to Supabase (detections table accessible)")
                # Try to delete the test record (optional cleanup)
                try:
                    response_text = response.text.strip()
                    if response_text:
                        response_data = response.json()
                        if isinstance(response_data, list) and len(response_data) > 0:
                            test_id = response_data[0].get('id')
                            if test_id:
                                delete_url = f"{SUPABASE_URL}/rest/v1/detections?id=eq.{test_id}"
                                delete_response = requests.delete(delete_url, headers=headers, timeout=10)
                                if delete_response.status_code in [200, 204]:
                                    print("✅ Test record cleaned up")
                except (ValueError, KeyError, requests.exceptions.JSONDecodeError) as e:
                    # Response might not be JSON or might be empty - that's okay
                    print("ℹ️  Could not clean up test record (this is fine)")
                return True
            else:
                print(f"❌ Cannot insert to detections table: {response.status_code}")
                print(f"   Response: {response.text}")
                print(f"\n💡 This is likely an RLS (Row Level Security) issue!")
                print(f"   Go to Supabase Dashboard → Authentication → Policies")
                print(f"   Make sure 'detections' table has INSERT policy for authenticated users")
                return False
        else:
            print("⚠️ Could not create/get camera for test")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def analyze_detection(results, model):
    """Analyze YOLO results and determine violations based on your model classes."""
    violations = []
    has_violation = False
    
    if results[0].boxes is not None and len(results[0].boxes) > 0:
        detected_classes = {}  # Store class name and max confidence
        person_detected = False
        
        for box in results[0].boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            if conf >= MIN_CONFIDENCE:
                class_name = model.names[cls]  # Keep original case: NO-Mask, NO-Hardhat, etc.
                
                # Track highest confidence for each class
                if class_name not in detected_classes or conf > detected_classes[class_name]:
                    detected_classes[class_name] = conf
                
                if class_name == 'Person':
                    person_detected = True
        
        # Debug: Print detected classes (only when violations found)
        if detected_classes:
            detected_str = ', '.join([f"{k}: {v:.1%}" for k, v in detected_classes.items()])
        
        # Check for violations based on your model's class names
        if 'NO-Hardhat' in detected_classes:
            violations.append(f'Missing Hard Hat (Confidence: {detected_classes["NO-Hardhat"]:.1%})')
            has_violation = True
        
        if 'NO-Safety Vest' in detected_classes:
            violations.append(f'Missing Safety Vest (Confidence: {detected_classes["NO-Safety Vest"]:.1%})')
            has_violation = True
        
        if 'NO-Mask' in detected_classes:
            violations.append(f'Missing Mask (Confidence: {detected_classes["NO-Mask"]:.1%})')
            has_violation = True
        
        # If person detected but no violations, log as monitoring
        if person_detected and not has_violation:
            violations.append('Person Detected - All PPE Requirements Met')
    
    return violations, has_violation

# ===== MAIN LOOP =====

def main():
    print("=" * 60)
    print("🚀 Real-Time CCTV Safety Monitor Starting...")
    print("=" * 60)
    
    # Configuration check
    print("\n📋 Configuration Check:")
    config_ok = True
    
    if 'YOUR_PROJECT_REF' in SUPABASE_FN_URL and 'YOUR_PROJECT_REF' in SUPABASE_URL:
        print("⚠️  Supabase URL not configured!")
        print("   Please update SUPABASE_FN_URL or SUPABASE_URL in the script")
        config_ok = False
    else:
        if 'YOUR_PROJECT_REF' not in SUPABASE_FN_URL:
            print(f"✅ Supabase Edge Function URL: {SUPABASE_FN_URL[:50]}...")
        if 'YOUR_PROJECT_REF' not in SUPABASE_URL:
            print(f"✅ Supabase URL: {SUPABASE_URL[:50]}...")
    
    if 'YOUR_SUPABASE_ANON_KEY' in SUPABASE_ANON_KEY:
        print("⚠️  Supabase Anon Key not configured!")
        print("   Get it from: Supabase Dashboard > Settings > API > anon/public key")
        config_ok = False
    else:
        print(f"✅ Supabase Anon Key: Configured")
    
    if not config_ok:
        print("\n❌ Please fix configuration issues before continuing!")
        print("   The script will still run but won't push to Supabase.")
        input("Press Enter to continue anyway, or Ctrl+C to exit...")
    
    # Load YOLO model
    if not os.path.exists(YOLO_MODEL_PATH):
        print(f"\n❌ Error: Model file not found: {YOLO_MODEL_PATH}")
        return
    
    print(f"\n📦 Loading YOLO model: {YOLO_MODEL_PATH}")
    try:
        model = YOLO(YOLO_MODEL_PATH)
        print(f"✅ Model loaded! Classes: {list(model.names.values())}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return
    
    # Test Supabase connection
    if config_ok:
        connection_ok = test_supabase_connection()
        if not connection_ok:
            print("\n⚠️ Supabase connection test failed!")
            print("   The script will continue, but detections may not be saved.")
            print("   Fix the issues above before running detection.")
            response = input("\nContinue anyway? (y/n): ")
            if response.lower() != 'y':
                return
    
    # Connect to camera
    print(f"📹 Connecting to camera: {RTSP_URL}")
    cap = cv2.VideoCapture(RTSP_URL if RTSP_URL != '0' else 0)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open camera {RTSP_URL}")
        return
    
    print("✅ Camera connected!")
    print(f"🔍 Starting detection (analyzing every {DETECTION_INTERVAL} second)...")
    print("Press Ctrl+C to stop\n")
    
    frame_count = 0
    last_call_time = {}  # Track last call time per zone to avoid spam
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠️ Failed to grab frame, retrying...")
                time.sleep(1)
                continue
            
            frame_count += 1
            
            # Run YOLO detection
            results = model(frame, verbose=False)
            
            # Analyze results
            violations, has_violation = analyze_detection(results, model)
            
            # Debug: Print detection status every 30 frames
            if frame_count % 30 == 0:
                detected_classes_list = []
                if results[0].boxes is not None and len(results[0].boxes) > 0:
                    for box in results[0].boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        if conf >= MIN_CONFIDENCE:
                            detected_classes_list.append(f"{model.names[cls]}: {conf:.1%}")
                print(f"📊 Frame {frame_count} - Detections: {detected_classes_list if detected_classes_list else 'None'}")
            
            # Only process if we have detections
            if len(violations) > 0:
                violation_text = ', '.join(violations)
                
                # Only push to Supabase and trigger alerts for actual violations
                if has_violation:
                    # Convert frame to base64
                    img_b64 = frame_to_base64(frame)
                    severity = 'high'
                    
                    print(f"\n🚨 VIOLATION DETECTED (Frame {frame_count}):")
                    print(f"   Type: {violation_text}")
                    print(f"   Severity: {severity}")
                    print(f"   📤 Attempting to push to Supabase...")
                    
                    # Push to Supabase
                    success = push_detection_to_supabase(img_b64, CAMERA_ID, violation_text, severity)
                    
                    if success:
                        print(f"   ✅ Successfully pushed to Supabase!")
                    else:
                        print(f"   ❌ Failed to push to Supabase - check errors above")
                    
                    # Trigger alarm and call for high-severity violations
                    sound_alarm()
                    
                    # Make phone call (throttle to avoid spam - max 1 call per 5 minutes per zone)
                    supervisor_number = CAMERA_TO_SUPERVISOR.get(CAMERA_ZONE)
                    if supervisor_number:
                        current_time = time.time()
                        last_call = last_call_time.get(CAMERA_ZONE, 0)
                        
                        if current_time - last_call > 300:  # 5 minutes
                            message = f"Urgent safety violation detected in {CAMERA_ZONE}. {violation_text}. Please respond immediately."
                            make_voice_call(message, supervisor_number)
                            last_call_time[CAMERA_ZONE] = current_time
                        else:
                            print("⏸️ Phone call throttled (recent call made)")
                else:
                    # Just log monitoring status (no violation)
                    print(f"✅ Monitoring (Frame {frame_count}): {violation_text}")
            
            # Optional: Display frame with detections (for debugging)
            # annotated_frame = results[0].plot()
            # cv2.imshow("Live Detection", annotated_frame)
            # if cv2.waitKey(1) & 0xFF == ord('q'):
            #     break
            
            # Wait before next detection
            time.sleep(DETECTION_INTERVAL)
    
    except KeyboardInterrupt:
        print("\n\n⏹️ Stopping monitor...")
    except Exception as e:
        print(f"\n❌ Error in main loop: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("✅ Monitor stopped. Goodbye!")

if __name__ == "__main__":
    main()

