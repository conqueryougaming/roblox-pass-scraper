import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/get-passes", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId query param" });
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: puppeteer.executablePath(),
      headless: "new", // more stable in some environments
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set a realistic User-Agent to avoid blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const url = `https://www.roblox.com/users/${userId}/inventory#!/game-passes`;
    console.log("Navigating to:", url);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Buffer time for dynamic loading
    await page.waitForTimeout(3000);

    // Check if the expected selector exists
    const hasSelector = await page.$("ul#assetsItems");
    if (!hasSelector) {
      const html = await page.content();
      console.error("Could not find assetsItems. Page content snapshot:");
      console.error(html.slice(0, 1000)); // only log first 1000 chars
      throw new Error("Could not find game pass container.");
    }

    const passes = await page.evaluate(() => {
      const items = [];
      const listItems = document.querySelectorAll("#assetsItems li");

      listItems.forEach((li) => {
        const link = li.querySelector("a.item-card-link");
        const name = li.querySelector(".item-card-name span")?.innerText.trim();
        const priceText = li.querySelector(".text-robux-tile")?.innerText.trim();
        const idMatch = link?.href.match(/game-pass\/(\d+)/);

        if (idMatch && priceText) {
          const price = parseInt(priceText.replace(/\D/g, ""), 10);
          items.push({
            id: idMatch[1],
            name,
            price,
          });
        }
      });

      return items;
    });

    await browser.close();
    res.json(passes);
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: "Failed to scrape game passes." });
  }
});

app.get("/", (req, res) => {
  res.send("Roblox Game Pass Scraper is live.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
