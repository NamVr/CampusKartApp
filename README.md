# CampusKart - The All-in-One Campus Delivery Platform

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?logo=vite)](https://vitejs.dev/)

**CampusKart** is a modern, full-stack, hyper-local e-commerce platform designed specifically for university and college campuses. It connects students with on-campus vendors for food, laundry, stationery, and groceries, creating a seamless and efficient delivery ecosystem.

The platform features distinct user roles (Student, Merchant, Admin), real-time order tracking, a comprehensive review system, and a beautiful, responsive UI built for a modern web experience. It is also a fully-featured Progressive Web App (PWA), allowing for installation on mobile devices and offline access.

---

## 🚀 Key Features

CampusKart is divided into three primary user experiences:

### 👨‍🎓 For Students (Users)

- **Store Discovery:** Browse a curated list of on-campus stores, filterable by categories like Food, Laundry, Stationery, and Grocery.
- **Detailed Store View:** View store-specific information, including menus, delivery times, ratings, and authentic user reviews.
- **Shopping Cart:** A persistent cart to add and manage items from a single store.
- **Seamless Checkout:** Place orders and specify a campus delivery point (e.g., "Hostel Alpha, Wing B").
- **Live Order Tracking:** A beautiful stepper UI shows the real-time status of an order: `Pending` -> `Preparing` -> `Out for Delivery` -> `Delivered`.
- **Order History:** Access a complete history of all past and active orders.
- **Review System:** Rate and review stores after an order is delivered to share experiences with the campus community.
- **Profile Management:** Manage saved campus delivery points and view personal order statistics.
- **Favorites:** Mark stores as favorites for quick access.
- **Global Search:** A powerful search bar to find specific stores or menu items across the entire platform.
- **PWA Functionality:** Install CampusKart on your phone's home screen for an app-like experience and offline browsing capabilities.

### 🏪 For Merchants (Store Owners)

- **Self-Service Registration:** A simple form for new vendors to register their store on the platform.
- **Merchant Dashboard:** A dedicated dashboard to manage all aspects of their digital storefront.
- **Real-time Order Management:** View and manage incoming orders as they happen, with live updates.
- **Status Updates:** Update order statuses with a single click, which is instantly reflected for the customer.
- **Inventory Management:** Easily add, edit, and delete menu items.
- **Store Settings:** Update store details like name, description, cover image, and estimated delivery time.
- **Business Analytics:** View key performance indicators like total revenue, active orders, and total orders fulfilled.

### 👑 For Admins

- **Platform-wide Oversight:** An admin dashboard with a complete overview of all platform activity.
- **Master Order View:** See and manage all orders from every store.
- **Store Management:** Edit any store's details, including its menu items, as a super-user.
- **Status Override:** The ability to manually update or cancel any order on the platform if needed.

---

## 🛠️ Tech Stack

The project is built with a modern, scalable, and type-safe technology stack.

### Frontend

- **Framework:** **React** (v18) with **Vite** for a blazing-fast development experience.
- **Language:** **TypeScript** for robust type-safety and improved developer experience.
- **Routing:** **React Router DOM** for client-side routing.
- **State Management:** **React Context API** for managing global state like authentication (`AuthContext`) and the shopping cart (`CartContext`).
- **Animations:** **Framer Motion** for fluid, performant UI animations and page transitions.
- **UI Components:** A custom-built component library styled with Tailwind CSS.
- **Icons:** **Lucide React** for a beautiful and consistent set of icons.
- **Notifications:** **Sonner** for elegant and non-intrusive toast notifications.
- **Progressive Web App (PWA):** **Vite PWA Plugin** to enable service workers, caching, and "Add to Home Screen" functionality.

### Backend (BaaS)

- **Platform:** **Google Firebase**
  - **Database:** **Cloud Firestore** as the primary NoSQL database for storing users, stores, orders, reviews, etc. It's used with real-time listeners (`onSnapshot`) for live data synchronization.
  - **Authentication:** **Firebase Authentication** for handling user registration, login, and session management.
  - **Deployment:** Designed to be deployed on **Firebase Hosting**.

### Styling

- **CSS Framework:** **Tailwind CSS** for a utility-first styling workflow that enables rapid and consistent UI development.

---

## ⚙️ Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

- Node.js (v18 or higher)
- `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/campuskart.git
cd campuskart
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Firebase

1.  Go to the Firebase Console and create a new project.
2.  In your new project, go to **Project Settings** > **General**.
3.  Under "Your apps", click the web icon (`</>`) to register a new web app.
4.  Give it a nickname (e.g., "CampusKart Web") and click "Register app".
5.  You will be given a `firebaseConfig` object. You'll need these values.
6.  In the Firebase Console, navigate to **Build** > **Firestore Database** and create a new database in **test mode**.
7.  Navigate to **Build** > **Authentication** and enable the sign-in providers you want to use (e.g., Email/Password, Google).

### 4. Configure Environment Variables

Create a `.env` file in the root of the project and add your Firebase configuration keys:

```env
# Firebase Config Keys from your Firebase project settings
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Optional: For future AI features
GEMINI_API_KEY="your-gemini-api-key"
```

### 5. Run the Development Server

```bash
npm run dev
```

The application should now be running on `http://localhost:5173`.

### 6. Seed Initial Data (Optional but Recommended)

The application includes a data seeding function to populate your Firestore database with sample stores and menu items.

1.  After logging in for the first time, you can trigger this function.
2.  In `src/services/firebaseService.ts`, you can temporarily export and call `firebaseService.seedData()` from a component like `App.tsx` to run it once.

```typescript
// Example: In App.tsx
import { useEffect } from 'react';
import { firebaseService } from './services/firebaseService';

function App() {
  useEffect(() => {
    // This will run once on app load. Remove after seeding.
    // firebaseService.seedData();
  }, []);

  // ... rest of the component
}
```

---

## 📂 Project Structure

The `src` directory is organized to maintain a clean and scalable codebase.

```
src/
├── assets/         # Static assets like images and fonts
├── components/     # Reusable React components (e.g., OrderStepper, PWAPrompt)
├── context/        # React Context providers (AuthContext, CartContext)
├── lib/            # Core library configurations (firebase.ts)
├── pages/          # Top-level page components for each route
├── services/       # Business logic and API interactions (firebaseService.ts)
├── styles/         # Global CSS styles
├── types.ts        # Centralized TypeScript type definitions
└── App.tsx         # Main application component with routing
```

---

## 🧠 Architectural Decisions & Edge Cases

- **Real-time by Default:** The application heavily relies on Firestore's `onSnapshot` listeners for live data. This ensures that the UI for both customers and merchants is always up-to-date without needing manual refreshes, which is critical for order management.

- **Centralized Firebase Logic:** All interactions with Firebase are abstracted into the `firebaseService.ts` file. This makes components cleaner (as they don't contain raw Firebase calls) and makes it easier to manage and debug data flow.

- **Robust Error Handling:** The `handleFirestoreError` utility provides structured error logging, capturing the operation type, document path, and authenticated user's state. This is invaluable for debugging issues in a production environment.

- **Atomic Operations:**
  - **Batch Writes (`writeBatch`):** Used for operations that need to succeed or fail together, such as in `registerMerchant`, where both the `stores` and `users` collections are updated atomically.
  - **Transactions (`runTransaction`):** Used in `addReview` to safely read and update a store's rating and review count. This prevents race conditions where multiple users reviewing at the same time could lead to inconsistent data.

- **Role-Based Access Control (RBAC):** The `useAuth` hook provides a centralized way to determine the current user's role (`user`, `merchant`, `admin`). This is used throughout the application to conditionally render UI and control access to features like the Merchant and Admin dashboards.

- **Data Integrity & Security:** Fields like `merchantId` and `userId` are intentionally denormalized and added to documents like `orders` and `menuItems`. This is crucial for writing effective Firestore Security Rules, ensuring that a merchant can only modify their own store's data.

- **Graceful Data Migration:** The `MerchantDashboard` contains a `useEffect` hook that checks if a store document has a `merchantId`. If not, it updates it. This is a simple but effective pattern for applying schema changes to existing documents without manual intervention.

---

## 🌟 Future Scope

- Implement a real-time chat feature between users and merchants.
- Add push notifications for order status updates.
- Integrate a payment gateway for online payments.
- Develop a native mobile app with React Native for an even better user experience.
- Build out more advanced analytics for merchants.

---

Happy Hacking! 🚀