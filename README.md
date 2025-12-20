🎨 Bonkverse Skin Editor
========================

The **Bonkverse Skin Editor** is a modern, web-based editor for creating, editing, and exporting **Bonk.io skins**.\
It provides a visual, canvas-based workflow that mirrors Bonk.io's internal coordinate system while offering powerful quality-of-life features not available in the default editor.

🔗 **Live Editor:** <https://editor.bonkverse.io>\
🚆 **Railway Deploy:** <https://bv-skin-editor-production.up.railway.app/>


✨ Features
----------

-   🧩 **Full Bonk.io shape library** (SVG-based, resolution-independent)
-   🖱️ **Drag, rotate, scale shapes directly on the canvas**
-   🎯 **Accurate Bonk.io coordinate mapping**
-   🎨 **Advanced color picker**
-   📦 **Layer management** (reorder, multi-select, grouping)
-   🔄 **Flip X / Flip Y**
-   📋 **Import / export Bonk.io skin JSON**
-   🧠 **Paste skin codes or individual layers**
-   🖼️ **Image overlay for tracing reference art**
-   ⌨️ **Keyboard shortcuts**
-   🚀 **Fast Vite + React architecture**

Designed to be both:

-   **Beginner-friendly** for casual skin creators
-   **Powerful enough** for advanced Bonk.io artists

🛠️ Tech Stack
--------------

-   **Frontend:** React + Vite
-   **Styling:** CSS (custom UI)
-   **Icons:** `react-icons`
-   **Color Picker:** `react-colorful`
-   **Backend (minimal):** Express (static serving)
-   **Deployment:** Railway
-   **DNS / Security:** Cloudflare

📂 Project Structure
--------------------

```
skin-editor/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # React components
│   ├── utils/             # Helper utilities (math, transforms, etc.)
│   ├── App.jsx            # Main editor component
│   ├── main.jsx           # React entry point
│   ├── App.css
│   └── index.css
├── dist/                  # Production build output
├── server.js              # Express server (Railway)
├── vite.config.js
├── package.json
└── README.md
```


🚀 Local Development
--------------------

### 1\. Install dependencies

```bash
npm install
```

### 2\. Run the development server

```bash
npm run dev
```

Vite will start the app at:

`http://localhost:5173`


🏗️ Production Build
--------------------

To generate a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```


🌐 Deployment (Railway)
-----------------------

The editor is deployed on **Railway** using a minimal Express server.

### Start command

```npm start```

Which runs:

```node server.js```

### server.js (overview)

-   Serves `/dist`
-   Handles SPA routing fallback
-   Designed to work behind Cloudflare

🔐 DNS & Cloudflare Notes
-------------------------

-   `editor.bonkverse.io` is a **CNAME → Railway**
-   Cloudflare proxy is enabled
-   SSL mode: **Full**
-   All DNS records are managed in **Cloudflare**, not Namecheap

📤 Importing & Exporting Skins
------------------------------

### Supported formats

-   Full Bonk.io skin JSON
-   Individual skin layers
-   Decoded skin objects

### Export

-   Produces Bonk.io-compatible JSON
-   Can be re-encoded and worn directly in-game

⚠️ Known Limitations
--------------------

-   Bonk.io internally uses floating-point rounding that may cause **tiny positional differences**
-   Skin theft prevention is **out of scope** for the editor itself
-   Editor currently assumes **Bonk.io default ball radius**

These are actively being refined as part of Bonkverse.


🧠 Philosophy
-------------

This editor is part of the larger **Bonkverse** ecosystem --- a community-driven effort to:
-   Preserve Bonk.io creativity
-   Give creators better tools
-   Enable attribution, discovery, and sharing

This project prioritizes **clarity, performance, and creative freedom**.


🤝 Contributing
---------------

Pull requests are welcome --- especially for:

-   UI polish
-   Performance improvements
-   Editor UX enhancements
-   Coordinate accuracy improvements

Please keep changes focused and well-documented.


🤖 AI Usage
---------------

Yes this code was made with the help of ChatGPT. What does this mean? It means that most likely the code you're about to see is gonna be shit.
The purpose of making this repo public and open source is to step away from AI-generated code into something useful and made by community members.

We hope that you'll bear with us as we undergo this transition of being more community and developer friendly :)
