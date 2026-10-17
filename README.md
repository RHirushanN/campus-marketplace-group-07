# Campus Marketplace 🎓🛒

A safe, student-focused, peer-to-peer e-commerce marketplace web application designed for university campuses. Built with React Native for Web / Expo, TypeScript, and Google Firebase, this platform enables students to buy, sell, bookmark, and directly chat about second-hand academic essentials (textbooks, electronics, furniture, dorm supplies) with verified campus meetups.

---

## 👥 Group Members

| Name | Role | Student ID |
| :--- | :--- | :--- |
| **Hirushan Nimnada** | `2023/CSC/059` |
| **Nayanajith Edirisinghe** | `2023/CSC/084` |
| **Sajitha Nethmin** | `2023/CSC/021` |
| **T.M.T.H.Thennakoon** | `2023/CSC/070` |
| **D.M.K.Sewwandi** | `2023/CSC/015` |

---

## 📌 Project Description

### Problem Statement
University students frequently need to purchase textbooks, electronics, and dorm supplies at the beginning of each semester and offload them upon course completion. Public platforms such as Facebook Marketplace, Craigslist, or general classified sites lack university-specific trust, suffer from scam risks, and do not coordinate safe physical on-campus meetup points.

### Solution
**Campus Marketplace** addresses this problem by providing a closed-loop, campus-tailored marketplace. It facilitates secure student authentication, intuitive multi-criteria search and price filtering, a dedicated listing creation workflow, instant buyer-seller messaging, bookmarking/saved lists, and a personalized seller dashboard featuring real-time "Mark as Sold" lifecycle tracking.

---

## 🚀 Features Implemented

1. **Authentication & Student Profile Management**
   - Seamless Sign Up & Sign In flows with university email validation.
   - Firebase Authentication with persistent session management (`browserLocalPersistence`).
   - Student profile view with custom avatar badges, contact information, and meetup preferences.

2. **Explore Feed & Item Discovery**
   - Clean, modern card-grid feed displaying active campus listings.
   - Real-time text search across listing titles and descriptions.
   - Category filtering (All items, Textbooks, Furniture, Tech, Fashion).
   - Maximum price filtering chips ($50, $100, $250, $500) for budget-conscious students.

3. **Listing Details & Safety Reporting**
   - Rich modal view showcasing full item photo, condition, description, and designated campus meetup location.
   - Quick "Message Seller" direct link.
   - Community safety listing reporting tool (`Report listing`).

4. **Favorites / Saved Shortlist**
   - Instant one-tap bookmarking using heart toggle icons on cards or within listing details.
   - Dedicated "Saved" tab to view, inspect, or remove shortlisted items.

5. **Direct Buyer ↔ Seller Messaging System**
   - Automated creation of dedicated chat threads tied to specific marketplace listings.
   - Custom real-time message composer replacing static default templates.
   - Conversation list showing seller details, item reference, and message timestamps.

6. **Listing Creation (`+ Sell`) Form**
   - Comprehensive form with client-side validation for Title, Price, Category, Condition, Description, and Meetup Location.
   - Image URL support with instant preview.
   - Automatic integration with local storage and Cloud Firestore.

7. **Seller Dashboard & "Mark as Sold"**
   - Dynamic dashboard counters displaying: **Total Listings**, **Active Items**, **Sold Items**, and **Saved Bookmarks**.
   - "My Listings" management view with one-click **"Mark as Sold"** action.
   - Live counter synchronization to reflect inventory changes immediately.

8. **Mobile-Responsive UI/UX**
   - Polished responsive layouts adapting cleanly between mobile screens and desktop monitors.
   - Clean iconography, custom tab navigation bar, and accessible touch targets.

---

## 🛠️ Technologies Used

- **Frontend Framework:** React Native (Web) / Expo with TypeScript (`App.tsx`)
- **Styling & Layout:** React Native `StyleSheet`, Flexbox responsive grid layout
- **Backend & Cloud Database:** 
  - **Firebase Authentication:** Secure email/password login and session management
  - **Cloud Firestore:** Real-time database for storing listings, user profiles, and chat conversations
- **State Management:** React hooks (`useState`, `useEffect`, `useMemo`) combined with fallback local storage (`window.localStorage`) for offline resiliency
- **Icons & Assets:** Vector graphics, Expo Status Bar, custom SVG/embedded icons
- **Version Control:** Git & GitHub

---

## 👥 Team Member Contributions


## Hirushan Nimnada:

Project architecture, repository coordination, and Git workflow setup.
Integration of Firebase Authentication and Cloud Firestore.
Implementation of the Seller Dashboard stat calculation engine (Total, Active, Sold, Saved).
Overall code merging, UI/UX polish, bug fixes, and video demonstration.

## Nayanajith Edirisinghe:

Designed and implemented the Authentication flow (Sign In and Sign Up tabs).
Form validation for student email formats and passwords.
Implemented the Profile page with user settings, avatar generation, and safe meetup preferences.

## Sajitha Nethmin:

Developed the Explore page feed and responsive listing card layouts.
Built the multi-criteria search bar and category filter chips (Textbooks, Furniture, Tech, Fashion).
Implemented the maximum price filter chips (50,50,100, 250,250,500).

## T.M.T.H.Thennakoon:

Created the detailed Listing modal view with condition ratings, descriptions, and meetup locations.
Implemented the Favorites/Saved bookmarking system with live heart toggles and the dedicated "Saved" tab.
Integrated the "Report listing" community safety modal and reporting handler.

## D.M.K.Sewwandi:

Developed the direct Buyer ↔ Seller Messaging system and chat thread header linking to the item.
Built the custom message composer and real-time conversation synchronization.
Implemented the "Sell an item" form validation and the "Mark as Sold" lifecycle state updates.
