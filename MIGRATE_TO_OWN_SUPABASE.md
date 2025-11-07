# 🚀 Migrate from Lovable Supabase to Your Own Project

Complete guide to set up your own Supabase project and migrate everything.

---

## **Step 1: Create Your Own Supabase Project**

1. Go to **https://app.supabase.com**
2. **Sign in** (or create a free account)
3. Click **"New Project"**
4. Fill in:
   - **Name**: "VigilantAI" (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for now
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

---

## **Step 2: Get Your New Credentials**

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: (keep this secret! Only for backend)

**Save these somewhere safe!**

---

## **Step 3: Run Database Migrations**

Your new project needs the same database structure:

### **Option A: Using Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in your new Supabase project
2. Click **"New Query"**
3. Open your migration file: `supabase/migrations/20251106162400_4323931a-2900-450b-b20a-fb38de3b9005.sql`
4. **Copy ALL the SQL code** from that file
5. **Paste** it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ You should see "Success. No rows returned"

### **Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Push migrations
supabase db push
```

---

## **Step 4: Deploy Edge Function**

1. Go to **Edge Functions** in your new Supabase project
2. Click **"Create a new function"**
3. Name it: `detect-ppe`
4. Open `supabase/functions/detect-ppe/index.ts`
5. **Copy ALL the code** from that file
6. **Paste** it into the function editor
7. Click **"Deploy"**
8. Copy the **"Invoke URL"** (you'll need this!)

---

## **Step 5: Update Configuration Files**

### **A. Create `.env` File**

Create a file named `.env` in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_ANON_KEY
```

**Replace with your actual values from Step 2!**

### **B. Update Python Script**

Open `python-worker/real_time_monitor.py` and update:

```python
# Supabase Configuration
SUPABASE_FN_URL = 'https://YOUR_NEW_PROJECT_REF.functions.supabase.co/detect-ppe'
SUPABASE_ANON_KEY = 'YOUR_NEW_ANON_KEY'
SUPABASE_URL = 'https://YOUR_NEW_PROJECT_REF.supabase.co'
```

**Replace with your actual values!**

### **C. Update Supabase Config (Optional)**

Open `supabase/config.toml` and update:

```toml
project_id = "YOUR_NEW_PROJECT_REF"

[functions.detect-ppe]
verify_jwt = false
```

---

## **Step 6: Add Test Data**

### **Add a Test Camera:**

1. Go to **Table Editor** → `cameras`
2. Click **"Insert row"**
3. Add:
   - `name`: "Camera 1"
   - `location`: "Zone A"
   - `status`: "active"
4. Click **"Save"**

### **Test Authentication:**

1. Run `npm run dev`
2. Go to your app
3. Try signing up with a new account
4. You should be able to log in!

---

## **Step 7: Test Everything**

### **Test 1: Frontend**
```bash
npm run dev
```
- Go to `http://localhost:5173`
- Sign up/Sign in
- Check if dashboard loads

### **Test 2: Python Script**
```bash
cd python-worker
python real_time_monitor.py
```
- When violation detected, check terminal for: `✅ Detection pushed to Supabase`
- Check dashboard - should update in real-time!

### **Test 3: Edge Function**
- Go to Supabase Dashboard → Edge Functions → `detect-ppe`
- Click **"Invoke"** to test manually (optional)

---

## **Step 8: Migrate Existing Data (Optional)**

If you have data in your Lovable Supabase that you want to keep:

### **Export from Old Project:**

1. Go to your **Lovable Supabase project** (if you can access it)
2. Go to **Table Editor**
3. For each table (`profiles`, `cameras`, `detections`):
   - Click **"..."** menu → **"Export"** → **"CSV"**
   - Download the CSV file

### **Import to New Project:**

1. Go to your **new Supabase project**
2. Go to **Table Editor** → Select table
3. Click **"Insert"** → **"Import data from CSV"**
4. Upload the CSV file
5. Repeat for each table

**Note:** If you can't access the old project, you'll start fresh (which is fine for a demo!)

---

## **Step 9: Update Supabase Project Reference**

If you want to update the config file:

1. Open `supabase/config.toml`
2. Replace `project_id = "fiwivuetflmfbgayrbmu"` with your new project reference

---

## **Quick Checklist**

- [ ] Created new Supabase project
- [ ] Copied new Project URL and anon key
- [ ] Ran database migrations (Step 3)
- [ ] Deployed Edge Function (Step 4)
- [ ] Created `.env` file with new credentials
- [ ] Updated Python script with new credentials
- [ ] Added test camera to database
- [ ] Tested frontend (sign up/login works)
- [ ] Tested Python script (detections push successfully)
- [ ] Everything works! 🎉

---

## **Troubleshooting**

### **"Table doesn't exist" error**
- Solution: Make sure you ran the migration (Step 3)

### **"401 Unauthorized" error**
- Solution: Check your anon key is correct in `.env` and Python script

### **"Edge Function not found"**
- Solution: Deploy the function (Step 4) or use direct database insert

### **Dashboard not connecting**
- Solution: Restart `npm run dev` after creating `.env` file

---

## **Benefits of Your Own Project**

✅ Full control over your database  
✅ Can see all data and logs  
✅ No dependency on Lovable  
✅ Can customize everything  
✅ Better for production/demo  

---

## **Need Help?**

If you get stuck at any step:
1. Check the error message
2. Verify your credentials are correct
3. Make sure migrations ran successfully
4. Check Supabase Dashboard → Logs for errors

Good luck with the migration! 🚀

