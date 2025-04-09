# Roblox Game Pass Scraper

Scrapes all visible Game Passes from a Roblox user’s inventory page using Puppeteer and returns them as JSON.

## Usage

GET /get-passes?userId=567633679

Returns:

```json
[
  { "id": "1152114593", "name": "Test Pass", "price": 10 }
]
