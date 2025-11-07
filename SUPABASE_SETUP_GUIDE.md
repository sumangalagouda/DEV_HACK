# 🚀 Complete Supabase Setup Guide

Follow these steps to set up your Supabase project and connect it to your application.

---

## **Step 1: Create/Login to Supabase**

1. Go to **https://app.supabase.com**
2. **Sign in** (or create a free account)
3. Click **"New Project"** (or select existing project)

---

## **Step 2: Get Your Supabase Credentials**

Once your project is created:

1. Go to **Settings** (gear icon in left sidebar)
2. Click **"API"**
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co` ← Copy this!
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ← Copy this!

**Save these somewhere safe!** You'll need them.

---

## **Step 3: Run Database Migrations**

Your project already has migrations in `supabase/migrations/`. You need to run them:

### **Option A: Using Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Open your migration file: `supabase/migrations/20251106162400_4323931a-2900-450b-b20a-fb38de3b9005.sql`
4. Copy **ALL** the SQL code from that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ You should see "Success. No rows returned"

### **Option B: Using Supabase CLI (Advanced)**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

---

## **Step 4: Deploy Edge Function (Optional but Recommended)**

### **Option A: Using Supabase Dashboard**

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **"Create a new function"**
3. Name it: `detect-ppe`
4. Copy the code from `supabase/functions/detect-ppe/index.ts`
5. Paste it into the function editor
6. Click **"Deploy"**
7. Copy the **"Invoke URL"** (you'll need this!)

### **Option B: Using Supabase CLI**

```bash
# Make sure you're in your project root
cd "C:\Users\dsvai\OneDrive\Desktop\DevHack\watchful-build-1"

# Deploy the function
supabase functions deploy detect-ppe
```

---

## **Step 5: Update Your Frontend (.env file)**

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add these lines:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE
```

Replace:
- `YOUR_PROJECT_REF` with your actual project reference
- `YOUR_ANON_KEY_HERE` with your anon public key

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDcwOTQ1Nn0.xxxxx
```

3. **Restart your dev server** after creating/updating `.env`:
   ```bash
   npm run dev
   ```

---

## **Step 6: Update Python Script**

Open `python-worker/real_time_monitor.py` and update these lines:

```python
# Supabase Configuration
SUPABASE_FN_URL = 'https://YOUR_PROJECT_REF.functions.supabase.co/detect-ppe'
SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'
SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
```

Replace with your actual values from Step 2.

**Example:**
```python
SUPABASE_FN_URL = 'https://abcdefghijk.functions.supabase.co/detect-ppe'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
SUPABASE_URL = 'https://abcdefghijk.supabase.co'
```

---

## **Step 7: Test Everything**

### **Test 1: Database Connection**

1. Go to Supabase Dashboard > **Table Editor**
2. You should see tables: `profiles`, `cameras`, `detections`
3. If not, re-run the migration from Step 3

### **Test 2: Add a Test Camera**

1. Go to **Table Editor** > `cameras`
2. Click **"Insert row"**
3. Add:
   - `name`: "Test Camera 1"
   - `location`: "Zone A"
   - `status`: "active"
4. Click **"Save"**

### **Test 3: Run Your Python Script**

```bash
cd python-worker
python real_time_monitor.py
```

When a violation is detected, check:
- ✅ Terminal shows: "✅ Detection pushed to Supabase"
- ✅ Dashboard shows new violation in real-time

### **Test 4: Check Dashboard**

1. Run `npm run dev`
2. Go to `http://localhost:5173`
3. Sign in/Sign up
4. Go to Dashboard
5. You should see the live detection status component

---

## **Troubleshooting**

### **"Table doesn't exist" error**
- Solution: Run the migration from Step 3

### **"401 Unauthorized" error**
- Solution: Check your anon key is correct (no extra spaces)

### **"Edge Function not found" error**
- Solution: Deploy the function from Step 4, or use direct database insert (script has fallback)

### **Dashboard not connecting**
- Solution: Check `.env` file exists and has correct values, then restart `npm run dev`

### **Python script can't connect**
- Solution: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `real_time_monitor.py`

---

## **Quick Checklist**

- [ ] Created Supabase project
- [ ] Copied Project URL and anon key
- [ ] Ran database migrations
- [ ] Deployed Edge Function (or using direct insert)
- [ ] Created `.env` file with credentials
- [ ] Updated Python script with credentials
- [ ] Added test camera to database
- [ ] Tested Python script
- [ ] Tested dashboard

---

## **Need More Help?**

If you get stuck:
1. Check the error message
2. Look at Supabase Dashboard > Logs
3. Check browser console (F12) for frontend errors
4. Check Python terminal output for backend errors

Good luck! 🚀

