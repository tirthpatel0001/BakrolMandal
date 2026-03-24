# Cloudinary Integration - Troubleshooting Guide

## Common Issues & Solutions

### ❌ Error: "CLOUDINARY_CLOUD_NAME is not defined"

**Cause**: Environment variables not loaded correctly

**Solutions**:
1. Check `.env` file exists in `/server` directory
2. Verify exact spelling:
   ```
   CLOUDINARY_CLOUD_NAME=your_value
   CLOUDINARY_API_KEY=your_value
   CLOUDINARY_API_SECRET=your_value
   ```
3. Restart server (changes in `.env` require restart)
4. For Render.com, ensure variables are in Environment settings, not Secrets

**Test locally**:
```bash
# In bash/terminal
echo $CLOUDINARY_CLOUD_NAME

# In Node.js console
console.log(process.env.CLOUDINARY_CLOUD_NAME)
```

---

### ❌ Error: "Must supply api_key"

**Cause**: `CLOUDINARY_API_KEY` is not set, null, or the old upload.js is still being used

**Solutions**:
1. Verify all three variables are set in .env:
   - `CLOUDINARY_CLOUD_NAME` ✓
   - `CLOUDINARY_API_KEY` ✓
   - `CLOUDINARY_API_SECRET` ✓

2. Check imports in `students.js`:
   ```javascript
   // Should be:
   import { uploadStudentPhoto, deleteCloudinaryImage, getImageUrl } 
     from "../middleware/cloudinary-upload.js";
   
   // NOT:
   // import { uploadStudentPhoto } from "../middleware/upload.js";
   ```

3. Verify routes use new middleware:
   ```
   ❌ OLD: uploadStudentPhoto.single("photo")
   ✅ NEW: uploadStudentPhoto.single("photo")
   // (Same, but different implementation)
   ```

---

### ❌ Error: "Invalid Cloud Name"

**Cause**: `CLOUDINARY_CLOUD_NAME` is a placeholder like `"your_cloud_name"`

**Solution**:
1. Go to https://dashboard.cloudinary.com/
2. Look at the URL bar: `dashboard.cloudinary.com/`**`cm...xyz`** ← This is your cloud name
3. Or look for it displayed prominently on the dashboard
4. Update `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=cm...xyz  # Replace with actual value!
   ```

---

### ❌ Images Not Uploading - "413 Payload Too Large"

**Cause**: File exceeds size limit

**Solution**:
1. Default limit is 5MB
2. To increase, edit `cloudinary-upload.js`:
   ```javascript
   export const uploadStudentPhoto = multer({
     storage: storage,
     limits: { fileSize: 10 * 1024 * 1024 }, // Change to 10MB
     fileFilter: fileFilter,
   });
   ```

---

### ❌ Images Upload But Don't Appear in Database

**Cause**: Cloudinary upload succeeds but saving photo URL fails

**Solutions**:
1. Check server logs for errors
2. Verify MongoDB connection is working
3. Check if `getImageUrl()` is returning a value:
   ```javascript
   // In POST route, add debug log:
   const photoUrl = getImageUrl(req.file);
   console.log("Image URL:", photoUrl);  // Should print Cloudinary URL
   ```

4. Verify `req.file` is not undefined:
   ```javascript
   console.log("File object:", req.file);  // Should have secure_url property
   ```

---

### ❌ Image Uploads But Frontend Shows Broken Icon

**Cause**: URL is missing or malformed

**Solutions**:

1. **Check database**:
   ```javascript
   // MongoDB query
   db.students.find({ _id: ObjectId("...") }).pretty()
   
   // Should show:
   { photo: "https://res.cloudinary.com/..." }
   ```

2. **Check API response**:
   - Use browser DevTools Network tab
   - Open the POST request
   - Check "Response" tab
   - Verify `photo` field contains full URL

3. **Check Cloudinary account**:
   - Go to Media Library
   - Look for `bakrol-bal-mandal/students` folder
   - Verify image is there

---

### ❌ Image Deletes But File Remains in Cloudinary

**Cause**: `deleteCloudinaryImage()` function isn't working

**Solutions**:
1. Check server logs for errors in deletion
2. Verify API_SECRET is correct (required for deletion)
3. Check if image URL format changed on Cloudinary

**Debug log deletion**:
```javascript
// In deleteCloudinaryImage function:
console.log("Deleting:", imageUrl);
console.log("Full public ID:", fullPublicId);
```

---

### ❌ CORS Error: "Cross-Origin Request Blocked"

**Cause**: Frontend and backend have different domains

**Solution**: Ensure server has CORS enabled:
```javascript
app.use(
  cors({
    origin: "*", // or specific domain for production
  })
);
```

---

### ❌ Cloudinary Upload Shows "Must provide secure URL for images"

**Cause**: `CloudinaryStorage` version incompatibility

**Solutions**:
1. Check installed version:
   ```bash
   npm list multer-storage-cloudinary
   ```

