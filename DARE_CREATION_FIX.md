# Dare Creation Fix - Setup and Testing Guide

## Issues Fixed

✅ **Authentication Mismatch**: Updated the component to use the backend's JWT authentication system instead of Supabase
✅ **API Endpoints**: Fixed all API calls to use the correct backend server URL (localhost:5000)
✅ **Categories Dropdown**: Added categories dropdown to the form
✅ **Error Handling**: Improved error messages and logging

## What Was Changed

### 1. **DaresManagement.jsx** - Complete Rewrite
- Removed Supabase dependencies
- Updated to use backend API endpoints
- Added categories dropdown
- Fixed authentication token handling
- Improved error messages

### 2. **Key Changes Made**:
- `fetchDares()`: Now calls `http://localhost:5000/api/dares`
- `fetchCategories()`: New function to load categories
- `handleSubmit()`: Uses backend authentication token
- `handleDelete()`: Fixed to use backend API
- Added category selection in the form

## Setup Instructions

### 1. **Start the Backend Server**
```bash
cd C:\Users\temes\Desktop\dareearn\Dare2Earn\server
npm install
npm start
```
The server should start on `http://localhost:5000`

### 2. **Start the Frontend**
```bash
cd C:\Users\temes\Desktop\dareearn\Dare2Earn
npm start
```
The frontend should start on `http://localhost:3000`

### 3. **Authentication Setup**
The component expects an authentication token in localStorage. You need to:

1. **Log in through your app's login system** 
2. **The login should store a token in localStorage** as `authToken`

If you don't have a login system set up yet, you can temporarily test by manually adding a token to localStorage in the browser console:

```javascript
// First, create a test user by calling the signup endpoint
fetch('http://localhost:5000/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    full_name: 'Test User'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Signup result:', data);
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    console.log('Token saved to localStorage');
  }
});
```

### 4. **Test Categories**
Make sure you have some categories in your database. You can add them manually or through the API:

```sql
-- Add test categories to PostgreSQL
INSERT INTO categories (name, description) VALUES 
('Sports', 'Sports related dares'),
('Comedy', 'Funny and entertaining dares'),
('Skills', 'Show off your talents'),
('Creative', 'Creative and artistic challenges');
```

## Testing the Functionality

### 1. **Test Dare Creation**
1. Open the DaresManagement component
2. Click "Create New Dare"
3. Fill out the form:
   - Title: "Test Dare"
   - Description: "This is a test dare"
   - Category: Select from dropdown
   - Entry Fee: 5.00
   - Media Type: Image or Video
   - Start Time: Current date/time
   - End Time: Future date/time
4. Click "Create Dare"

### 2. **Expected Behavior**
- ✅ Form should submit successfully
- ✅ You should see a success toast message
- ✅ The new dare should appear in the table
- ✅ Category name should display correctly

### 3. **Error Scenarios to Test**
- Try creating without a token (should show "Please log in" error)
- Try with invalid token (should show authentication error)
- Try with missing required fields (should show validation errors)

## Common Issues and Solutions

### 1. **"Please log in to create dares"**
**Problem**: No authentication token in localStorage
**Solution**: Log in through your app or manually set token as shown above

### 2. **"Failed to fetch categories"**
**Problem**: Backend server not running or categories table empty
**Solution**: Start backend server and add test categories to database

### 3. **"Failed to create dare"**
**Problem**: Could be various backend issues
**Solution**: Check browser console and backend server logs for detailed error messages

### 4. **Network Errors**
**Problem**: Frontend can't connect to backend
**Solution**: 
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify database connection

## Backend API Endpoints Used

- `GET /api/categories` - Fetch all categories
- `GET /api/dares` - Fetch all dares  
- `POST /api/dares` - Create new dare (requires auth)
- `PUT /api/dares/:id` - Update dare (requires auth)
- `DELETE /api/dares/:id` - Delete dare (requires auth)

## Database Requirements

The component expects these tables:
- `dares` - With all fields as defined in dares.txt
- `categories` - With id and name fields
- `users` - For authentication
- `user_sessions` - For session management

## Next Steps

1. **Test the functionality** with the steps above
2. **Set up proper authentication** in your React app
3. **Add error boundary** components for better error handling
4. **Add loading states** for better UX
5. **Add form validation** on the frontend side

The dare creation should now work correctly with your PostgreSQL database!
