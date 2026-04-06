from __future__ import annotations

import asyncio
import json
import re
from collections import deque
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


USER_AGENT = "PhasrSageKnowledgeBot/1.0"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: set[str] = set()
        self.title: str = ""
        self._inside_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.add(href)
        if tag == "title":
            self._inside_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._inside_title = False

    def handle_data(self, data: str) -> None:
        if self._inside_title:
            self.title += data.strip()


def _fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8", errors="ignore")


def _strip_html(html: str) -> str:
    html = re.sub(r"<script.*?</script>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<style.*?</style>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<noscript.*?</noscript>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"\s+", " ", html)
    return html.strip()


def _classify_url(url: str) -> str:
    path = urlparse(url).path.lower().strip("/")
    if any(token in path for token in ("blog", "article", "articles", "post", "posts", "career-advice")):
        return "article"
    return "page"


class WebsiteScraper:
    async def discover_urls(self, start_url: str, max_pages: int = 30) -> list[dict[str, Any]]:
        start = urlparse(start_url)
        seen: set[str] = set()
        queued = deque([start_url])
        discovered: dict[str, dict[str, Any]] = {}

        while queued and len(seen) < max_pages:
            current = queued.popleft()
            if current in seen:
                continue
            seen.add(current)

            try:
                html = await asyncio.to_thread(_fetch_html, current)
            except Exception:
                continue

            parser = LinkParser()
            parser.feed(html)
            discovered[current] = {
                "url": current,
                "type": _classify_url(current),
                "title": parser.title.strip() or urlparse(current).path.strip("/") or current,
            }

            for href in parser.links:
                absolute = urljoin(current, href)
                parsed = urlparse(absolute)
                if parsed.scheme not in {"http", "https"}:
                    continue
                if parsed.netloc != start.netloc:
                    continue
                normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
                if normalized and normalized not in seen:
                    queued.append(normalized)

        return list(discovered.values())

    async def scrape_pages(self, urls: list[str]) -> dict[str, dict[str, Any]]:
        pages: dict[str, dict[str, Any]] = {}
        for url in urls:
            try:
                html = await asyncio.to_thread(_fetch_html, url)
                parser = LinkParser()
                parser.feed(html)
                pages[url] = {
                    "url": url,
                    "title": parser.title.strip() or urlparse(url).path.strip("/") or url,
                    "content": _strip_html(html),
                    "metadata": {
                        "title": parser.title.strip() or urlparse(url).path.strip("/") or url,
                        "type": _classify_url(url),
                    },
                }
            except Exception as error:
                pages[url] = {
                    "url": url,
                    "title": url,
                    "content": "",
                    "metadata": {
                        "title": url,
                        "type": _classify_url(url),
                        "error": str(error),
                    },
                }
        return pages


if __name__ == "__main__":
    async def _demo() -> None:
        scraper = WebsiteScraper()
        result = await scraper.discover_urls("https://jamesclear.com/articles", max_pages=5)
        print(json.dumps(result, indent=2))

    asyncio.run(_demo())

