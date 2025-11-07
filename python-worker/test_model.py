"""
Simple test script to verify your YOLO model (.pt file) works correctly.
Run this to test your downloaded model before using it in the real-time system.
"""

from ultralytics import YOLO
import cv2
import sys
import os

# ===== CONFIGURATION =====
MODEL_PATH = r'C:\Users\dsvai\Downloads\best.pt'  # Change this to your downloaded .pt file path
TEST_IMAGE_PATH = None  # Optional: path to a test image file
USE_WEBCAM = True  # Set to True to test with your webcam, False to use an image file

# ===== TEST SCRIPT =====

def test_model_with_image(model, image_path):
    """Test the model with a single image file."""
    print(f"Testing model with image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return
    
    # Run inference
    results = model(image_path)
    
    # Display results
    print("\n=== Detection Results ===")
    for result in results:
        if result.boxes is not None and len(result.boxes) > 0:
            print(f"Found {len(result.boxes)} detections:")
            for i, box in enumerate(result.boxes):
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = model.names[cls]
                print(f"  {i+1}. {class_name}: {conf:.2%} confidence")
        else:
            print("No detections found in this image.")
    
    # Show image with bounding boxes
    annotated_frame = results[0].plot()
    cv2.imshow("YOLO Detection Results", annotated_frame)
    print("\nPress any key to close the image window...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def test_model_with_webcam(model):
    """Test the model with your webcam (real-time)."""
    print("Testing model with webcam...")
    print("Press 'q' to quit")
    
    cap = cv2.VideoCapture(0)  # 0 = default webcam
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
        
        # Run inference
        results = model(frame)
        
        # Draw results on frame
        annotated_frame = results[0].plot()
        
        # Display frame
        cv2.imshow("YOLO Real-Time Detection (Press 'q' to quit)", annotated_frame)
        
        # Print detections to console
        if results[0].boxes is not None and len(results[0].boxes) > 0:
            print(f"\nDetections: {len(results[0].boxes)} objects found")
            for box in results[0].boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = model.names[cls]
                print(f"  - {class_name}: {conf:.2%}")
        
        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

def main():
    """Main test function."""
    print("=" * 50)
    print("YOLO Model Tester")
    print("=" * 50)
    
    # Check if model file exists
    if not os.path.exists(MODEL_PATH):
        print(f"\n❌ Error: Model file not found: {MODEL_PATH}")
        print("\nPlease update MODEL_PATH in this script to point to your .pt file")
        print("Example: MODEL_PATH = 'yolov8n.pt' or MODEL_PATH = 'C:/path/to/model.pt'")
        return
    
    print(f"\n✅ Loading model: {MODEL_PATH}")
    
    try:
        # Load the model
        model = YOLO(MODEL_PATH)
        print("✅ Model loaded successfully!")
        print(f"✅ Model classes: {len(model.names)} classes detected")
        print(f"   Classes: {list(model.names.values())[:10]}...")  # Show first 10 classes
        
        # Test based on configuration
        if USE_WEBCAM:
            test_model_with_webcam(model)
        elif TEST_IMAGE_PATH:
            test_model_with_image(model, TEST_IMAGE_PATH)
        else:
            print("\n⚠️  No test method selected!")
            print("Set USE_WEBCAM = True to test with webcam")
            print("OR set TEST_IMAGE_PATH to a test image file path")
            print("\nQuick test: Showing model info only...")
            print(f"Model is ready! You can now use it in your real-time system.")
    
    except Exception as e:
        print(f"\n❌ Error loading or testing model: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you installed: pip install ultralytics opencv-python")
        print("2. Check that the .pt file path is correct")
        print("3. Verify the model file is not corrupted")

if __name__ == "__main__":
    main()

