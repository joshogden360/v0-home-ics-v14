# Deployment Troubleshooting Guide
## AI Functionality Issues

*Created: Current Date*  
*Issue: Deployed app not detecting items in images*

---

## 🚨 **Common Issue: Environment Variables Missing**

### **Required Environment Variables for Vercel:**

1. **GOOGLE_AI_API_KEY** (Required)
   - **Purpose**: Gemini API access for image analysis
   - **Status**: ❌ Likely missing in production
   - **Error**: API returns 500 or "API key not configured"

2. **GEMINI_MODEL_NAME** (Optional)
   - **Purpose**: Override default model (gemini-2.5-pro)
   - **Default**: gemini-2.5-pro
   - **Status**: ⚠️ Will use default if not set

3. **AUTH0 Variables** (If using authentication)
   - Various AUTH0_* environment variables
   - **Status**: ✅ Likely already configured

---

## 🔧 **Quick Fix Steps**

### **Step 1: Add Environment Variables to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `v0-apartment-inventory-schema`
3. Go to **Settings** → **Environment Variables**
4. Add the missing variables:

```bash
# Required
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Optional (uses gemini-2.5-pro by default)
GEMINI_MODEL_NAME=gemini-2.5-pro
```

### **Step 2: Redeploy**
- After adding environment variables, trigger a new deployment
- Either push a new commit or use "Redeploy" button in Vercel

---

## 🧪 **Testing the Fix**

### **Local Test (Should Work)**
```bash
# Ensure you have the API key locally
echo $GOOGLE_AI_API_KEY

# Start dev server
npm run dev

# Test at localhost:3000/items/create
```

### **Production Test**
1. Upload the same kitchen image
2. Click "Analyze"
3. **Expected**: Should detect multiple items (pans, appliances, etc.)
4. **If still failing**: Check browser console for errors

---

## 🔍 **Debugging Steps**

### **Check Environment Variables in Production**
Add this temporary debug endpoint to verify env vars:

```typescript
// app/api/debug/env/route.ts (TEMPORARY - DELETE AFTER TESTING)
export async function GET() {
  return Response.json({
    hasGoogleApiKey: !!process.env.GOOGLE_AI_API_KEY,
    modelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-pro',
    // Don't expose the actual key!
  })
}
```

### **Check API Response**
In browser console, look for:
- Network tab → `/api/ai/analyze` request
- Response should show detected items array
- If 500 error: Missing API key
- If empty array: Model/prompt issue

---

## 🎯 **Expected Results**

### **Kitchen Image Should Detect:**
- Pots and pans (hanging rack)
- Refrigerator
- Microwave
- Stove/cooktop
- Kitchen utensils
- Cutting board
- Various appliances

### **Typical Response Format:**
```json
{
  "success": true,
  "items": [
    {
      "x": 0.1,
      "y": 0.2,
      "width": 0.3,
      "height": 0.4,
      "label": "Stainless steel refrigerator",
      "confidence": 0.9
    }
    // ... more items
  ],
  "processingTime": 4500
}
```

---

## 🚨 **If Still Not Working**

### **Alternative Debugging:**
1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Functions tab
   - Look for `/api/ai/analyze` errors

2. **Verify API Key Permissions**
   - Test the API key in Google AI Studio
   - Ensure it has Gemini API access

3. **Model Availability**
   - Try falling back to `gemini-1.5-pro` if 2.5 has issues
   - Set `GEMINI_MODEL_NAME=gemini-1.5-pro`

4. **Rate Limiting**
   - Check if you've hit API quotas
   - Monitor usage in Google Cloud Console

---

## 📝 **Resolution Checklist**

- [ ] Added `GOOGLE_AI_API_KEY` to Vercel environment variables
- [ ] Redeployed the application
- [ ] Tested image upload and analysis
- [ ] Verified bounding boxes appear correctly
- [ ] Confirmed items panel shows detected items
- [ ] Removed any debug endpoints

---

## 🎉 **Success Criteria**

✅ **Working State:**
- Upload kitchen image
- Click "Analyze" button
- See multiple detected items (8-15 items expected)
- Bounding boxes overlay on image
- Items appear in right panel
- Can select and add items to inventory

**If you see this behavior, the deployment is successful!** 🚀

---

*Remember to delete any debug endpoints after troubleshooting.* 