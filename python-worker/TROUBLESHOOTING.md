# Troubleshooting: Dashboard Not Updating

If your Python script is running but no changes appear in the dashboard, follow these steps:

## ✅ Step 1: Check Configuration

Make sure you've updated these values in `real_time_monitor.py`:

```python
SUPABASE_FN_URL = 'https://YOUR_PROJECT_REF.functions.supabase.co/detect-ppe'
SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
SUPABASE_ANON_KEY = 'your_anon_key_here'
```

### How to Get Your Supabase Credentials:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Go to Settings > API**
4. **Copy:**
   - **Project URL** → Use for `SUPABASE_URL`
   - **anon/public key** → Use for `SUPABASE_ANON_KEY`
   - **Edge Function URL** → Go to Edge Functions section, click on `detect-ppe`, copy the "Invoke URL"

## ✅ Step 2: Check Python Script Output

When you run `python real_time_monitor.py`, look for:

- ✅ `✅ Detection pushed to Supabase: ...` - Success!
- ⚠️ `⚠️ Supabase returned status ...` - Error, check the status code
- ❌ `❌ Error pushing to Supabase: ...` - Network/configuration error

### Common Errors:

**Error: "Supabase configuration not set"**
- Solution: Update SUPABASE_FN_URL or SUPABASE_URL/ANON_KEY in the script

**Error: "401 Unauthorized"**
- Solution: Check your SUPABASE_ANON_KEY is correct

**Error: "404 Not Found"**
- Solution: Check your SUPABASE_FN_URL is correct, or deploy the Edge Function

**Error: "Network error"**
- Solution: Check your internet connection, or Supabase might be down

## ✅ Step 3: Verify Edge Function is Deployed

1. Go to Supabase Dashboard > Edge Functions
2. Make sure `detect-ppe` function exists and is deployed
3. Click on it to see the "Invoke URL"
4. Copy that URL to `SUPABASE_FN_URL` in your script

## ✅ Step 4: Test Direct Database Insert

If Edge Function doesn't work, the script will try direct database insert. Check:

1. Your `SUPABASE_URL` is correct
2. Your `SUPABASE_ANON_KEY` is correct
3. Your database table `detections` exists and has the right columns

## ✅ Step 5: Check Dashboard Real-Time Subscription

The dashboard should automatically show new detections via Supabase Realtime. Verify:

1. Your dashboard is running: `npm run dev`
2. You're logged in to the dashboard
3. Check browser console for any errors (F12 > Console)

## ✅ Step 6: Manual Test

Test if Supabase connection works:

```python
# Add this test at the start of main() function
import requests

test_url = f"{SUPABASE_URL}/rest/v1/detections"
headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
}
response = requests.get(test_url, headers=headers)
print(f"Test connection: {response.status_code}")
```

## 🔍 Debug Mode

To see more details, the script now prints:
- 📤 When it tries to push to Supabase
- ✅ Success messages
- ⚠️ Warning messages with error details
- ❌ Error messages with full traceback

## 📞 Still Not Working?

1. **Check terminal output** - Look for error messages
2. **Check Supabase logs** - Go to Dashboard > Logs > Edge Functions
3. **Test Edge Function manually** - Use Supabase Dashboard to invoke the function
4. **Verify database** - Check if detections table has new rows

## Quick Fix Checklist

- [ ] SUPABASE_FN_URL is updated (not "YOUR_PROJECT_REF")
- [ ] SUPABASE_URL is updated (not "YOUR_PROJECT_REF")
- [ ] SUPABASE_ANON_KEY is updated (not "YOUR_SUPABASE_ANON_KEY")
- [ ] Edge Function is deployed
- [ ] Python script shows "✅ Detection pushed" messages
- [ ] Dashboard is running and you're logged in
- [ ] Browser console shows no errors

