<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BloodLife Karnataka — A Complete Guide for Beginners

Welcome to **BloodLife Karnataka**! If you are new to this project, don't worry—this README will explain everything to you in plain English. 

BloodLife Karnataka is an intelligent, digital bridge that constantly monitors the blood supply network. It unites **Blood Donors**, **Blood Banks**, and **Hospitals** in real time. Instead of frantically calling people during an emergency, hospitals and patients can broadcast their need on this platform. The platform's built-in AI will instantly figure out who the absolute best donors are nearby and notify them.

---

## 🎯 What exactly does this project do?

Imagine an Uber or Swiggy, but for life-saving blood donations.
- **For a regular person (Donor/User):** You register, upload your ID and Medical history for verification. Once approved, you can see live emergency requests near you, donate blood, and earn "Impact Points" and digital certificates (achievements).
- **For a Blood Bank:** You get a dashboard to exactly track how much `A+`, `O-`, etc., blood you currently have. This updates everywhere instantly.
- **For the Admin:** You manage the safety of the platform. You verify user IDs, ensure blood banks are legitimate, and keep the ecosystem secure.

---

## 🏗️ The Tech Stack (What we used and *Why*)

Here are the tools used to build this project and why we chose them:

### 1. Frontend (The User Interface)
* **React 19:** The core language/library. It allows us to build interactive web pages organized into distinct "components" (like LEGO blocks).
* **Vite:** A build tool. React needs to be compiled into standard web files. Vite does this incredibly fast so developers don't have to wait.
* **TypeScript:** Instead of regular JavaScript, we use TypeScript. It acts as a spell-checker for our code, making sure our data (like user profiles or hospital locations) is passed around correctly without crashing.
* **Tailwind CSS:** For styling. Instead of writing long messy CSS files, Tailwind lets us style buttons and cards beautifully by just applying class names like `bg-rose-600 rounded-2xl`.
* **Lucide React:** Provides all the clean, modern icons you see throughout the app.

### 2. Backend & Database
* **Firebase (Firestore & Auth):** We don't have a traditional server. Google's Firebase handles everything. 
  * **Auth** handles secure logins (Email & Passwords, Google Login).
  * **Firestore** is our database. It's a "NoSQL real-time" database, meaning when a Blood Bank updates its stock, the map updates instantly for everyone else without refreshing the page.

### 3. Maps & AI
* **Leaflet & OpenStreetMap:** Creating the live map. It’s free, highly customizable, and tracks users, blood banks, and emergencies using latitude and longitude markers.
* **Google Gemini AI SDK:** The "brain" of the app.
  * It powers the **Smart Donor Matching**: When someone needs `A-` blood urgently, Gemini looks at nearby donors, their blood type, and when they last donated, and returns the top matches.
  * It powers the **Chatbot**: An always-on assistant using the Gemini 1.5/2.0 Flash models to answer questions about health and donation rules.

---

## 📂 Project Structure (Where is everything?)

If you open the project folder, here is what you should care about:

| Folder / File | What is it for? |
|--------------|----------------|
| **`App.tsx`** | The heart of the app. It handles routing (which page to show) and Auth wrappers (ensuring only logged-in people see certain pages). |
| **`types.ts`** | The rulebook. This tells TypeScript exactly what a `User`, a `BloodBank`, or an `EmergencyRequest` looks like (e.g., a User must have a `name`, `email`, and `impactScore`). |
| **`/components/`** | The building blocks of the UI. This is where the actual pages and features live. |
| &nbsp;&nbsp;&nbsp;&nbsp; ├─ `LiveMap.tsx` | The full-screen interactive Leaflet map. |
| &nbsp;&nbsp;&nbsp;&nbsp; ├─ `EmergencyPanel.tsx` | The page where users request urgent blood. |
| &nbsp;&nbsp;&nbsp;&nbsp; ├─ `AdminPanel.tsx` | The admin dashboard for approving users. |
| &nbsp;&nbsp;&nbsp;&nbsp; └─ `ChatBot.tsx` | The floating chat bubble in the corner. |
| **`/services/`** | Where the app talks to the outside world (Database and AI). |
| &nbsp;&nbsp;&nbsp;&nbsp; ├─ `firestoreService.ts` | Code to fetch/save data from Firebase. |
| &nbsp;&nbsp;&nbsp;&nbsp; └─ `geminiService.ts` | Code that sends prompts to Google Gemini AI. |
| **`/lib/`** | Helper utilities. For example, `auth.ts` handles login/logout scripts. |

---

## 🌟 Deep Dive: How the Core Features Work

### 1. Registration and Admin Approval Workflow
When a new user signs up, their account state is `PENDING`. They are required to upload an ID Proof and a Medical Report. 
* They are locked in a "Pending Screen" until an Admin reviews them.
* Admins open `/admin`, view the medical reports, and click "Approve". 
* The user's status becomes `APPROVED`, and they gain access to the map.

### 2. The AI Emergency Matching
When a hospital needs blood:
1. They go to the **Emergency Panel** and select the needed blood group.
2. The app fetches all available donors from Firebase.
3. This list is sent securely to **Google Gemini AI** hidden in the background.
4. Gemini writes a JSON response predicting the best matches, prioritizing universal donors (like `O-`) or exact matches, calculating distance, and checking if the user is healthy enough to donate. 

### 3. Gamification (The Impact Portfolio)
To encourage people to donate frequently, the app tracks an **Impact Score**.
Every donation logged in the `DonationHistory.tsx` component increases this score. When a user crosses specific thresholds (e.g., 200 points), the app unlocks stylish **Digital Certificates** validating their heroism, which they can preview and show off.

---

## 🚀 How to Run the App Locally on Your Machine

If you want to run this code on your own laptop, follow these simple steps:

### Step 1: Install Dependencies
Open your terminal (Command Prompt/Mac Terminal), go to this exact folder, and tell Node.js to download all the required packages:
```bash
npm install
```

### Step 2: Set Up Your Keys
This app relies on Google Gemini and Firebase. You need API keys for them to work.
Create a new file called `.env.local` directly inside the main folder. Fill it out like this:
```env
# Get this from Google AI Studio
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Get these from your Firebase Console when setting up a Web App
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 3: Run the App
Type this in your terminal to start the local development server:
```bash
npm run dev
```
Open your web browser and navigate to `http://localhost:3000`. 

### Step 4: Seed the Database (Optional)
If you just logged in and the map feels empty, you need data to play with.
1. Make sure you register a user with Admin privileges (or set their role to `ADMIN` inside your Firebase Console).
2. Go to the Admin Panel and click the red **SEED DATABASE** button.
3. This automatically creates 200 fake donors, 20 blood banks, and active requests so you can test all the features!
