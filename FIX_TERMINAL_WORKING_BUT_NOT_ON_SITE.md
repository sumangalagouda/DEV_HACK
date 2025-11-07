# 🔧 Fix: Terminal Shows Detections But Not on Website

## **The Problem:**
- ✅ Python worker detects violations in terminal
- ❌ Violations don't show up on website/dashboard

## **Most Likely Cause: RLS (Row Level Security) Blocking Inserts**

The Python worker is detecting violations but **failing to insert them into Supabase** due to RLS policies.

---

## **Step 1: Check Python Terminal Output**

When a violation is detected, look for these messages:

### **✅ SUCCESS - You should see:**
```
🚨 VIOLATION DETECTED (Frame X):
   Type: Missing Hard Hat (Confidence: 85.1%)
   Severity: high
   📤 Attempting to push to Supabase...
📤 Inserting directly to database...
   ✅ Detection inserted to database! ID: xxxxx
   ✅ Successfully pushed to Supabase!
```

### **❌ FAILURE - If you see this:**
```
❌ Database insert failed: 403
   Full response: {"message":"new row violates row-level security policy"}
```

**OR**

```
❌ Database insert failed: 401
   Full response: {"message":"permission denied"}
```

---

## **Step 2: Fix RLS (Row Level Security)**

### **Quick Fix - Disable RLS (For Testing):**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

```sql
ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
```

3. **Test again** - Run Python script and check if violations appear on website

---

## **Step 3: Verify Data is Being Inserted**

1. Go to **Supabase Dashboard** → **Table Editor** → `detections`
2. Check if new rows are appearing when violations are detected
3. If you see rows → Frontend issue (fixed in latest update)
4. If no rows → RLS is blocking (fix above)

---

## **Step 4: Check Frontend Console**

1. Open your website
2. Press **F12** (open browser console)
3. Look for:
   - `Fetched detections: X` - Shows how many detections were found
   - `New detection received:` - Shows real-time updates
   - Any error messages

---

## **Step 5: Test the Connection**

Run the Python script's connection test:

```bash
cd python-worker
python real_time_monitor.py
```

At startup, you should see:
```
🧪 Testing Supabase Connection...
✅ Can read from Supabase (cameras table accessible)
✅ Can insert to Supabase (detections table accessible)
```

If you see:
```
❌ Cannot insert to detections table: 403
```

**→ RLS is blocking! Disable it (Step 2)**

---

## **What I Fixed in Frontend:**

1. ✅ **Better violation filtering** - Excludes "All Clear" messages
2. ✅ **Auto-refresh** - Refetches every 5 seconds
3. ✅ **Better error logging** - Shows errors in console
4. ✅ **Real-time updates** - Listens for new detections via Supabase Realtime

---

## **Quick Checklist:**

- [ ] Python script shows `✅ Detection inserted to database!`
- [ ] Supabase Dashboard → Table Editor → `detections` shows new rows
- [ ] RLS is disabled OR service_role key is set
- [ ] Browser console shows `Fetched detections: X` (X > 0)
- [ ] Website dashboard shows violations

---

## **Still Not Working?**

**Share:**
1. What you see in Python terminal when violation is detected
2. Whether rows appear in Supabase Table Editor → `detections`
3. Any errors in browser console (F12)

The most common issue is **RLS blocking inserts** - disable it and test again! 🚀

