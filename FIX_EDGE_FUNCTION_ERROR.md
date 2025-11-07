# 🔧 Fix: "Edge Function returned non-2xx status code"

## **Quick Fix Steps:**

### **Step 1: Check Supabase Logs**

1. Go to **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Look for recent errors when you tried to upload an image
3. **Copy the error message** you see there

---

### **Step 2: Most Common Issues & Fixes**

#### **Issue 1: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured"**

**Fix:**
1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
2. Add these **Secrets**:
   ```
   SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Get service_role key: **Settings** → **API** → **service_role key**
4. **Redeploy** the function after adding secrets

---

#### **Issue 2: "Storage bucket not found" or "Bucket does not exist"**

**Fix:**
1. Go to **Supabase Dashboard** → **Storage**
2. Click **"Create bucket"**
3. Name: `detection-images`
4. Make it **Public**
5. Click **"Create"**

---

#### **Issue 3: "new row violates row-level security policy"**

**Fix:**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:
   ```sql
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
   ```
3. Or create proper policies in **Authentication** → **Policies**

---

#### **Issue 4: "Foreign key violation" (camera_id)**

**Fix:**
The function now auto-creates cameras, but if it fails:
1. Go to **Table Editor** → `cameras`
2. Add a camera manually
3. Use that camera ID when uploading

---

### **Step 3: Redeploy the Function**

After fixing the issues:

1. Go to **Edge Functions** → `detect-ppe`
2. Make sure the code is updated (copy from `supabase/functions/detect-ppe/index.ts`)
3. Click **"Deploy"** or **"Redeploy"**

---

### **Step 4: Test Again**

1. Go to your dashboard
2. Upload an image
3. Select a camera
4. Click "Analyze for PPE"
5. Should work now!

---

## **Quick Checklist:**

- [ ] Edge Function is deployed
- [ ] `SUPABASE_URL` secret is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret is set
- [ ] `detection-images` storage bucket exists
- [ ] RLS policies allow inserts (or RLS is disabled)
- [ ] Function code is up to date
- [ ] Checked Supabase logs for specific error

---

## **Still Not Working?**

**Share the exact error from:**
1. **Supabase Dashboard** → **Logs** → **Edge Functions** (most important!)
2. Browser console (F12)
3. Toast notification error message

The logs will show the exact problem! 🔍

