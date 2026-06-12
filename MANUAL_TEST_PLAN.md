# ARBITARY Project - User Manual Test Suite

This document provides a comprehensive suite of manual test cases specifically customized for the **ARBITARY** gamified task management platform. It includes the general layout/template in Microsoft Word-compatible formats, allowing you to copy-paste tables directly into MS Word.

---

## 📋 General Test Case Layout (Template)

If you are creating new test cases, use this layout. Copy and paste this table directly into **Microsoft Word**; Word will automatically convert it into an editable, styled table.

### Blank Template Table

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-XXX-00** | *[Feature Area]* | *[Brief Title]* | 1. Step 1<br>2. Step 2<br>3. Step 3 | *[What should happen]* | `[ ] Success`<br>`[ ] Failure` | *[Provide details if failed]* |

---

## 🚀 Arbitary Project - Manual Test Cases

### 1. Authentication & Registration Module

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Authentication | User Signup with Credentials | 1. Open browser and navigate to `/signup`.<br>2. Enter a unique username, valid email (e.g., `test@example.com`), and strong password.<br>3. Click the **Register** button. | • Account is successfully created.<br>• User is redirected to `/login` or dashboard.<br>• Toast success message appears: *"Account created successfully!"*. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-AUTH-02** | Authentication | User Login with Credentials | 1. Navigate to `/login`.<br>2. Enter the registered email and password.<br>3. Click the **Sign In** button. | • User is successfully logged in.<br>• Session cookie/token is set.<br>• User is redirected to `/dashboard`.<br>• User profile stats (points, tier) are visible. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-AUTH-03** | Authentication | User Login with Incorrect Password | 1. Navigate to `/login`.<br>2. Enter a valid email but an incorrect password.<br>3. Click the **Sign In** button. | • Login fails.<br>• Error toast shows *"Invalid credentials"* or similar message.<br>• User remains on login page; password field is cleared. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-AUTH-04** | Authentication | OAuth Login (Google/Facebook) | 1. On `/login` page, click **Login with Google** or **Login with Facebook**.<br>2. Authenticate using a valid social account.<br>3. Redirect back to the application. | • User is authenticated and registered (if first time).<br>• Redirected to dashboard successfully.<br>• User info (profile photo, name) syncs. | `[ ] Success`<br>`[ ] Failure` | |

### 2. User Dashboard & Task Interaction

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DASH-01** | Dashboard | Claim Daily Login Streak | 1. Navigate to `/dashboard` for the first time today.<br>2. Click **Claim Daily Login** in the header or available tasks.<br>3. Note point changes and streak badges. | • Success toast appears showing points awarded (e.g., `+10 pts`).<br>• Streak badge increments (e.g., *"🔥 1-day streak"*).<br>• User points update dynamically in the top stats header.<br>• Button changes to *"Login claimed"*. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-DASH-02** | Dashboard | Pick up an Available Task | 1. In dashboard, select a task from the **Available Tasks** list.<br>2. Click **Pickup Task**.<br>3. Observe changes in dashboard tabs. | • Toast message *"Task picked up!"* appears.<br>• The task disappears from **Available Tasks**.<br>• The task is visible under the **In Progress** tab and appears in the sidebar. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-DASH-03** | Dashboard | Cancel an In-Progress Task | 1. Go to the **In Progress** tab or check the right sidebar.<br>2. Locate the active task and click **Cancel Task**.<br>3. Verify lists are updated. | • Success toast *"Task cancelled!"* appears.<br>• Task is removed from **In Progress** and sidebar.<br>• Task reappears under the **Available Tasks** tab. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-DASH-04** | Dashboard | Submit Task Proof (Text & Image) | 1. Go to the **In Progress** tab.<br>2. Click **Complete** or expand the task.<br>3. Enter a valid proof URL (e.g., `https://twitter.com/post/123`) or upload a screenshot.<br>4. Click **Submit Proof**. | • Toast *"Proof submitted! Pending verification"* appears.<br>• Task status updates to *"Pending Verification"**.<br>• Task moves to pending state and can no longer be edited/cancelled. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-DASH-05** | Dashboard | Claim Profile & Referral Rewards | 1. Locate **Profile Setup** or **Referral Code Claim** tasks.<br>2. Enter required info (e.g., username update or referral code link).<br>3. Click **Claim Reward**. | • Toast *"Reward claimed! +X pts"* appears.<br>• Points are immediately credited.<br>• Task moves directly to **Completed** tab. | `[ ] Success`<br>`[ ] Failure` | |

