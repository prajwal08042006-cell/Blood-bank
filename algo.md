# 🧮 Algorithms & Core Logic — BloodLife Karnataka

This document lists every algorithm and logical pattern used in this project, explains **why** it exists, and breaks down **how** it works step by step.

---

## 1. AI-Powered Donor Matching Algorithm

**File:** `services/geminiService.ts` → `getAiDonorMatching()`

### Why it's needed
When a hospital broadcasts an emergency blood request, blind-calling random donors wastes critical time. This algorithm uses Google Gemini AI to intelligently rank all available donors and return the **best matches first**.

### How it works
1. The system fetches all available donors from Firestore whose `isAvailable` flag is `true`.
2. A structured prompt is sent to **Gemini 1.5 Flash** containing:
   - The **requested blood group** (e.g., `A-`)
   - The **hospital's GPS coordinates**
   - The **full list of available donors** (with their blood group, location, last donation date, and impact score)
3. Gemini evaluates each donor on **four weighted factors**:

| Factor | Why it matters |
|--------|---------------|
| **Blood Group Compatibility** | `O-` is a universal donor; `AB+` is a universal recipient. The AI prioritises exact matches, then compatible groups. |
| **Geographic Distance** | Closer donors can reach the hospital faster. |
| **Last Donation Date** | Donors must wait ≥ 90 days between donations for safety. Anyone who donated recently is deprioritised. |
| **Impact Score** | Higher-scoring donors are more reliable and experienced. |

4. Gemini returns a **JSON array** with `{ donorId, score (0–100), reason }` using structured output (schema-enforced).
5. The app maps these results back to the full donor profiles and sorts them by score descending.
6. **Fallback:** If the API key is missing or the call fails, mock data is generated locally with random scores between 70–100.

---

## 2. Blood Group Compatibility Matrix

**Used in:** `services/geminiService.ts` (sent as context to AI)

### Why it's needed
Not all blood types can be safely transfused to all recipients. Using incompatible blood can be fatal.

### How it works
The standard ABO + Rh compatibility rules are encoded in the AI prompt:

```
Donor → Recipient compatibility:

O-  → Can donate to ALL groups (Universal Donor)
O+  → Can donate to O+, A+, B+, AB+
A-  → Can donate to A-, A+, AB-, AB+
A+  → Can donate to A+, AB+
B-  → Can donate to B-, B+, AB-, AB+
B+  → Can donate to B+, AB+
AB- → Can donate to AB-, AB+
AB+ → Can donate to AB+ only (Universal Recipient for receiving)
```

The AI uses this knowledge to score exact matches highest, followed by compatible donors, and deprioritise incompatible ones.

---

## 3. Donation Cooldown Eligibility Algorithm

**File:** `components/DonationHistory.tsx`

### Why it's needed
Medical guidelines require a **minimum 90-day gap** between whole blood donations to allow the donor's body to recover. The app must prevent premature donations.

### How it works
```
COOLDOWN_DAYS = 90

1. Get the user's `lastDonated` date from their profile
2. Calculate: daysSinceLastDonation = today - lastDonatedDate (in days)
3. isEligible = daysSinceLastDonation >= 90
4. daysRemaining = max(0, 90 - daysSinceLastDonation)
5. progress = min(100, (daysSinceLastDonation / 90) * 100)
```

- If `lastDonated` is null (never donated), the user is immediately eligible.
- The `progress` percentage drives a visual progress bar in the UI showing how close the user is to being eligible again.

---

## 4. Impact Score & Gamification System

**File:** `components/DonationHistory.tsx`, `types.ts`

### Why it's needed
Gamification incentivises repeat donations. By assigning points and unlocking achievements, donors feel rewarded, which increases retention and participation.

### How it works

**Points accumulation:**
- Each donation logged in `donationHistory[]` has a `points` field (typically 50–150 points).
- The total of all points = the user's `impactScore`.
- Document verification grants bonus points (+150).

**Badge unlock logic:**
```
Badges = [
  { name: "State Guardian",     unlock: Identity Verified          },
  { name: "Bengaluru Lifeline", unlock: impactScore >= 100         },
  { name: "Emergency Ace",      unlock: impactScore >= 300         },
]

For each badge:
  isUnlocked = (badge.minScore > 0 AND impactScore >= badge.minScore)
               OR (badge is identity badge AND user has verified ID)
```

**Certificate unlock logic:**
```
Certificates = [
  { title: "Commendable Contributor", requirement: 200 points   },
  { title: "Life Guardian",           requirement: 3 donations   },
  { title: "State Health Ambassador", requirement: 1000 points   },
]

For each certificate:
  currentValue = (reqType == 'score') ? impactScore : donationCount
  isUnlocked   = currentValue >= requirement
  progress     = min(100, (currentValue / requirement) * 100)
```

Unlocked certificates show a download button; locked certificates show a progress bar.

---

## 5. Real-Time Inventory Simulation

**File:** `App.tsx` → `InventoryManager` component

### Why it's needed
Blood bank stock levels change constantly. This algorithm simulates real-time fluctuations so the inventory dashboard feels alive during demos.

### How it works
```
Every 8 seconds:
  1. Pick a random blood group from [A+, A-, B+, B-, AB+, AB-, O+, O-]
  2. Generate a random decision:
     - 30% chance: increment stock by 1 (new donation received)
     - 70% chance: decrement stock by 1 (blood unit used)
  3. Clamp the value: stock = max(0, stock + change)
  4. Update the UI
```

Stock levels below 10 units trigger a **red critical warning** state in the UI.

---

## 6. Geolocation Detection & Fallback

**File:** `App.tsx` → `AuthProvider`

