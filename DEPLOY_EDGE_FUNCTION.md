# 🚀 Deploy Edge Function to Your Supabase

## **Step 1: Set Environment Variables**

Your Edge Function needs these environment variables:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
2. Add these **Secrets**:

```
SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get service_role key:**
- Go to **Settings** → **API**
- Copy **service_role key** (⚠️ Keep this secret! Don't share it)

**Note:** `LOVABLE_API_KEY` is now optional - only add it if you want to use Lovable AI for manual uploads.

---

## **Step 2: Deploy the Function**

### **Option A: Using Supabase Dashboard**

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **"Create a new function"** (or edit existing `detect-ppe`)
3. Name: `detect-ppe`
4. Copy ALL code from `supabase/functions/detect-ppe/index.ts`
5. Paste into the editor
6. Click **"Deploy"**

### **Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref iscxriwdxxvzhcoguvyk

# Set secrets
supabase secrets set SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deploy
supabase functions deploy detect-ppe
```

---

## **Step 3: Test the Function**

1. After deploying, click on the function in Dashboard
2. Click **"Invoke"** tab
3. Test with this JSON:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "cameraId": "your-camera-id"
}
```

Or test from your frontend by uploading an image.

---

## **Step 4: Verify It Works**

1. Go to your dashboard
2. Upload an image
3. Click "Analyze for PPE"
4. Should see success message
5. Check Supabase Dashboard → Table Editor → `detections` - should see new row!

---

## **Troubleshooting**

### **Error: "SUPABASE_URL not configured"**
- Solution: Add `SUPABASE_URL` as a secret in Edge Function settings

### **Error: "SUPABASE_SERVICE_ROLE_KEY not configured"**
- Solution: Add `SUPABASE_SERVICE_ROLE_KEY` as a secret

### **Error: "Storage bucket not found"**
- Solution: Make sure `detection-images` bucket exists in Storage
- Create it: Storage → Create bucket → Name: `detection-images` → Public: Yes

### **Error: "Permission denied"**
- Solution: Check storage bucket policies allow uploads
- Or use service_role key (which bypasses RLS)

---

## **Quick Checklist**

- [ ] Edge Function deployed
- [ ] `SUPABASE_URL` secret set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret set
- [ ] `detection-images` storage bucket exists
- [ ] Function tested and working
- [ ] Frontend can upload images successfully

Good luck! 🚀