### 3. Gamification, Leaderboard & Profiles

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GAM-01** | Gamification | Dynamic Tier Promotion | 1. Note user's current points and tier (e.g., Bronze).<br>2. Complete a task that awards enough points to cross the next threshold.<br>3. Refresh the page or check the dashboard header. | • User's point count updates.<br>• Tier label upgrades (e.g., Bronze → Silver) dynamically.<br>• UI displays updated tier badge/styles. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-GAM-02** | Leaderboard | Real-time Rank Updates | 1. Open `/leaderboard`. Note current position and point total.<br>2. Complete a high-value task to increase points.<br>3. Return to `/leaderboard` (or refresh). | • User's points display the new total.<br>• User's rank is recalculated and matches the relative sorting of other users. | `[ ] Success`<br>`[ ] Failure` | |

### 4. Admin Dashboard & Operations

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ADM-01** | Admin Panel | Create New Task | 1. Log in as an Admin and go to `/admin/dashboard/tasks`.<br>2. Click **Create Task**.<br>3. Fill out Title, Type, Points, Description, and Verification type (e.g., URL verification).<br>4. Click **Save Task**. | • Task is successfully saved.<br>• Visible in Admin task table.<br>• Appears under user dashboard's **Available Tasks** tab. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-ADM-02** | Admin Panel | Approve User Submission | 1. Go to `/admin/dashboard/submissions`.<br>2. Locate a pending submission from a user.<br>3. Review the proof URL/image.<br>4. Click **Approve**. | • Submission changes status to *"Approved"*.<br>• User is awarded the task points (check user profile to verify).<br>• User receives real-time notification/toast on their dashboard. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-ADM-03** | Admin Panel | Reject User Submission | 1. Navigate to `/admin/dashboard/submissions`.<br>2. Locate a pending submission.<br>3. Click **Reject**.<br>4. Enter a rejection reason (e.g., "Invalid proof link") and click **Confirm**. | • Submission status updates to *"Rejected"*.<br>• No points are awarded to the user.<br>• User sees task as *"Rejected"* with the admin feedback in their dashboard. | `[ ] Success`<br>`[ ] Failure` | |

### 5. Integrity & Edge Case Verification

| Test ID | Module / Feature | Test Title | Test Description & Steps | Expected Result | Actual Result / Status | Failure Reason (If Failed) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-EDGE-01** | Data Integrity | Concurrency Task Pickup (Race Condition) | 1. Navigate to available tasks list.<br>2. Locate a task and click the **Pickup Task** button multiple times rapidly (or simulate 2+ rapid requests). | • System must only register the task pickup once.<br>• No duplicate task entries in the user's active tasks list.<br>• No server-side DB errors thrown. | `[ ] Success`<br>`[ ] Failure` | |
| **TC-EDGE-02** | Data Integrity | Atomic Point Award Audit | 1. Complete a task.<br>2. Force a network disconnect or refresh mid-submission.<br>3. Admin approves the task.<br>4. Check that task status is "Completed" AND points are credited. | • Both events must occur together: Task is "Completed" and user points are updated.<br>• If one fails, both roll back (no task marked complete without points). | `[ ] Success`<br>`[ ] Failure` | |
| **TC-EDGE-03** | Dashboard | Streak Reset Logic | 1. Alter system clock or user's database records to simulate missing a daily login day.<br>2. Log in and claim daily login reward. | • User's daily streak resets to **1**.<br>• No milestone rewards or bonuses are awarded for the missed interval. | `[ ] Success`<br>`[ ] Failure` | |

---

## 📋 How to copy this into Microsoft Word

To format these tables beautifully inside **Microsoft Word**:

1. **Option A (Markdown copy)**:
   - Select the tables directly from this markdown file.
   - Copy (`Ctrl + C`) and paste (`Ctrl + V`) directly into Microsoft Word.
   - Select the pasted table in Word, go to the **Table Design** tab at the top, and choose one of the pre-styled designs (e.g., *"Grid Table 4 - Accent 1"* or similar) to make it look premium.

2. **Option B (HTML copy - Recommended)**:
   - We have generated a styled HTML version of these test cases at: `MANUAL_TEST_PLAN.html`.
   - Open that file in any web browser.
   - Select all (`Ctrl + A`), copy (`Ctrl + C`), and paste (`Ctrl + V`) into Word.
   - This method will retain the styled colored headers and tags (Success/Failure) automatically, providing a premium-looking report.
