"""
Quick script to check for common errors in Python worker output.
Run this after running real_time_monitor.py to see what went wrong.
"""

import sys
import os

print("=" * 60)
print("🔍 Python Worker Error Checker")
print("=" * 60)
print()

# Check if real_time_monitor.py exists
if not os.path.exists('real_time_monitor.py'):
    print("❌ Error: real_time_monitor.py not found!")
    print("   Make sure you're in the python-worker directory")
    sys.exit(1)

print("✅ Found real_time_monitor.py")
print()

# Check configuration
print("📋 Checking Configuration...")
print()

try:
    # Read the file and check for common issues
    with open('real_time_monitor.py', 'r') as f:
        content = f.read()
    
    issues = []
    
    # Check for placeholder values
    if 'YOUR_PROJECT_REF' in content:
        issues.append("❌ SUPABASE_URL contains 'YOUR_PROJECT_REF' - not configured!")
    
    if 'YOUR_SUPABASE_ANON_KEY' in content:
        issues.append("❌ SUPABASE_ANON_KEY contains 'YOUR_SUPABASE_ANON_KEY' - not configured!")
    
    if 'YOUR_TWILIO' in content:
        issues.append("⚠️  Twilio not configured (optional, but needed for phone calls)")
    
    # Check for model path
    if 'MODEL_PATH' in content or 'YOLO_MODEL_PATH' in content:
        import re
        model_path_match = re.search(r"YOLO_MODEL_PATH\s*=\s*['\"]([^'\"]+)['\"]", content)
        if model_path_match:
            model_path = model_path_match.group(1)
            if not os.path.exists(model_path):
                issues.append(f"❌ YOLO model not found: {model_path}")
            else:
                print(f"✅ YOLO model found: {model_path}")
    
    if issues:
        print("⚠️  Configuration Issues Found:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("✅ Configuration looks good!")
    
    print()
    print("=" * 60)
    print("📝 What to Check in Terminal Output:")
    print("=" * 60)
    print()
    print("When you run: python real_time_monitor.py")
    print()
    print("✅ GOOD SIGNS:")
    print("   - '✅ Model loaded! Classes: ...'")
    print("   - '✅ Can read from Supabase'")
    print("   - '✅ Can insert to Supabase'")
    print("   - '✅ Detection inserted to database! ID: ...'")
    print()
    print("❌ ERROR SIGNS:")
    print("   - '❌ Database insert failed: 403' → RLS blocking!")
    print("   - '❌ Database insert failed: 401' → Authentication error!")
    print("   - '❌ Cannot insert to detections table' → RLS or permissions!")
    print("   - '⚠️ Could not create camera' → Camera creation failed!")
    print()
    print("💡 QUICK FIXES:")
    print("   1. If you see '403' or 'row-level security':")
    print("      → Disable RLS in Supabase SQL Editor:")
    print("        ALTER TABLE detections DISABLE ROW LEVEL SECURITY;")
    print()
    print("   2. If you see '401' or 'permission denied':")
    print("      → Check SUPABASE_ANON_KEY is correct")
    print()
    print("   3. If detections show in terminal but not on website:")
    print("      → Check Supabase Table Editor → detections table")
    print("      → If rows exist → Frontend issue (check browser console)")
    print("      → If no rows → Python insert is failing (check errors above)")
    print()
    
except Exception as e:
    print(f"❌ Error checking file: {e}")

