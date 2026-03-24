# Cloudinary Integration Setup Guide

## Overview
This guide walks you through setting up Cloudinary for image storage in production. Images will be stored on Cloudinary's CDN instead of the local server filesystem.

---

## Step 1: Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. Verify your email address
3. Go to your Dashboard at https://dashboard.cloudinary.com/

---

## Step 2: Get Your Cloudinary Credentials

In your Cloudinary Dashboard, find your API credentials:

- **Cloud Name**: Displayed prominently on the dashboard
- **API Key**: Under "API Keys" section
- **API Secret**: Under "API Keys" section (keep this secret!)

⚠️ **Important**: Do NOT commit your API Secret to git. Always use environment variables.

---

## Step 3: Configure Environment Variables

### Local Development (.env file)

Update your `.env` file in the `/server` directory:

```env
PORT=5004
MONGODB_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173
JWT_SECRET=bakrol-bal-mandal-change-this-in-production-use-long-random-string
ADMIN_PASSWORD=mahantswami
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

Replace the placeholders with your actual Cloudinary credentials.

### Production (Render.com)

1. Go to your Render project settings
2. Navigate to **Environment** section
3. Add these three environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

4. Redeploy your backend service

---

## Step 4: How It Works

### Image Upload Flow

1. **Frontend**: User selects image → FormData is sent to backend
2. **Backend**: 
   - Multer receives the file in memory
   - Cloudinary middleware uploads to Cloudinary
   - Save the Cloudinary URL (e.g., `https://res.cloudinary.com/...`) in MongoDB
3. **Response**: API returns student with Cloudinary image URL
4. **Frontend**: Displays the image using the Cloudinary URL

### Image Deletion Flow

When a student is deleted or photo is replaced:
1. Backend extracts the public_id from the Cloudinary URL
2. Calls `cloudinary.uploader.destroy()` to remove the image
3. Completes the student update/deletion

---

## Step 5: Testing Locally

1. Ensure your `.env` has valid Cloudinary credentials
2. Start the server:
   ```bash
   cd server
   npm start
   ```
3. Create a new student with a photo → Should upload to Cloudinary
4. Check your Cloudinary dashboard → Image should appear in `bakrol-bal-mandal/students` folder
5. Edit student → Replace photo → Old image should be deleted from Cloudinary
6. Delete student → Image should be removed from Cloudinary

---

## Step 6: Verify Everything Works

### Check Cloudinary Dashboard
- Go to **Media Library**
- Filter by folder: `bakrol-bal-mandal/students`
- You should see your uploaded student photos

### Check Database
- Open MongoDB Atlas
- View a student document
- The `photo` field should contain a full URL like:
  ```
  https://res.cloudinary.com/{cloud_name}/image/upload/...
  ```

### Check Frontend
- Images should display correctly in the Admin Dashboard
- No broken image icons
- Images should load fast (Cloudinary CDN)

---

## Troubleshooting

### Images Not Uploading?

1. **Check .env variables**:
   ```bash
   # Verify locally
   echo $CLOUDINARY_CLOUD_NAME  # Should print your cloud name
   ```

2. **Check server logs**:
   - Look for error messages about Cloudinary credentials
   - Ensure variables are not `your_actual_cloud_name` (placeholder)

3. **Verify Cloudinary account**:
   - Credentials are correct
   - Account is active (check email)
   - No API rate limits hit

### Images Still Showing as Broken Links?

- Ensure Cloudinary URLs are being stored in database
- Check browser network tab for URL format
- Verify Cloudinary CORS settings allow your domain

### Upload File Size Errors?

- Current limit: 5MB
- Edit `cloudinary-upload.js` to change: `limits: { fileSize: 5 * 1024 * 1024 }`

---

## Production Deployment Checklist

- [ ] Cloudinary account created and verified
- [ ] API credentials obtained
- [ ] Local `.env` updated with credentials
- [ ] Local testing completed (upload/edit/delete)
- [ ] Render.com environment variables set
- [ ] Backend redeployed on Render
- [ ] Images uploading to Cloudinary production account
- [ ] Frontend displaying images correctly
- [ ] Old local uploads cleaned up (if desired)

---

## Important Notes

### File Structure
- All student images go to: `bakrol-bal-mandal/students/` folder on Cloudinary
- Organization by folder helps with management and billing

### Image Optimization
- Cloudinary automatically optimizes images for web
- Faster CDN delivery compared to local storage
- Responsive image delivery based on device

### Security
- API Secret is never exposed to frontend
- Only API Key is used on frontend (if ever needed)
- All image operations go through backend

### Cost
- Cloudinary free tier includes:
  - 25 GB storage
  - 25 GB bandwidth per month
  - Unlimited transformations
- Perfect for small to medium applications

---

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Storage Cloudinary](https://github.com/afzalsayed96/multer-storage-cloudinary)
- [Cloudinary API Reference](https://cloudinary.com/documentation/cloudinary_api)

---

**Questions?** Check the error logs in your terminal or Cloudinary dashboard activity.
