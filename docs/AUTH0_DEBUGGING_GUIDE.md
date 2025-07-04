# Auth0 Integration Debugging & Optimization Guide

## 🎯 **Current Status Summary**

### ✅ **Working Features**
- **Login Flow**: Complete Auth0 → Google OAuth → Database Sync → Dashboard
- **Authentication**: Users successfully authenticate via Auth0
- **Database Integration**: User data syncs to Neon PostgreSQL 
- **Row Level Security**: RLS policies working correctly
- **Dashboard Access**: Users see their real inventory data
- **Navigation**: Full app functionality accessible post-login

### ❌ **Issues to Debug**
- **Signup Page**: Returns 500 Internal Server Error
- **Auth0 UI**: Contains marketing fluff for personal tool
- **Port Inconsistency**: Dev server switching between 3000/3001

---

## 🔧 **Environment Configuration**

### **Auth0 Settings** 
```bash
AUTH0_ISSUER_BASE_URL=https://dev-4h71w2jrwhrwt542.us.auth0.com
AUTH0_CLIENT_ID=RNYHVZ13K3G23pTmrw8c8gNclcVnyYx1
AUTH0_CLIENT_SECRET=<your-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_SECRET=4131452d8ff4090b517f2442149c5dc69efee7b6577fbbd3a34d5c4c9502482d
AUTH0_AUDIENCE=https://api.myapp.com/
AUTH0_SCOPE=openid profile email
```

### **Auth0 Dashboard URLs** 
- **Callback URLs**: `http://localhost:3000/api/auth/callback, http://localhost:3001/api/auth/callback`
- **Logout URLs**: `http://localhost:3000/login, http://localhost:3001/login`
- **Web Origins**: `http://localhost:3000, http://localhost:3001`

---

## 🐛 **Debugging Plan**

### **1. Fix Signup Page 500 Error**

#### **Investigation Steps:**
```bash
# Check server logs for errors
npm run dev

# Test signup page directly
curl -v http://localhost:3000/signup

# Test Auth0 signup route
curl -v http://localhost:3000/api/auth/signup

# Check for compilation errors
npm run build
```

#### **Likely Causes:**
- **React component error** in `app/signup/page.tsx`
- **Missing dependency** in Auth0 SDK
- **Environment variable mismatch**
- **Next.js compilation issue**

#### **Files to Check:**
- `app/signup/page.tsx` - Component implementation
- `app/api/auth/[...auth0]/route.ts` - Auth0 handler
- `app/api/auth/signup/route.ts` - Signup redirect
- Terminal output for compilation errors

### **2. Remove Auth0 Marketing Elements**

#### **Current Marketing Elements:**
- Auth0 Universal Login branding
- "Powered by Auth0" text
- Auth0 logo and styling
- Social provider descriptions

#### **Customization Options:**

**Option A: Auth0 Branding Settings**
```bash
# In Auth0 Dashboard → Branding → Universal Login
- Custom logo upload
- Custom CSS themes
- Remove Auth0 branding (paid feature)
```

**Option B: Custom Login Implementation**
```typescript
// Replace Auth0 Universal Login with custom forms
// Use Auth0 Management API directly
// Implement headless authentication
```

**Option C: Minimal Auth0 Styling**
```css
/* Custom CSS to hide Auth0 branding */
.auth0-lock-header-logo,
.auth0-lock-header-bg,
.auth0-badge {
  display: none !important;
}
```

### **3. Port Consistency Fix**

#### **Solution:**
```bash
# Always force port 3000
PORT=3000 npm run dev

# Or update package.json
"scripts": {
  "dev": "PORT=3000 next dev"
}
```

---

## 🎨 **UI Optimization for Personal Use**

### **Remove/Simplify Elements:**
- [ ] Auth0 branding and marketing text
- [ ] Unnecessary social login options
- [ ] "Sign up" vs "Login" distinction (just use one form)
- [ ] Marketing copy in login/signup pages
- [ ] Auth0 footer links

