// roblox-pass-scraper/index.js

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
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const url = `https://www.roblox.com/users/${userId}/inventory#!/game-passes`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("ul#assetsItems", { timeout: 15000 });

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
