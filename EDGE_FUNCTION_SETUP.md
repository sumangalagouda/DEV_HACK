# 🚀 Edge Function Setup - Quick Guide

## **Option 1: Auto-Detection (Easiest - No Setup Required!)**

The updated function now **auto-detects** your Supabase URL and API key from the request. 

**Just deploy and it should work!**

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Open `detect-ppe` function
3. Copy code from `supabase/functions/detect-ppe/index.ts`
4. Paste and click **"Deploy"**
5. **Done!** ✅

---

## **Option 2: Set Environment Variables (Recommended for Production)**

For better reliability, set these secrets:

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add these two secrets:

```
SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get service_role key:**
- Go to **Settings** → **API**
- Copy **service_role key** (⚠️ Keep this secret!)

3. **Redeploy** the function

---

## **Create Storage Bucket (Required)**

1. Go to **Storage** in Supabase Dashboard
2. Click **"Create bucket"**
3. Name: `detection-images`
4. Make it **Public**
5. Click **"Create"**

---

## **Disable RLS (For Testing)**

If you get "row-level security" errors:

1. Go to **SQL Editor**
2. Run:
   ```sql
   ALTER TABLE detections DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cameras DISABLE ROW LEVEL SECURITY;
   ```

---

## **Test It**

1. Go to your dashboard
2. Upload an image
3. Select a camera
4. Click "Analyze for PPE"
5. Should work! ✅

---

## **Check Logs if It Fails**

1. Go to **Supabase Dashboard** → **Logs** → **Edge Functions**
2. Look for errors
3. Share the error message if you need help!

---

**The function now works even without environment variables!** 🎉