### Why it's needed
The Live Map and Emergency Panel need the user's real-time GPS position to show nearby donors, blood banks, and calculate distances.

### How it works
```
1. Check if browser supports Geolocation API
2. Request permission: navigator.geolocation.getCurrentPosition()
3. On SUCCESS:
   → Store { lat, lng, address: "Detected Live Location" }
4. On DENIED / ERROR:
   → Fallback to Bengaluru city centre: { lat: 12.9716, lng: 77.5946 }
```

This ensures the app always has a valid location, even if the user blocks location access.

---

## 7. Account Approval State Machine

**File:** `App.tsx`, `components/AdminPanel.tsx`, `types.ts`

### Why it's needed
To prevent fraudulent registrations, every new account must be manually reviewed and approved by an Admin before gaining access to the system.

### How it works
```
States: PENDING → APPROVED
                → REJECTED

Registration Flow:
  1. User signs up → accountStatus = 'PENDING'
  2. User sees "Pending Approval" screen (cannot access any feature)
  3. Admin opens Admin Panel → sees list of PENDING users
  4. Admin reviews uploaded documents (ID Proof, Medical Certificate)
  5. Admin clicks:
     - "Approve" → accountStatus = 'APPROVED' → User gains full access
     - "Reject"  → accountStatus = 'REJECTED' → User sees rejection notice

Route Protection:
  if (user.accountStatus !== 'APPROVED') → render PendingApprovalScreen
  if (allowedRoles && !allowedRoles.includes(user.role)) → redirect to /
```

---

## 8. Role-Based Access Control (RBAC)

**File:** `App.tsx` → `ProtectedRoute`, `HomeDispatcher`

### Why it's needed
Different users need different dashboards. A regular donor should not see admin controls, and a blood bank should not see emergency request forms.

### How it works
```
Three roles: USER | BLOOD_BANK | ADMIN

Route permissions:
  /map        → USER, BLOOD_BANK, ADMIN
  /emergency  → USER only
  /history    → USER only
  /admin      → ADMIN only
  /inventory  → BLOOD_BANK only

Home Dispatcher logic:
  if role == ADMIN      → redirect to /admin
  if role == BLOOD_BANK → redirect to /inventory
  if role == USER       → redirect to /map
```

Each route is wrapped in a `<ProtectedRoute allowedRoles={[...]}>` component that checks the user's role before rendering.

---

## 9. AI Chatbot Conversation Algorithm

**File:** `services/geminiService.ts` → `getChatResponse()`

### Why it's needed
Users often have questions about donation eligibility, nearby blood banks, or health concerns. An always-available AI assistant provides instant, empathetic answers.

### How it works
```
1. User types a message in the ChatBot widget
2. Message + conversation history is sent to Gemini 1.5 Flash
3. System prompt instructs the AI:
   "You are BloodLife AI assistant. You help users find blood donors,
    explain blood donation eligibility, and provide emergency guidance.
    Be empathetic, professional, and clear."
4. Gemini responds with context-aware, medically informed guidance
5. Response is displayed in the chat bubble

Fallback (no API key):
  → Return a random response from a pre-defined list of helpful messages
```

---

## 10. Nearby Hospital Discovery (AI + Maps Grounding)

**File:** `services/geminiService.ts` → `findNearbyHospitals()`

### Why it's needed
During emergencies, users need to quickly find hospitals with emergency departments near their current location.

### How it works
```
1. User's GPS coordinates are passed to Gemini 2.0 Flash
2. The Google Maps tool is enabled via: config.tools = [{ googleMaps: {} }]
3. Gemini uses real-time Maps data to find 3 major hospitals nearby
4. Returns hospital names, distances, and grounding metadata (source citations)

Fallback (no API key):
  → Returns hardcoded: Apollo Hospital (2km), Manipal Hospital (3.5km),
     Victoria Hospital (5km)
```

---

## 11. File Upload Size Validation

**File:** `components/Login.tsx` → `FileUploadBox`

### Why it's needed
Firebase Storage free tier has limits, and large files slow down the registration process. A 1MB cap ensures fast uploads and stays within budget.

### How it works
```
MAX_FILE_SIZE = 1MB (1,048,576 bytes)

On file selection:
  1. User picks a file from their device
  2. Check: file.size > MAX_FILE_SIZE?
     - YES → Show error: "File exceeds 1MB limit (actual size shown)"
            → Clear the file input
            → Do NOT proceed
     - NO  → Clear any previous error
            → Accept the file and show preview with filename + size

On form submission:
  1. Upload file to Firebase Storage: /user-documents/{userId}/{timestamp}_{filename}
  2. Get back a download URL
  3. Store only the URL string in the Firestore user document (not the file itself)
```

---

## 12. Database Seeding Algorithm

**File:** `services/seedService.ts`

### Why it's needed
For demonstrations and testing, the app needs realistic sample data — 200 donors spread across Karnataka, 20 blood banks, and active emergency requests.

### How it works
```
1. Clear all existing documents from 'users', 'bloodBanks', 'emergencyRequests' collections
2. Generate 200 donor profiles:
   - Random names, emails, phone numbers
   - Random blood groups distributed across all 8 types
   - GPS coordinates scattered across Karnataka (Bengaluru, Mysuru, Hubli, etc.)
   - Random impact scores and donation histories
   - accountStatus = 'APPROVED' (so they appear on the map immediately)
3. Generate 20 blood bank profiles:
   - Real Karnataka city names and hospital-style names
   - Stock levels randomised per blood group
4. Generate emergency requests with ACTIVE status
5. Create 1 Admin account with pre-set credentials
```
