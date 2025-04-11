# project_proposal

# 🏡 HouseFinder – Smart House Listing App

**HouseFinder** is a web-based application designed to simplify the process of finding or listing rental houses, especially for individuals relocating to new areas in Kenya. The app allows users to explore available properties, post listings, and directly message property owners or agents securely.

---

## 🚀 Features

- 🔍 **Search & Filter Listings** – Easily search houses by location, price range, type, and amenities.
- 🏠 **Post New Listings** – Registered users can add property details, images, and contact info.
- ✉️ **Secure Messaging** – Users can directly message landlords/agents within the app.
- ✅ **Verified Listings** – Admin moderation ensures all posted properties are authentic.
- 🛡️ **User Authentication** – Secure login & registration system.
- 📍 **Location Integration** – View property locations via embedded map services.
- 📷 **Image Upload Support** – Add multiple images per property.
- 📱 **Mobile Responsive** – Fully responsive interface for desktop and mobile users.
---

## 🛠️ Tech Stack

| Frontend                 | Backend          | Database       | Others             |
|-------------------------|--------------=----|----------------|--------------------|
| React, Tailwind with CSS| Node.js / Express | PostgreSQL     | JWT Auth, Cloudinary (for images), Socket.IO (for chat), Google Maps API |

---
## 🔐 Security Measures

- Role-based access control for admin, agents, and users.
- Data sanitization & input validation to prevent XSS/SQL injection.
- Encrypted passwords using `bcrypt`.
- JWT-based secure session management.
- End-to-end encryption planned for direct messaging.

----

## ⚙️ Installation & Setup

1. **Clone the repository**
      ```bash
git clone https://github.com/caleb-odinga/project-proposal.git
cd housefinder-app
2. Install dependencies 
     '''''bash 
      npm install 
3. setup .env 
    VITE_DATABASE_URL=postgresql://postgres:12345678@localhost:5432/house_app
    VITE_SESSION_SECRET=your-secure-session-secret
    VITE_API_URL=http://localhost:3000/api
4. Run the application 
    npm run dev


************************
🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

📄 License
This project is open-source under the MIT License.
