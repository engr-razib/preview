🚀 Bulk Ad Mockup Tool
A high-performance mockup engine built with Node.js, Express, and Puppeteer. This tool allows you to inject banner advertisements into any live website to preview how they would look in real-world scenarios. It supports both individual banner generation and an "All-in-One" mode that intelligently finds ad slots on a page based on banner dimensions.

✨ Features
Smart Placement: Automatically detects existing ad slots (divs, iframes, ins) that match your banner's width and height.

Bulk Processing: Upload multiple banner sizes and multiple target URLs at once.

All-in-One Mode: Inject all uploaded banners into a single webpage preview.

ZIP Download: Automatically packages all generated HTML mockups into a structured ZIP file.

Vercel Optimized: Configured to run on Vercel's serverless infrastructure using @sparticuz/chromium.

📂 Project Structure
To ensure compatibility with Vercel and local development, keep all files in the root directory:

Plaintext
.
├── index.html          # Frontend User Interface
├── server.js           # Express Backend & Puppeteer Logic
├── vercel.json         # Vercel Deployment Configuration
├── package.json        # Project Dependencies
└── README.md           # Documentation
🛠️ Local Setup
1. Prerequisites
Node.js installed.

Google Chrome installed (for local previewing).

2. Installation
Bash
# Clone or download the project
cd your-project-folder

# Install dependencies
npm install
3. Run Locally
Bash
node server.js
Open http://localhost:3000 in your browser.

🚀 Deployment to Vercel
This project is pre-configured for Vercel. Because Puppeteer is too large for standard serverless functions, we use puppeteer-core and @sparticuz/chromium.

Push your code to a GitHub repository.

Import to Vercel: Connect your GitHub repo to Vercel.

Environment Variables: No specific variables are needed, but ensure NODE_ENV is automatically set (Vercel does this) so the code knows to use the serverless browser.

Deployment: Vercel will read vercel.json and set the function timeout to 60 seconds and memory to 1GB.

⚙️ Configuration Details
vercel.json
Controls the routing and increases the resources for the browser engine:

Memory: 1024MB (required for Chromium).

MaxDuration: 60s (allows time for Puppeteer to load heavy sites).

server.js Launch Logic
The server automatically detects if it is running on Windows or Vercel (Linux):

Local: Uses your installed Chrome browser.

Production: Uses the compressed @sparticuz/chromium binary.

📝 License
MIT
