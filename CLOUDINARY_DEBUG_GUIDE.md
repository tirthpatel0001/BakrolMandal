# Cloudinary Image Upload - Debugging Guide

## Issue: Images Not Visible After Deployment

**Symptom**: Images upload successfully but don't display in the UI on the deployed version.

**Root Causes** (in order of likelihood):
1. Images are uploaded but the URL is not being extracted/saved to database
2. API response is not returning the photo field
3. Frontend is trying to load images from wrong path
4. CORS or network issues preventing image loads
5. Cloudinary URL format incompatibility

---

## Step 1: Test Upload Endpoint

### 1A: Using the Diagnostic Endpoint

```bash
# Using curl (requires auth token)
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "test=@path/to/image.jpg" \
  http://localhost:5004/api/students/test-upload
```

### 1B: Using Browser DevTools

1. Open Admin Dashboard
2. Open DevTools → Network tab
3. Try uploading a student with a photo
4. Check the POST `/api/students` request:
   - Response → Look for `photo` field
   - Check if `photo` value is a full Cloudinary URL

**Expected Response**:
```json
{
  "_id": "...",
  "name": "...",
  "photo": "https://res.cloudinary.com/doklce3sl/image/upload/v1234567890/bakrol-bal-mandal/students/xxx.jpg",
  ...
}
```

**Bad Response** (photo is empty):
```json
{
  "_id": "...",
  "name": "...",
  "photo": "",
  ...
}
```

---

## Step 2: Check Server Logs

### 2A: Run Server with Logging Enabled

```bash
cd server
npm start
```

When you upload a student with a photo, you should see:

```
POST /api/students - File upload result: {
  fileProvided: true,
  photoUrl: 'https://res.cloudinary.com/doklce3sl/...',
  fileKeys: [ 'fieldname', 'originalname', 'encoding', 'mimetype', 'size', 'filename', 'secure_url', 'public_id', ... ]
}
POST /api/students - Student created: {
  id: '...',
  name: 'John Doe',
  photoStored: 'https://res.cloudinary.com/doklce3sl/...'
}
```

### 2B: Interpret Server Logs

**Good Log Output**:
- ✅ `fileProvided: true`
- ✅ `photoUrl: 'https://res.cloudinary.com/...'`
- ✅ `photoStored: 'https://res.cloudinary.com/...'`

**Bad Log Output - No File**:
```
fileProvided: false
photoUrl: ''
```
**Fix**: Check that form is using `<input type="file" name="photo" />`

**Bad Log Output - URL Not Extracted**:
```
fileKeys: [ 'fieldname', 'originalname', ... (no 'secure_url') ]
photoUrl: ''
```
**Fix**: Cloudinary response format changed; see Solution B below

---

## Step 3: Verify Database Storage

### 3A: Check MongoDB

```javascript
// In MongoDB Atlas or local mongo shell
use bakrol_bal_mandal

db.students.findOne({ name: "Student Name" })
```

Look for the `photo` field:

**Correct**:
```javascript
{
  _id: ObjectId("..."),
  name: "Student Name",
  photo: "https://res.cloudinary.com/doklce3sl/image/upload/...",
  ...
}
```

**Incorrect (Empty)**:
```javascript
{
  _id: ObjectId("..."),
  name: "Student Name",
  photo: "",  // ❌ Empty!
  ...
}
```

**Incorrect (Local Path)**:
```javascript
{
  _id: ObjectId("..."),
  name: "Student Name",
  photo: "/uploads/student-123.jpg",  // ❌ Old format!
  ...
}
```

---

## Solution A: Fix getImageUrl() Function (If URL Not Extracted)

If server logs show `photoUrl: ''` but file was uploaded:

**Problem**: multer-storage-cloudinary might provide the URL in a different property.

**Fix**: Update `/server/middleware/cloudinary-upload.js`:

```javascript
export function getImageUrl(file) {
  if (!file) {
    console.warn("getImageUrl: No file provided");
    return "";
  }
  
  // Try multiple property names used by CloudinaryStorage
  const url = 
    file.secure_url ||      // Standard property
    file.url ||             // Alternative property
    file.path ||            // Fallback property
    (file.cloudinary && file.cloudinary.secure_url) ||  // Nested property
    "";
  
  if (!url) {
    console.error("ERROR: Could not extract URL from file object:", {
      keys: Object.keys(file),
      fullObject: JSON.stringify(file, null, 2),
    });
  }
  
  return url;
}
```

**Then test**:
```bash
npm start
# Upload student with photo and check logs
```

---

## Solution B: Check Cloudinary Configuration

If logs show `fileKeys` without `secure_url`:

**Problem**: CloudinaryStorage not properly configured.

**Fix**: Verify `/server/middleware/cloudinary-upload.js`:

```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bakrol-bal-mandal/students",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    // ADD THESE IF MISSING:
    quality: "auto",
    fetch_format: "auto",
  },
});
```

Also verify Cloudinary config is loaded:

```javascript
// Add after cloudinary.config()
console.log("Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
});
```

Check .env file has all three:
```bash
CLOUDINARY_CLOUD_NAME=doklce3sl
CLOUDINARY_API_KEY=813352467425514
CLOUDINARY_API_SECRET=VwWy9GI0noIEIMbnclNrqSqRRSM
```