2. Should be 4.0.0 or higher. If not, update:
   ```bash
   npm install multer-storage-cloudinary@latest
   ```

3. Verify file object has `secure_url`:
   ```javascript
   console.log(req.file);  // Should have: { secure_url: "https://..." }
   ```

---

## Verification Checklist

### ✅ Local Development Setup

- [ ] Cloudinary account created
- [ ] Credentials obtained (Cloud Name, API Key, API Secret)
- [ ] `.env` file updated with real credentials
- [ ] `npm install` completed successfully
- [ ] Server starts without errors: `npm start`
- [ ] Upload endpoint returns 201 status
- [ ] Response includes photo URL starting with `https://res.cloudinary.com`

### ✅ Cloudinary Dashboard Verification

- [ ] Can log in to dashboard.cloudinary.com
- [ ] Cloud Name displays correctly
- [ ] Media Library shows uploaded images
- [ ] Images in correct folder: `bakrol-bal-mandal/students`
- [ ] Images can be opened and viewed

### ✅ Frontend Verification

- [ ] Student list loads without errors
- [ ] Photos display correctly from Cloudinary URLs
- [ ] No broken image icons (404 errors)
- [ ] Can upload new student with photo
- [ ] Can edit student and replace photo
- [ ] Can delete student (image removed from Cloudinary)

### ✅ Production (Render.com) Verification

- [ ] Environment variables added to Render project
- [ ] Backend redeployed successfully
- [ ] Server logs show proper Cloudinary connection
- [ ] Can create/edit/delete students with photos
- [ ] Images load from Render API but stored on Cloudinary

---

## Testing Methods

### Test 1: Create Student with Photo
1. Log in to admin panel
2. Click "Add Student"
3. Fill form, select a JPG/PNG image
4. Click "Add student"
5. Check:
   - ✅ Success message appears
   - ✅ Student appears in list with photo
   - ✅ Image displays correctly
   - ✅ No errors in browser console
   - ✅ Image appears in Cloudinary dashboard

### Test 2: Update Student Photo
1. Click "Edit" on existing student
2. Select a different image file
3. Click "Update student"
4. Check:
   - ✅ Photo updates in list
   - ✅ Old image removed from Cloudinary
   - ✅ New image in Cloudinary dashboard

### Test 3: Delete Student
1. Click "Delete" on a student
2. Confirm deletion
3. Check:
   - ✅ Student removed from list
   - ✅ Image removed from Cloudinary dashboard

### Test 4: API Direct Testing
```bash
# Get all students (view URLs)
curl -H "Authorization: Bearer TOKEN" \
  https://your-api.onrender.com/api/students

# Check response includes Cloudinary URLs for photo field
```

---

## Performance Monitoring

### Monitor Upload Speed
- Should take 1-3 seconds per image upload
- If slower, check internet connection or Cloudinary status

### Monitor Image Loading
- Browser DevTools Network tab
- Images should load from `res.cloudinary.com`
- Check response times (should be <500ms from CDN)

### Monitor Storage Usage
- Check Cloudinary Dashboard → Billing
- Shows current storage and bandwidth usage
- Free tier: 25GB storage, 25GB bandwidth/month

---

## Getting Help

### Check These First
1. Server logs: `npm start` output in terminal
2. Browser console: Open DevTools → Console tab
3. Network tab: Check API responses
4. Cloudinary dashboard: Verify media library
5. MongoDB: Check if photos are stored (might be empty string)

### Enable Debug Logging
Add to `students.js`:
```javascript
console.log("File received:", req.file);
console.log("Photo URL:", photoUrl);
console.log("Student saved:", student);
```

### Gather Information for Support
If asking for help:
1. Error message (exact text)
2. Log output from server
3. Network tab screenshot
4. Cloudinary credentials status (✓ valid, ✗ invalid)
5. Steps to reproduce the issue

---

## Rollback Plan (If Needed)

If you need to go back to local storage:

1. Restore old `upload.js` from git
2. Restore old `students.js` from git
3. Remove Cloudinary env variables
4. `npm uninstall cloudinary multer-storage-cloudinary`
5. Restart server

**Note**: Old local files will still be needed if they exist in `/server/uploads/`

---

## Common Questions

**Q: Can I use both local storage and Cloudinary?**
A: Yes, with conditional logic. Not recommended for simplicity.

**Q: What if Cloudinary goes down?**
A: Images become inaccessible (URL broken). Consider backup service.

**Q: How do I migrate existing uploads to Cloudinary?**
A: Requires export script. Contact support if needed.

**Q: Is student data encrypted on Cloudinary?**
A: Cloudinary uses HTTPS. Encryption at rest available with Enterprise plan.

**Q: Can I restrict image access?**
A: Yes, use Cloudinary's authenticated URLs and access control.

---

**More help**: Check Cloudinary docs at https://cloudinary.com/documentation
