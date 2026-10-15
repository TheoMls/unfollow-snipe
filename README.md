# Unfollow Snipe

> **Privately analyze your Instagram followers vs. following directly in your browser. Zero logins, zero API credentials, and 100% client-side data parsing.**

[![Live Site](https://img.shields.io/badge/Live_Site-unfollowsnipe.com-885341?style=for-the-badge)](https://unfollowsnipe.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)
[![Hosting: Cloudflare Pages](https://img.shields.io/badge/Hosting-Cloudflare_Pages-f38020?style=for-the-badge)](https://pages.cloudflare.com/)

---

## Why Unfollow Snipe?

Traditional "unfollower tracker" apps require you to input your Instagram password or grant access to third-party APIs. This frequently leads to account flags, temporary blocks, or permanent bans by Meta.

**Unfollow Snipe** takes a completely different, privacy-first approach:
- **Zero Account Access Required:** Never asks for your password, session cookies, or account permissions.
- **Complete Privacy:** Files are processed locally in temporary browser memory using JavaScript. Nothing is ever uploaded, stored, or transmitted to an external server.

---

## Features

-  **Direct ZIP Decompression:** Drop your downloaded Instagram `.zip` file directly into the browser—no manual unzipping required.
-  **Manual JSON Fallback:** Option to manually upload `followers_1.json` and `following.json` files if you have already extracted your archive.
-  **Instant $O(1)$ Analysis:** Uses JavaScript `Set` data structures to analyze thousands of accounts in milliseconds.
-  **Categorized Results:**
  - **Not Following Back:** Spot accounts you follow that don't follow you back.
  - **Fans:** See accounts following you that you don't follow back.
-  **Real-Time Username Search:** Instant text filtering across result lists.
- **Progressive Web App (PWA):** Installable on iOS, Android, and Desktop with complete offline caching, dynamic asset updates, and manifest integration (`sw.js`).
- **Light / Dark Mode:** Custom Velvet theme with automatic system OS preference detection.
- **Fully Responsive Design:** Works seamlessly on desktop, tablet, and mobile browsers.

---

## How It Works

```text
┌─────────────────────────┐
│ User Instagram Export   │ (.zip or .json)
└───────────┬─────────────┘
            │  (Dropped locally into browser)
            ▼
┌─────────────────────────┐
│ JSZip & FileReader API  │ Decompresses & reads raw JSON in memory
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validation & Set Engine │ Validates structure & computes O(1) difference
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Dynamic UI Render       │ Displays searchable non-followers & fans
└─────────────────────────┘
```

1. **Local Decompression:** JSZip decompresses the archive inside browser memory.
2. **Structure Validation:** Confirms the uploaded JSON files strictly conform to Instagram's official schema before processing.
3. **Data Parsing:** Converts raw follower strings into a hash table (`Set`) for instant lookups.
4. **Comparison:** Subtracts your follower set from your following array to identify non-followers and fans.

---

## How to Get Your Instagram Data

1. Open Instagram and go to:  
   `Accounts Center` ➔ `Your Information and Permissions` ➔ `Export your information` ➔ `Create Export`.
2. **Settings to select:**
   - **Information:** Select *Customize information* and check **Followers and following**.
   - **Date Range:** Set to **All time**.
   - **Format:** Set to **JSON** *(HTML format is not supported)*.
3. Once Instagram sends your download link (usually within 5–15 minutes), drop the `.zip` file straight into **Unfollow Snipe**!

---

## Project Structure

```text
unfollow-snipe/
├── assets/
│   ├── css/
│   │   ├── fonts.css             # Plus Jakarta Sans local webfonts
│   │   ├── guide.css             # Step-by-step modal stylesheet
│   │   ├── layout.css            # Responsive breakpoints & layout
│   │   ├── privacy-screen.css    # Legal screens layout
│   │   └── style.css             # Base design, Velvet theme, & components
│   ├── fonts/                    # Self-hosted WOFF2 fonts
│   ├── img/                      # Icons & Open Graph assets
│   └── js/ 
│   │   ├── script.js             # Main application logic & DOM renderer
│   │   ├── theme.js              # Theme management & persistence
│   │   └── validate.js           # JSON structure schema validators
│   └── test_data/ 
│   │   ├── following.test.json   # Custom test following.json file
│   │   └── followers_1.test.json # Custom test followers_1.json file
├── 404.html                      # Custom 404 page that redirects to unfollowsnipe.com
├── ads.txt                       # Google AdSense publisher verification
├── attributions.html             # Asset creators & license credits
├── index.html                    # Main application entry point
├── privacy.html                  # Privacy policy & AdSense disclosures
├── manifest.json                 # PWA Web App Manifest
├── sw.js                         # PWA Offline Service Worker
├── robots.txt                    # Search engine crawler instructions
├── sitemap.xml                   # XML Sitemap for SEO indexing
└── README.md
```

---

## Local Development Setup

Because **Unfollow Snipe** is built with vanilla HTML, CSS, and JavaScript, no complex build tools or bundlers are required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheoMls/unfollow-snipe.git
   cd unfollow-snipe
   ```

2. **Run locally:**
   - Open `index.html` directly in your browser.
   - Alternatively, serve it via any static server (e.g., VS Code Live Server, `npx serve`, or Python's `http.server`):
     ```bash
     python -m http.server 8000
     ```

3. Open `http://localhost:8000` in your web browser.

---

## Built With

- **HTML5 & CSS3:** CSS Custom Properties, CSS Grid, Flexbox, & Dark Mode.
- **Vanilla JavaScript (ES6+):** Async/Await, FileReader API, Sets, & DOM Manipulation.
- **PWA & Service Worker:** Cache API & Web App Manifest for offline installation.
- **[JSZip](https://stuk.github.io/jszip/):** In-browser zip file extraction.
- **[Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans):** Typography.
- **Cloudflare Pages:** Global static CDN hosting.

---

## License & Attributions

This project is licensed under the [MIT License](LICENSE).  
Visual assets and icons used in this project are credited in [attributions.html](https://unfollowsnipe.com/attributions.html).