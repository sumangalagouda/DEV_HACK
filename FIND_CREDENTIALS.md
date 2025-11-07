# 🔍 How to Find Your Supabase Credentials

Since Lovable set up Supabase automatically, here's how to find your credentials:

---

## **Method 1: Check Browser Console (Easiest!)**

1. **Run your app:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to `http://localhost:5173` (or whatever port it shows)

3. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or right-click → "Inspect"

4. **Go to Console tab**

5. **Type these commands and press Enter:**
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
   console.log('KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
   ```

6. **Copy the values** that appear!

---

## **Method 2: Check Lovable Dashboard**

1. Go to: **https://lovable.dev/projects/6f7b3530-c454-4e92-ae81-a4bdcd7a6036**
2. Look for **Settings** or **Environment Variables**
3. Find:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Copy those values

---

## **Method 3: Go to Supabase Directly**

1. Go to: **https://app.supabase.com**
2. **Sign in** (use the same account as Lovable)
3. Look for project with ID: **`fiwivuetflmfbgayrbmu`**
4. Click on it
5. Go to **Settings** → **API**
6. Copy:
   - **Project URL** (should be: `https://fiwivuetflmfbgayrbmu.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## **Once You Have the Credentials:**

### **Step 1: Create `.env` file**

Create a file named `.env` in your project root (same folder as `package.json`) with:

```env
VITE_SUPABASE_URL=https://fiwivuetflmfbgayrbmu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=paste_your_anon_key_here
```

**Important:** Replace `paste_your_anon_key_here` with the actual key you found!

### **Step 2: Update Python Script**

Open `python-worker/real_time_monitor.py` and update:

```python
SUPABASE_FN_URL = 'https://fiwivuetflmfbgayrbmu.functions.supabase.co/detect-ppe'
SUPABASE_ANON_KEY = 'paste_your_anon_key_here'
SUPABASE_URL = 'https://fiwivuetflmfbgayrbmu.supabase.co'
```

### **Step 3: Restart Everything**

1. **Stop** your `npm run dev` (Ctrl+C)
2. **Start it again:** `npm run dev`
3. **Run Python script:** `python real_time_monitor.py`

---

## **Quick Test:**

After setting up, test if it works:

1. Run your Python script
2. When a violation is detected, check terminal for: `✅ Detection pushed to Supabase`
3. Check your dashboard - it should update automatically!

---

## **Still Can't Find It?**

If none of these methods work:
1. Check if Lovable has a "View Environment Variables" option
2. Contact Lovable support
3. Or create a new Supabase project and migrate (I can help with this)

Let me know what you find! 🚀

