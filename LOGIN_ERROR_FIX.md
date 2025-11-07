# 🔧 Fix Login Errors

Common login errors and how to fix them:

---

## **Error 1: "Invalid login credentials"**

**Cause:** Wrong email/password or account doesn't exist

**Fix:**
1. Make sure you **signed up first** (use the "Sign Up" tab)
2. Check your email and password are correct
3. Try creating a new account if you're not sure

---

## **Error 2: "Failed to fetch" or Network Error**

**Cause:** `.env` file missing or wrong Supabase URL/key

**Fix:**

1. **Check if `.env` file exists** in your project root:
   - Should be in same folder as `package.json`
   - File name is exactly `.env` (no extension)

2. **Create `.env` file** with:
   ```env
   VITE_SUPABASE_URL=https://iscxriwdxxvzhcoguvyk.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3hyaXdkeHh2emhjb2d1dnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTUyOTksImV4cCI6MjA3ODAzMTI5OX0.l7H9OBbwhyWnuaVbd54ErZy7TnJJKNNBQjiKWTmbw18
   ```

3. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

---

## **Error 3: "Email not confirmed"**

**Cause:** Supabase requires email confirmation (default setting)

**Fix:**

### **Option A: Disable Email Confirmation (Quick Fix for Demo)**

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Email** provider
3. **Disable "Confirm email"** toggle
4. Save

### **Option B: Check Your Email**

1. Check your email inbox (and spam folder)
2. Click the confirmation link
3. Then try logging in again

---

## **Error 4: "Database error" or "Table doesn't exist"**

**Cause:** Database migrations not run

**Fix:**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Open `supabase/migrations/20251106162400_4323931a-2900-450b-b20a-fb38de3b9005.sql`
4. **Copy ALL the SQL code**
5. **Paste** into SQL Editor
6. Click **"Run"**
7. Should see "Success. No rows returned"

---

## **Error 5: "Invalid API key"**

**Cause:** Wrong anon key in `.env` file

**Fix:**

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **anon public key** (not service_role!)
3. Update `.env` file with correct key
4. Restart `npm run dev`

---

## **Quick Diagnostic Steps**

### **Step 1: Check Browser Console**

1. Open your app in browser
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Try to log in
5. Look for error messages (red text)
6. **Copy the error message** and share it

### **Step 2: Check Network Tab**

1. In Developer Tools, go to **Network** tab
2. Try to log in
3. Look for failed requests (red)
4. Click on them to see error details

### **Step 3: Verify Supabase Connection**

Open browser console and type:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20))
```

Should show:
- URL: `https://iscxriwdxxvzhcoguvyk.supabase.co`
- KEY: `eyJhbGciOiJIUzI1NiIs...`

If it shows `undefined`, your `.env` file is not being read!

---

## **Most Common Fix**

**90% of login errors are because `.env` file is missing or wrong!**

1. ✅ Create `.env` file in project root
2. ✅ Add your Supabase credentials
3. ✅ **Restart `npm run dev`** (important!)
4. ✅ Try logging in again

---

## **Still Not Working?**

**Share the exact error message** you see:
- In the toast notification
- In browser console (F12)
- In terminal where `npm run dev` is running

I'll help you fix it! 🚀

