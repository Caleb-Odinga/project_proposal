# House Hunting Application Documentation

## Overview

This house hunting application is designed for the Kenyan market, providing a platform for property listings, search functionality, and communication between tenants and property owners. It features a responsive design that works on desktop and mobile devices, with security measures in place to protect user data.

## Architecture

The application follows a full-stack JavaScript architecture:

- **Frontend**: React with Tailwind CSS, ShadCN UI components
- **Backend**: Express.js server
- **Storage**: In-memory data store (can be replaced with a PostgreSQL database)
- **Authentication**: Session-based with secure cookie storage

## Security Features

The application implements several security measures:

1. **Password Security**:
   - Passwords are hashed using bcrypt with a salt factor of 10
   - Password requirements and validation ensure strong passwords
   - Secure password change functionality with current password verification

2. **Protection Against Attacks**:
   - XSS (Cross-Site Scripting) protection with input sanitization
   - CSRF (Cross-Site Request Forgery) protection with SameSite cookies
   - Rate limiting to prevent brute force attacks
   - Content Security Policy (CSP) headers to prevent unauthorized resource loading

3. **Data Protection**:
   - Secure cookies with httpOnly flag to prevent client-side access
   - User data validation with Zod schemas
   - Permission checks for data access

## Key Features

### User Management
- User registration with password confirmation
- Secure login and session management
- Profile management with option to change password
- User roles (tenant, landlord, agent)

### Property Listings
- Browse and search properties
- Filter by location, price, property type, and features
- View detailed property information with images
- Add properties to favorites for registered users

### Messaging System
- Direct messaging between users
- Property-specific conversation threads
- Unread message notifications
- Message history retention

### Map Integration
- Property locations displayed on interactive maps
- Neighborhood information and insights
- Visual property browsing by location

### Responsive Design
- Works on desktop and mobile devices
- Adaptive layout based on screen size
- Touch-friendly interfaces for mobile users

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout the current user
- `GET /api/auth/me` - Get the current authenticated user

### Users
- `PATCH /api/users/profile` - Update user profile or change password

### Properties
- `GET /api/properties` - Get all properties with optional filters
- `GET /api/properties/:id` - Get a specific property by ID
- `POST /api/properties` - Create a new property (authenticated)
- `PATCH /api/properties/:id` - Update a property (owner only)
- `DELETE /api/properties/:id` - Delete a property (owner only)

### Favorites
- `GET /api/favorites` - Get user's favorite properties
- `POST /api/favorites` - Add a property to favorites
- `DELETE /api/favorites/:propertyId` - Remove a property from favorites

### Messages
- `GET /api/conversations` - Get user's conversations
- `GET /api/messages/:userId` - Get messages with a specific user
- `POST /api/messages` - Send a message
- `GET /api/messages/unread/count` - Get count of unread messages

### Neighborhoods
- `GET /api/neighborhoods` - Get all neighborhoods
- `GET /api/neighborhoods/:id` - Get a specific neighborhood

## Data Models

### User
- `id`: Unique identifier
- `username`: Unique username
- `password`: Hashed password
- `email`: Unique email address
- `fullName`: User's full name
- `phone`: Contact phone number (optional)
- `avatar`: Profile picture URL (optional)
- `role`: User role (tenant, landlord, agent)
- `bio`: User bio/description (optional)
- `language`: Preferred language code
- `createdAt`: Account creation timestamp

### Property
- `id`: Unique identifier
- `title`: Property title
- `description`: Detailed description
- `price`: Rent/sale price (in Kenyan Shillings)
- `propertyType`: Type of property
- `listingType`: For rent or sale
- `bedrooms`: Number of bedrooms
- `bathrooms`: Number of bathrooms
- `area`: Size in square meters
- `location`: City/neighborhood
- `address`: Full address
- `latitude`: Geographic coordinates
- `longitude`: Geographic coordinates
- `features`: Array of property features
- `images`: Array of image URLs
- `ownerId`: ID of the property owner
- `verified`: Verification status
- `createdAt`: Listing creation timestamp

### Favorite
- `id`: Unique identifier
- `userId`: User who favorited
- `propertyId`: Favorited property
- `createdAt`: When favorited

### Message
- `id`: Unique identifier
- `senderId`: Message sender
- `receiverId`: Message recipient
- `propertyId`: Related property (optional)
- `content`: Message text
- `read`: Read status
- `createdAt`: Timestamp

### Neighborhood
- `id`: Unique identifier
- `name`: Neighborhood name
- `city`: City name
- `description`: Area description
- `image`: Representative image
- `propertyCount`: Number of properties in area

## Mobile Responsiveness

The application is built with responsive design principles to ensure good user experience across device sizes:

- Fluid grid layout that adapts to screen dimensions
- Mobile-friendly navigation with hamburger menu on small screens
- Touch-optimized interface elements
- Responsive image loading for bandwidth optimization

## Browser Compatibility

The application has been tested and works on:
- Google Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile)
- Edge (desktop)

## Installation and Deployment

See the README.md file for detailed instructions on how to install, configure, and deploy the application.

## Future Enhancements

Planned features for future development:
- Real-time messaging with WebSockets
- Virtual property tours
- Advanced filtering and search
- Integrated payment system for rent/deposits
- Property review and rating system