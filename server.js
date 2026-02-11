const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(cors());

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 300;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight || totalHeight > 5000) {
                    clearInterval(timer); resolve();
                }
            }, 100);
        });
    });
}

// Serve index.html from root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/api/generate-preview', async (req, res) => {
    const { targetUrl, adImageUrl, adWidth, adHeight, banners, mode, type } = req.body;
    let browser = null;

    try {
        const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        let launchOptions = {};

        if (isProd) {
            // Vercel / Production Settings
            launchOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
        } else {
            // Local Windows Settings
            // This uses your locally installed Chrome browser
            launchOptions = {
                args: ['--no-sandbox'],
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Standard Windows path
                headless: true,
            };
        }

        browser = await puppeteer.launch(launchOptions);

          
        const page = await browser.newPage();
        await page.setViewport({ width: 1600, height: 1200 });
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 90000 });
        
        await autoScroll(page);

        // Normalize data to an array
        const adsToPlace = mode === 'all' ? banners : [{ img: adImageUrl, w: adWidth, h: adHeight }];

        await page.evaluate((ads) => {
            // 1. Cleanup site
            document.querySelectorAll('script').forEach(s => s.remove());
            document.querySelectorAll('a, button').forEach(el => {
                el.style.pointerEvents = 'none';
                if (el.tagName === 'A') el.href = 'javascript:void(0)';
            });

            ads.forEach((ad, index) => {
                const container = document.createElement('div');
                container.className = "mockup-injected-ad";
                container.style.cssText = `
                    width: ${ad.w}px !important; 
                    height: ${ad.h}px !important; 
                    margin: 15px auto !important; 
                    border: 3px solid #ccc !important; 
                    display: block !important; 
                    background: white !important;
                    position: relative !important;
                    z-index: 1 !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                `;
                container.innerHTML = `<img src="${ad.img}" style="width:100%; height:100%; object-fit:contain;">`;

                // 2. Smart Size-Based Positioning
                const tolerance = 20;
                const allElements = document.querySelectorAll('div, ins, iframe, aside, section');
                let bestMatch = null;

                for (const el of allElements) {
                    const rect = el.getBoundingClientRect();
                    // Skip if we already used this container or it's hidden
                    if (el.innerHTML.includes('mockup-injected-ad') || rect.height < 20) continue;

                    if (Math.abs(rect.width - ad.w) <= tolerance && Math.abs(rect.height - ad.h) <= tolerance) {
                        bestMatch = el;
                        break;
                    }
                }

                if (bestMatch) {
                    bestMatch.innerHTML = '';
                    bestMatch.appendChild(container);
                } else {
                    // Fallback to selectors if no size match
                    const selectors = ['header', 'nav', '.navbar', 'main', '.hero'];
                    let placed = false;
                    for (const s of selectors) {
                        const target = document.querySelector(s);
                        if (target && !target.nextElementSibling?.className?.includes('mockup-injected-ad')) {
                            target.insertAdjacentElement('afterend', container);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) document.body.prepend(container);
                }
            });
        }, adsToPlace);

        // Ensure pointer events are locked for everything except our ads
        await page.addStyleTag({
            content: `* { pointer-events: none !important; } .mockup-injected-ad, .mockup-injected-ad img { pointer-events: auto !important; }`
        });

        const origin = new URL(targetUrl).origin;
        let html = await page.content();
        html = html.replace('<head>', `<head><base href="${origin}/">`);
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);

    } catch (e) {
        console.error(e);
        res.status(500).send("Mockup failed");
    } finally {
        if (browser) await browser.close();
    }
});


// For Vercel, we export the app; for local, we listen
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT}`));
}

module.exports = app;