### **Personal Tool Optimizations:**
- [ ] Simple email/password form
- [ ] Direct Google OAuth button
- [ ] Minimal, clean interface
- [ ] Skip signup flow (just use login)
- [ ] Remove user registration complexity

---

## 🔍 **Debugging Commands**

### **Check Auth0 SDK Installation:**
```bash
npm list @auth0/nextjs-auth0
npm install @auth0/nextjs-auth0@latest --legacy-peer-deps
```

### **Test Database Connection:**
```bash
curl http://localhost:3000/api/test-rls
```

### **Check Build Issues:**
```bash
npm run build
npm run start
```

### **Verify Environment Variables:**
```bash
# Check .env file is being loaded
echo $AUTH0_CLIENT_ID
printenv | grep AUTH0
```

---

## 📁 **Key Files Reference**

### **Authentication Files:**
- `app/login/page.tsx` - ✅ Working login page
- `app/signup/page.tsx` - ❌ 500 error page
- `app/api/auth/[...auth0]/route.ts` - ✅ Main Auth0 handler
- `app/api/auth/login/route.ts` - ✅ Login redirect
- `app/api/auth/signup/route.ts` - ❌ Signup redirect
- `app/api/auth/callback/route.ts` - ✅ Auth0 callback
- `app/api/auth/logout/route.ts` - ✅ Logout handler

### **Database/Security Files:**
- `lib/auth0-rls.ts` - ✅ RLS integration utilities
- `db/migrations/003_enable_row_level_security.sql` - ✅ RLS policies
- `app/api/test-rls/route.ts` - ✅ RLS testing endpoint

### **Configuration Files:**
- `.env` - Environment variables
- `middleware.ts` - Route protection
- `next.config.mjs` - Next.js config

---

## 🚀 **Resume Work Checklist**

### **When Returning to Debug:**

1. **[ ] Start Development Environment**
   ```bash
   cd /Users/tangleboro/Desktop/Programming/inventory-dashboard
   PORT=3000 npm run dev
   ```

2. **[ ] Test Current Status**
   - ✅ Login: http://localhost:3000/login
   - ❌ Signup: http://localhost:3000/signup  
   - ✅ Dashboard: http://localhost:3000/

3. **[ ] Debug Signup Page**
   - Check terminal for compilation errors
   - Inspect `app/signup/page.tsx` for React errors
   - Test Auth0 signup flow manually

4. **[ ] Optimize Auth0 UI**
   - Remove marketing elements
   - Simplify authentication flow
   - Update branding in Auth0 dashboard

5. **[ ] Test Complete Flow**
   - New user signup
   - Existing user login  
   - Database sync verification
   - RLS policy testing

---

## 💡 **Quick Fixes to Try First**

### **Signup Page Error:**
```bash
# 1. Clear Next.js cache
rm -rf .next/
npm run dev

# 2. Check for missing imports in signup page
# 3. Verify Auth0 SDK compatibility
# 4. Test with simplified signup component
```

### **Auth0 UI Simplification:**
```typescript
// In app/login/page.tsx and app/signup/page.tsx
// Remove marketing text, simplify to:
<Button>Continue with Google</Button>
// Skip email/password forms for personal use
```

---

## 📞 **Support Resources**

- **Auth0 Documentation**: https://auth0.com/docs/quickstart/webapp/nextjs
- **Neon RLS Guide**: https://neon.tech/docs/guides/row-level-security
- **Next.js 15 Auth**: https://nextjs.org/docs/app/building-your-application/authentication

---

## 🎯 **Success Criteria**

- [ ] Signup page loads without 500 error
- [ ] Clean, minimal Auth0 login interface
- [ ] Single Google OAuth button workflow
- [ ] No Auth0 marketing text visible
- [ ] Consistent localhost:3000 development
- [ ] New users can sign up and access dashboard
- [ ] RLS properly isolates user data

---

*Last Updated: January 2, 2025*  
*Status: Login working ✅ | Signup debugging needed ❌* 