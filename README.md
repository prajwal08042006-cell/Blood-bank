<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BloodLife Karnataka — AI-Powered Emergency Blood Management

> An intelligent, real-time platform that connects **Donors**, **Blood Banks**, and **Hospitals** across Karnataka using AI-driven matching, live maps, and gamified engagement.

---

## Table of Contents

1. [What This Project Does](#-what-this-project-does)
2. [Tech Stack](#️-tech-stack)
3. [Project Structure](#-project-structure)
4. [Core Features Deep Dive](#-core-features-deep-dive)
5. [Algorithms & Logic Reference](#-algorithms--logic-reference)
6. [Role-Based Access Control](#-role-based-access-control)
7. [Firebase Setup (REQUIRED)](#-firebase-setup-required)
8. [Running Locally](#-running-locally)
9. [Environment Variables](#-environment-variables)
10. [Database Seeding](#-database-seeding)
11. [Deployment](#-deployment)
12. [Troubleshooting](#-troubleshooting)
13. [Security Headers](#-security-headers)

---

## 🎯 What This Project Does

Think of it as an **Uber for life-saving blood donations**.

| Role | Experience |
|------|-----------|
| **Donor / User** | Register, upload ID and medical documents for verification. Once approved, see live emergency requests on an interactive map, donate blood, and earn Impact Points and digital certificates. |
| **Blood Bank** | Get a dedicated inventory dashboard to track stock levels (`A+`, `O-`, etc.) in real time with simulated fluctuations. |
| **Admin** | Manage the safety of the platform — review documents, verify user IDs, approve or reject accounts, and seed demo data. |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | Component-based UI framework |
| **Vite 6** | Fast dev server and build tool |
| **TypeScript 5.8** | Type-safe JavaScript |
| **Tailwind CSS** (CDN) | Utility-first styling |
| **Lucide React** | Icon library |
| **Recharts** | Analytics charts (Area, Pie) |
| **React Router DOM 7** | Client-side routing via `HashRouter` |

### Backend & Database
| Technology | Purpose |
|-----------|---------|
| **Firebase Auth** | Email/password authentication with email verification |
| **Cloud Firestore** | NoSQL real-time database for users, blood banks, emergency requests |
| **Firebase Storage** | Document uploads (ID proofs, medical certificates) |

### AI & Maps
| Technology | Purpose |
|-----------|---------|
| **Google Gemini 1.5 Flash** | AI donor matching and chatbot |
| **Google Gemini 2.0 Flash** | Hospital discovery with Maps grounding |
| **Leaflet + OpenStreetMap** | Interactive live map with custom markers |

---

## 📂 Project Structure

```
BloodLife-Karnataka/
├── App.tsx                    # Root — AuthProvider, routing, ProtectedRoute, HomeDispatcher
├── index.tsx                  # React entry point
├── index.html                 # HTML shell (Tailwind CDN, Leaflet CDN, custom marker CSS)
├── index.css                  # Global styles (Inter font, Tailwind directives)
├── types.ts                   # TypeScript interfaces: UserProfile, BloodBank, EmergencyRequest, DonorMatch
├── constants.tsx              # Mock data: CURRENT_USER, MOCK_DONORS, MOCK_BLOOD_BANKS, MOCK_REQUESTS
├── vite.config.ts             # Vite configuration (port 3000, path alias @/)
├── tsconfig.json              # TypeScript configuration (ES2022, bundler resolution)
├── vercel.json                # Security headers + CSP for Vercel deployment
├── metadata.json              # Project metadata (name, description, geolocation permission)
├── createAdmin.ts             # Utility script: create admin Firebase Auth account
├── fixAdmin.ts                # Utility script: fix admin UID mismatch between Auth and Firestore
│
├── lib/
│   ├── firebase.ts            # Firebase initialization (Auth, Firestore, Storage) with config validation
│   ├── auth.ts                # Auth functions: signUp, logIn, signOut, onAuthChange (with error handling)
│   └── logger.ts              # Dev-only logger utility (suppressed in production)
│
├── services/
│   ├── firestoreService.ts    # CRUD: users, blood banks, emergency requests, admin approval
│   ├── geminiService.ts       # AI: donor matching, hospital discovery, chatbot
│   ├── seedService.ts         # Database seeder: 200 donors, 20 blood banks, 1 admin
│   └── storageService.ts      # Firebase Storage: document upload with sanitized filenames
│
├── components/
│   ├── Login.tsx              # Multi-view login: User, Blood Bank, Admin, Registration, Email Verification
│   ├── Layout.tsx             # Sidebar navigation shell (role-aware, responsive)
│   ├── LiveMap.tsx             # Full-screen Leaflet map with Firestore markers
│   ├── EmergencyPanel.tsx     # Emergency blood request form + AI donor matching results
│   ├── AdminPanel.tsx         # Admin dashboard: approve/reject users, seed database
│   ├── DonationHistory.tsx    # Impact Portfolio: donation timeline, badges, digital certificates
│   ├── ChatBot.tsx            # Floating AI assistant powered by Gemini
│   ├── AnalyticsDashboard.tsx # State-level analytics with Recharts visualizations
│   └── OtpVerification.tsx    # 6-digit OTP input component (reusable)
│
└── public/
    └── favicon.svg            # App favicon
```

---

## 🌟 Core Features Deep Dive

### 1. Registration & Admin Approval Workflow

```
User signs up → accountStatus = 'PENDING'
    ↓
Upload ID Proof + Medical Certificate (max 1MB each)
    ↓
Email verification link sent via Firebase
    ↓
User verifies email → can log in
    ↓
Sees "Pending Approval" screen (locked out of features)
    ↓
Admin reviews documents in /admin panel
    ↓
Admin clicks Approve → accountStatus = 'APPROVED' → Full access
         or Reject  → accountStatus = 'REJECTED' → Rejection notice
```

**Two registration types:**
- **Donor**: Name, email, phone, blood group, ID proof, medical certificate
- **Blood Bank**: Facility name, license number, address, contact, blood bank license, NABL accreditation

### 2. AI-Powered Emergency Matching

When a user broadcasts an emergency blood request:
1. Selects the needed blood group and hospital location
2. The system fetches all available donors from Firestore
3. Sends the donor list + request details to **Gemini 1.5 Flash**
4. Gemini scores each donor (0–100) based on blood compatibility, distance, last donation date, and impact score
5. Results are displayed ranked by score with contact details

**Fallback**: If no Gemini API key is configured, mock data with random scores (70–100) is generated.

### 3. Interactive Live Map

- **Leaflet + OpenStreetMap** renders a full-screen map centered on user's GPS location
- **Three marker types**: Donors (rose), Blood Banks (blue), Emergency Requests (pulsing red)
- Clicking a marker shows entity details in a glassmorphism info card
- "Recenter" button snaps back to user's location
- Data loaded from Firestore on mount with loading skeleton

### 4. Gamification — Impact Portfolio

| Feature | Details |
|---------|---------|
| **Impact Score** | Accumulated from donation points (50–200 per donation) + 150 bonus for document verification |
| **Badges** | State Guardian (ID verified), Bengaluru Lifeline (100+ pts), Emergency Ace (300+ pts) |
| **Digital Certificates** | Commendable Contributor (200 pts), Life Guardian (3 donations), State Health Ambassador (1000 pts) |
| **Progress Bars** | Visual unlock progress for locked certificates |

### 5. Blood Bank Inventory Dashboard

- Grid of all 8 blood groups with real-time stock counts
- **Simulated fluctuations**: every 8 seconds, a random blood group changes by ±1 unit
- Critical warning (red) when stock falls below 10 units
- Sync button for manual refresh

### 6. AI Chatbot

- Floating chat bubble (bottom-right corner) available to all authenticated users
- Powered by **Gemini 1.5 Flash** with a system prompt focused on blood donation guidance
- Maintains conversation history within the session
- Fallback: random helpful responses when no API key is configured

### 7. Analytics Dashboard (Admin)

- Stat cards: Registered Donors, Active Requests, Monthly Donations, Response Time
- **Area Chart**: Weekly request vs. donation trends (Recharts)
- **User List**: Scrollable list of all registered donors
- Regional demand heatmap preview panel

---

## 🧮 Algorithms & Logic Reference

Full algorithm documentation is in [`algo.md`](./algo.md). Summary:

| # | Algorithm | File | Purpose |
|---|-----------|------|---------|
| 1 | AI Donor Matching | `geminiService.ts` | Gemini ranks donors by compatibility, distance, cooldown, impact score |
| 2 | Blood Compatibility Matrix | Gemini prompt context | ABO+Rh rules: O- universal donor, AB+ universal recipient |
| 3 | Donation Cooldown | `DonationHistory.tsx` | 90-day minimum gap between donations |
| 4 | Impact Score & Gamification | `DonationHistory.tsx` | Points accumulation, badge unlock, certificate progress |
| 5 | Inventory Simulation | `App.tsx` | Random ±1 stock change every 8 seconds |
| 6 | Geolocation Fallback | `App.tsx` | Browser GPS → fallback to Bengaluru (12.9716, 77.5946) |
| 7 | Account State Machine | `App.tsx`, `AdminPanel.tsx` | PENDING → APPROVED / REJECTED |
| 8 | RBAC | `App.tsx` | Route protection by role |
| 9 | AI Chatbot | `geminiService.ts` | Context-aware medical guidance |
| 10 | Hospital Discovery | `geminiService.ts` | Gemini 2.0 + Google Maps grounding |
| 11 | File Size Validation | `Login.tsx` | 1MB max upload limit |
| 12 | Database Seeding | `seedService.ts` | 200 donors + 20 blood banks + 1 admin across Karnataka |

---

## 🔐 Role-Based Access Control

```
Three roles: USER | BLOOD_BANK | ADMIN

Route permissions:
  /map        → USER, BLOOD_BANK, ADMIN
  /emergency  → USER only
  /history    → USER only
  /admin      → ADMIN only
  /inventory  → BLOOD_BANK only

Home Dispatcher:
  ADMIN      → redirects to /admin
  BLOOD_BANK → redirects to /inventory
  USER       → redirects to /map
```

Every route is wrapped in `<ProtectedRoute allowedRoles={[...]}>` which checks:
1. Is the user authenticated? → If not, redirect to `/login`
2. Is the account approved? → If not, show `PendingApprovalScreen`
3. Does the user have the right role? → If not, redirect to `/`

---

## 🔥 Firebase Setup (REQUIRED)

> **These steps are mandatory.** Without them you will see `400` errors from `identitytoolkit.googleapis.com` in the browser console.

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** → name it (e.g., `blood-bank`) → finish setup

### Step 2: Enable Authentication
1. In your Firebase project, go to **Build → Authentication**
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** provider
5. (Optional) Enable **Email link (passwordless sign-in)**

### Step 3: Add Authorized Domains
1. In **Authentication → Settings → Authorized domains**
2. Add your deployment domain (e.g., `your-app.vercel.app`)
3. `localhost` is added by default for development

### Step 4: Create a Firestore Database
1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred region

### Step 5: Enable Firebase Storage
1. Go to **Build → Storage**
2. Click **Get Started**
3. Choose **Start in test mode**

### Step 6: Register a Web App
1. In **Project Settings → General → Your apps**
2. Click the web icon (`</>`) to register a new web app
3. Copy the config values into your `.env.local` file

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ and npm
- A Firebase project (see above)
- (Optional) A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create `.env.local`
Create a `.env.local` file in the project root:
```env
# Firebase (REQUIRED — get from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini AI (OPTIONAL — AI features use mock data without this)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Start the Dev Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Step 4: Seed the Database (Optional)
1. Register with the admin email or set a user's role to `ADMIN` in Firestore Console
2. Navigate to `/admin` and click the red **SEED DATABASE** button
3. This creates 200 donors, 20 blood banks, and 1 admin account across Karnataka

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_GEMINI_API_KEY` | ❌ | Google Gemini API key (AI features fallback to mock data without this) |

---

## 🌱 Database Seeding

The seeder (`services/seedService.ts`) generates realistic Karnataka-centric data:

| Entity | Count | Distribution |
|--------|-------|-------------|
| **Donors** | 200 | 60% Bengaluru, 25% Mysuru, 15% other Karnataka cities |
| **Blood Banks** | 20 | Real hospital names across Bengaluru, Mysuru, Dharwad |
| **Admin** | 1 | Pre-configured with `APPROVED` status |

Each donor gets:
- Randomized name (male/female Karnataka names + surnames)
- Random blood group from all 8 types
- GPS coordinates jittered around real neighborhoods
- Verified documents (Aadhaar Card, Medical Certificate)
- 0–5 donation history entries with point values
- 85% availability rate

---

## 🚢 Deployment

### Vercel (Recommended)

The project includes a `vercel.json` with security headers and CSP rules.

```bash
npm run build    # Builds to dist/
```

Deploy via Vercel CLI or connect your GitHub repository.

**Important**: Add all `VITE_*` environment variables in Vercel's project settings.

### Build Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## 🔧 Troubleshooting

### 400 Errors from `identitytoolkit.googleapis.com`

**Symptom**: Multiple 400 errors in the browser console on page load.

**Cause**: Firebase Auth's Email/Password sign-in method is not enabled, or there are stale authentication tokens cached in the browser.

**Fix**:
1. Go to **Firebase Console → Authentication → Sign-in method**
2. Ensure **Email/Password** is **enabled**
3. Clear your browser's IndexedDB/localStorage for the site
4. Hard refresh the page (`Cmd+Shift+R` / `Ctrl+Shift+R`)

### "Firebase Auth is not configured" Error

**Cause**: Missing or incorrect Firebase environment variables.

**Fix**: Verify all `VITE_FIREBASE_*` values in `.env.local` match your Firebase Console → Project Settings.

### Empty Map / No Data

**Cause**: Firestore has no seeded data.

**Fix**: Log in as Admin → go to `/admin` → click **SEED DATABASE**.

### Gemini AI Returns Mock Data

**Cause**: `VITE_GEMINI_API_KEY` is missing or set to `PLACEHOLDER_API_KEY`.

**Fix**: Get a real API key from [Google AI Studio](https://aistudio.google.com/) and add it to `.env.local`.

### File Upload Fails

**Cause**: File exceeds the 1MB limit, or Firebase Storage is not enabled.

**Fix**: Ensure files are under 1MB, and that Firebase Storage is enabled in the Firebase Console.

---

## 🛡️ Security Headers

The `vercel.json` configures the following production security headers:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | Restricts script/style/connect sources to trusted domains |

---

## 📄 License

This project is private and not licensed for public distribution.
