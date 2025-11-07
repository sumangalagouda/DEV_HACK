# 🔧 Fix: 500 Error from Edge Function

## **Step 1: Check Supabase Logs (Most Important!)**

1. Go to **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Find the most recent error (when you tried to upload)
3. **Copy the full error message** - this tells you exactly what's wrong!

---

## **Step 2: Common 500 Errors & Fixes**

### **Error: "Supabase configuration missing"**

**Fix:**
1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add these secrets:
   ```
   SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Get service_role key: **Settings** → **API** → **service_role key**
4. **Redeploy** the function

---

### **Error: "Bucket not found" or Storage errors**

**Fix:**
1. Go to **Storage** in Supabase Dashboard
2. Create bucket: `detection-images`
3. Make it **Public**
4. Set policies to allow uploads

---

### **Error: "new row violates row-level security policy"**

**Fix:**
1. Go to **SQL Editor**
2. Run:
   ```sql
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
   ```

---

### **Error: "relation does not exist" or "table not found"**

**Fix:**
1. Make sure you ran the database migrations
2. Go to **Table Editor** and check if `detections` and `cameras` tables exist
3. If not, run the migration from `supabase/migrations/`

---

### **Error: "Invalid image data" or Base64 errors**

**Fix:**
- This is usually a frontend issue
- Check browser console (F12) for errors
- Make sure the image is being converted to base64 correctly

---

## **Step 3: Quick Test Checklist**

After fixing, test:

- [ ] Edge Function is deployed
- [ ] Environment variables are set (or auto-detection works)
- [ ] Storage bucket `detection-images` exists and is public
- [ ] RLS is disabled or policies allow inserts
- [ ] `detections` and `cameras` tables exist
- [ ] Check Supabase logs for any remaining errors

---

## **Step 4: Get Detailed Error**

The updated function now returns detailed errors. When you upload an image:

1. Check the **toast notification** - it should show the exact error
2. Check **browser console** (F12) - shows full error details
3. Check **Supabase logs** - shows server-side errors

---

## **Still Getting 500?**

**Share these details:**
1. **Exact error message** from Supabase logs
2. **Error code** (if shown)
3. **What step fails** (storage upload, database insert, etc.)

The updated function now has much better error logging, so the logs will tell us exactly what's wrong! 🔍

