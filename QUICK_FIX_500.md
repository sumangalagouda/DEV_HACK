# 🚨 Quick Fix: 500 Error

## **Step 1: Check Supabase Logs (CRITICAL!)**

The logs will tell you **exactly** what's failing:

1. Go to **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Find the most recent error (when you tried to upload)
3. **Copy the FULL error message** - this is the key!

---

## **Step 2: Most Likely Fix - Set Service Role Key**

The 500 error is usually because RLS (Row Level Security) is blocking the insert.

**Fix:**
1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add this secret:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Get service_role key: **Settings** → **API** → **service_role key** (⚠️ Keep secret!)
4. **Redeploy** the function

**Why?** Service role key bypasses RLS, so inserts will work.

---

## **Step 3: Alternative - Disable RLS (For Testing)**

If you can't set the service_role key:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run:
   ```sql
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
   ```

---

## **Step 4: Create Storage Bucket**

If you see "Bucket not found":

1. Go to **Storage** → **Create bucket**
2. Name: `detection-images`
3. Make it **Public**
4. Create

---

## **Step 5: Redeploy Function**

1. Go to **Edge Functions** → `detect-ppe`
2. Copy updated code from `supabase/functions/detect-ppe/index.ts`
3. Paste and **Deploy**

---

## **Step 6: Test Again**

1. Upload an image in dashboard
2. Check logs if it still fails
3. Share the **exact error message** from logs

---

## **What the Updated Function Does:**

✅ Auto-detects Supabase URL from request  
✅ Gets API key from request headers  
✅ Better error messages  
✅ Detailed logging at each step  

**The logs will now show exactly where it fails!** 🔍

