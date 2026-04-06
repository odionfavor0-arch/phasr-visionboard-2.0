from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.core.env_loader import load_backend_env
from app.core.scraper import WebsiteScraper


DATA_DIR = Path(__file__).resolve().parent / "data" / "knowledge"
load_backend_env(Path(__file__).resolve().parent)
DATA_DIR.mkdir(parents=True, exist_ok=True)

SEED_SITES = [
    {
        "name": "vision_board",
        "start_url": "https://alicedartnell.com/blog/vision-board-a-powerful-tool-to-achieve-your-goals/",
        "types": ["article"],
    },
    {
        "name": "personal_growth",
        "start_url": "https://jamesclear.com/articles",
        "types": ["article"],
    },
    {
        "name": "mindfulness",
        "start_url": "https://www.theblissfulmind.com/",
        "types": ["page", "article"],
    },
    {
        "name": "finance_nigeria",
        "start_url": "https://cowrywise.com/blog",
        "types": ["article"],
    },
    {
        "name": "fitness",
        "start_url": "https://www.runeatrepeat.com/blog/",
        "types": ["article"],
    },
    {
        "name": "career",
        "start_url": "https://www.robertsoncollege.com/blog/career-advice/",
        "types": ["article"],
    },
]


async def run_scraper_and_save(site: dict) -> None:
    scraper = WebsiteScraper()
    start_url = site["start_url"]
    print(f"Starting scan for {site['name']} from: {start_url}")

    discovered = await scraper.discover_urls(start_url)
    urls_to_scrape = [
        item["url"]
        for item in discovered
        if item.get("type") in site["types"]
    ]

    print(f"Discovered {len(urls_to_scrape)} pages to scrape")
    content = await scraper.scrape_pages(urls_to_scrape)

    filename = DATA_DIR / f"{site['name']}_blog.json"
    with filename.open("w", encoding="utf-8") as handle:
        json.dump(content, handle, indent=2, ensure_ascii=False)

    print(f"Saved {len(content)} scraped pages to {filename.name}")


async def run_all_scrapers() -> None:
    for site in SEED_SITES:
        await run_scraper_and_save(site)


if __name__ == "__main__":
    asyncio.run(run_all_scrapers())
