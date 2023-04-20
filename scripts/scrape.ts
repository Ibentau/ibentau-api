import puppeteer, { Page } from "puppeteer";

import { writeFile } from "fs/promises";

async function main() {
  const url = "https://conf.researchr.org/home/ict4s-2023"; // Replace this with the website you want to scrape
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);

  const visited = new Set<string>();

  await crawl(url, page, visited);

  await browser.close();
}

async function crawl(url: string, page: Page, visited: Set<string>) {
  if (visited.has(url)) {
    return;
  }

  visited.add(url);
  console.log("Crawling:", url);

  await page.goto(url, { waitUntil: "networkidle2" });

  // Select element with id "content" and get its text. Do not get content from style or script tags inside the element.

  const element = await page.waitForSelector("#content", {
    timeout: 100
  });

  if (!element) {
    throw new Error("Could not find element");
  }

  // keep only content elements (like p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, table, dl, div)
  await element.evaluate((element) => {
    const elements = element.querySelectorAll(
      "*:not(p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, table, dl, div, table, tr, th, td, tbody, thead, strong, strike, tfoot, address, a, small, span)"
    );
    for (let i = 0; i < elements.length; i++) {
      elements[i].parentNode?.removeChild(elements[i]);
    }
  });

  const content = await element.evaluate((element) => {
    return element.textContent;
  });

  // Save the content in a .md file
  const date = new Date().toISOString();
  const header = `---
url: ${url}
date: ${date}
---`;

  const fileName = `generated/${url.replace(/[:\/]/g, "_")}.md`;
  await writeFile(fileName, `${header}\n\n${content}`);

  // Get all internal links on the current page
  const links: string[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .map((a) => a.href)
      .filter((href) => href.startsWith("https://conf.researchr.org"))
      .filter((href) => href.includes("ict4s-2023"))
      .filter((href) => !href.includes("#"))
      .filter((href) => !href.includes("profile"))
      .filter((href) => !href.includes("signin"));
  });

  // Crawl each link
  for (const link of links) {
    await crawl(link, page, visited);
  }
}

main().catch((error) => console.error(error));