---

## Solution C: Fix Frontend Image Display

If database has URLs but images don't display:

**Check 1: Browser Console**

Open admin dashboard → DevTools Console
- Look for image 404 errors
- Check network tab for image requests

**Check 2: Image URL Format**

In browser console:
```javascript
// Open Network tab, filter by "Img"
// Click on image request
// Check Response headers for:
// ✅ Content-Type: image/jpeg
// ✅ Status: 200
```

**Check 3: Frontend Code**

Verify `/client/src/pages/AdminDashboard.jsx` has:

```jsx
{s.photo ? (
  <img src={s.photo} alt="" className="dash-student-photo" />
) : (
  <div className="dash-student-photo dash-student-photo-ph">No photo</div>
)}
```

**DO NOT USE** `/uploads/` prefix:
```jsx
❌ <img src={`/uploads/${s.photo}`} />  // WRONG!
✅ <img src={s.photo} />                // RIGHT!
```

---

## Solution D: Enable CORS for Cloudinary URLs

If images are blocked due to CORS:

**Check 1: Look for CORS errors**

Browser console will show:
```
Access to image at 'https://res.cloudinary.com/...' 
from origin 'https://yourdomain.com' has been blocked by CORS policy
```

**Check 2: Verify Server CORS**

`/server/server.js` should have:

```javascript
app.use(
  cors({
    origin: "*",  // Allow all origins
    // OR for production:
    // origin: ["https://yourdomain.vercel.app"],
  })
);
```

**Check 3: Cloudinary doesn't need CORS**

Cloudinary URLs should work directly from browser without backend CORS.

If still blocked, check:
- Vercel environment is connected to right backend
- Render backend CORS is properly configured

---

## Solution E: Fix API Response Structure

If API returns student data but photo field is missing:

**Problem**: Database query not including photo field.

**Check**: `/server/routes/students.js` GET endpoint:

```javascript
router.get("/", async (_req, res) => {
  try {
    // ✅ This includes all fields including photo
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list students" });
  }
});
```

If using `.select()`, make sure to include photo:

```javascript
// ❌ BAD - excludes photo
const students = await Student.find().select("-photo");

// ✅ GOOD - includes photo
const students = await Student.find(); // includes all by default
```

---

## Complete Verification Checklist

- [ ] `.env` has 3 Cloudinary variables set
- [ ] `npm install` completed successfully
- [ ] Server logs show `photoUrl: 'https://res.cloudinary.com/...'`
- [ ] MongoDB shows photo field with full Cloudinary URL
- [ ] API response includes photo field and URL
- [ ] Browser network tab shows image loads from `res.cloudinary.com`
- [ ] Frontend code displays `s.photo` without `/uploads/` prefix
- [ ] Images display in admin dashboard

---

## Testing Procedure

### Test 1: Local Upload

```bash
# Terminal 1: Start server
cd server
npm start

# See logs when uploading
```

1. Open http://localhost:5173/admin
2. Log in
3. Click "Add Student"
4. Fill form and select a JPG image
5. Click "Add student"

**Check**:
- ✅ Student appears in list
- ✅ Photo displays with no broken image icon
- ✅ Server logs show full Cloudinary URL
- ✅ MongoDB has photo URL

### Test 2: Network Debugging

1. Open DevTools → Network tab
2. Filter by "Img"
3. Refresh page
4. Click on student photo request
5. Verify:
   - URL starts with `https://res.cloudinary.com/`
   - Status is 200
   - Content-Type is image/*

### Test 3: Production Test

After deploying to Render:

1. Go to frontend URL on Vercel
2. Test upload
3. Check Render logs:
   ```bash
   # In Render dashboard → Logs
   # Look for POST /api/students logs with photo URL
   ```

---

## Emergency Rollback

If Cloudinary integration is completely broken:

```bash
# Revert cloudinary-upload.js to use local storage
cd server

# Restore old upload.js
git checkout middleware/upload.js

# Update students.js to use old middleware
git checkout routes/students.js

# Remove cloudinary packages
npm uninstall cloudinary multer-storage-cloudinary

# Restart
npm start
```

---

## Contact Cloudinary Support (If Still Broken)

If nothing above works, test with Cloudinary directly:

```javascript
// Test script: node cloudinary-test.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'doklce3sl',
  api_key: '813352467425514',
  api_secret: 'VwWy9GI0noIEIMbnclNrqSqRRSM',
});

// Try uploading a test file
const result = await cloudinary.uploader.upload('./test-image.jpg', {
  folder: 'bakrol-bal-mandal/students',
});

console.log('Upload result:', result);
console.log('Secure URL:', result.secure_url);
```

---

## Key Resources

- **Cloudinary Docs**: https://cloudinary.com/documentation/node_image_upload
- **multer-storage-cloudinary**: https://github.com/afzal-hussein/multer-storage-cloudinary
- **MongoDB Atlas**: https://account.mongodb.com/
- **Render Logs**: https://dashboard.render.com/ → Select Project → Logs
- **Vercel Logs**: https://vercel.com → Select Project → Functions/Logs
