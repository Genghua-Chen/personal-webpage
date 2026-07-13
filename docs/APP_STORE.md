# Publishing Gotta Go NYC to the App Store

Project specifics you'll reuse below:
- **App name (working):** Gotta Go NYC
- **Bundle ID:** `com.lazysheep.GottaGoNYC` (change if it collides with an existing one)
- **Platform:** iPhone only, iOS 17+
- **Data/accounts:** none collected. Uses **precise location** (find nearest / user dot) only.
- **Network:** none — all data is bundled `restrooms.csv`.

---

## 0. Prerequisites
- A Mac with **Xcode 16+**.
- An **Apple ID**.
- **Apple Developer Program** membership — **$99/year**, required to ship to the
  App Store. Enroll at <https://developer.apple.com/programs/enroll/>. Approval can
  take a few hours to a couple of days.

## 1. One-time account setup
1. Enroll in the Apple Developer Program (above).
2. Sign in to **App Store Connect** → <https://appstoreconnect.apple.com>.
3. Under **Users and Access → Agreements**, accept the **Paid/Free Apps
   agreement** (even free apps must accept it, or the app can't be released).

## 2. Register the App ID & create the app record
1. App Store Connect → **My Apps → + → New App**.
2. Fill in:
   - **Platform:** iOS
   - **Name:** Gotta Go NYC (must be globally unique on the store; pick another if taken)
   - **Primary language:** English (U.S.)
   - **Bundle ID:** select/create `com.lazysheep.GottaGoNYC`
     (if it's not in the list, Xcode will register it for you in step 3, or add it
     at <https://developer.apple.com/account/resources/identifiers/list>)
   - **SKU:** any internal string, e.g. `gottago-nyc-001`
   - **User access:** Full Access

## 3. Configure signing in Xcode
1. Open `GottaGoNYC.xcodeproj`.
2. Select the **GottaGoNYC** target → **Signing & Capabilities**.
3. Check **Automatically manage signing**.
4. **Team:** pick your Apple Developer team.
5. Confirm the **Bundle Identifier** matches the app record.
6. Set **Version** = `1.0` and **Build** = `1` (target → General, or the
   `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` build settings).

> Optional but handy: add `ITSAppUsesNonExemptEncryption = NO` to Info.plist so
> you're not asked the export-compliance question on every upload. The app does no
> custom crypto and makes no network calls, so it's exempt.

## 4. Build an archive
1. In Xcode's run-destination dropdown, choose **Any iOS Device (arm64)**
   (you can't archive against a simulator).
2. Menu **Product → Archive**. Wait for the build.
3. The **Organizer** window opens with your archive.

## 5. Upload to App Store Connect
1. In Organizer, select the archive → **Distribute App**.
2. Choose **App Store Connect → Upload** → keep the default signing options →
   **Upload**.
3. After a few minutes the build appears in App Store Connect under the app's
   **TestFlight** tab, in **Processing** state (can take 5–30 min).

## 6. TestFlight (recommended before submitting)
1. App Store Connect → your app → **TestFlight**.
2. Once the build finishes processing, add yourself (Internal Testing) and install
   via the **TestFlight** app on your iPhone. Verify:
   - map loads, markers appear, filters/search work,
   - **Find Nearest** prompts for location permission and sorts by distance,
   - copy-code and Apple Maps directions work.

## 7. Fill in the store listing (App Information / Version)
On the app's **1.0 Prepare for Submission** page:
- **Screenshots (required):** at least one **6.9"** iPhone screenshot
  (1320×2868). Add **6.5"** too for older devices. Grab them from the simulator:
  run on an iPhone 16 Pro Max sim → **⌘S** (or Device → Trigger Screenshot).
- **Promotional text / Description:** what the app does (find NYC restrooms fast,
  door codes, one-tap directions).
- **Keywords:** e.g. `restroom,bathroom,toilet,nyc,public,restroom finder`.
- **Support URL:** e.g. `https://lazysheep798.com` (a reachable page is required).
- **Marketing URL:** optional (e.g. the web finder).
- **Category:** Travel (or Navigation).
- **Age rating:** answer the questionnaire → this app rates **4+**.
- **Build:** click **+** / **Select a build** and choose the uploaded build.

## 8. App Privacy (required)
App Store Connect → **App Privacy → Get Started**:
- **Location → Precise Location:** **Yes, collected.**
  - Purpose: **App Functionality** (finding nearby restrooms).
  - **Not linked** to the user's identity.
  - **Not used for tracking.**
- Everything else: **No** (no accounts, analytics, ads, or network calls).
This produces the privacy "nutrition label."

## 9. Export compliance
When you attach the build (or via the plist key in step 3), answer the encryption
question: the app uses **no non-exempt encryption** → the standard **"No"** /
exempt answer. (If you added `ITSAppUsesNonExemptEncryption = NO`, you won't be asked.)

## 10. Submit for review
1. Set **Pricing** → **Free** (Pricing and Availability tab) and choose
   territories (e.g. all, or United States).
2. On the version page, choose the release option:
   **Automatically release** after approval, or **Manually release**.
3. Click **Add for Review → Submit**.
4. Review typically takes **1–3 days**. You'll get email on approval or rejection
   (with reasons). Fix and resubmit if rejected.

---

## Likely review notes to pre-empt
- **Location usage string:** already set — "Used to find the closest restrooms to
  you and show your position on the map." Reviewers want the *why* to be clear. ✔
- **Minimum functionality:** a genuine, useful finder — fine. Avoid anything that
  looks like a repackaged website.
- **Accuracy:** coordinates/codes are crowd-sourced/approximate; the in-app footer
  language covers this. Consider a short disclaimer in the description.
- **Data safety:** because you truly make no network calls, the privacy label is
  minimal — keep it that way.

## Updating later (v1.1+)
Bump **Version** (`MARKETING_VERSION`) and **Build** (`CURRENT_PROJECT_VERSION`),
re-archive, upload, attach the new build to a new version in App Store Connect,
and submit. Remember to re-copy the CSV first if the data changed:
`cp restroom-finder/restrooms.csv gotta-go-ios/GottaGoNYC/restrooms.csv`.
