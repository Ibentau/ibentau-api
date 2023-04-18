import puppeteer, { Browser } from "puppeteer";

import { mkdir, readdir, readFile, writeFile } from "fs/promises";
// @ts-ignore
import TurndownService from "turndown";

// @ts-ignore
import { gfm } from "joplin-turndown-plugin-gfm";

const turndownService = new TurndownService();
turndownService.use(gfm);

/**
 * Scrapes the researchr page and returns the markdown
 *
 * @param url the url of the researchr page
 * @param browser the puppeteer browser
 * @returns the markdown of the researchr page
 */
async function scrape_researchr_page(
  url: string,
  browser: Browser
): Promise<string> {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(url);

  const element = await page.waitForSelector("#content", {
    timeout: 100,
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

  const html_of_element = await element.evaluate(
    (element) => element.innerHTML
  );

  return turndownService.turndown(html_of_element);
}

/**
 * Scrapes all researchr pages and saves them to a file
 *
 * @returns the markdowns of all researchr pages
 *
 */
async function scrape_all_pages() {
  // get urls from json file
  const urls = JSON.parse(await readFile("scripts/urls.json", "utf8"));
  console.log(`Got ${urls.length} urls ready to scrape`);

  const browser = await puppeteer.launch();

  try {
    await readdir("./generated");
  } catch (e) {
    await mkdir("./generated");
  }

  for (const url of urls) {
    try {
      let markdown = await scrape_researchr_page(url, browser);
      // add metadata
      const metadata = `---
url: ${url}
date: ${new Date().toISOString()}
---
`;
      markdown = metadata + markdown;

      // save markdown to file
      await writeFile(`./generated/${url.split("/").pop()}.md`, markdown);
    } catch (e) {
      console.log(`Error scraping ${url}`);
    }
  }
  await browser.close();
}

async function main() {
  await scrape_all_pages();
  console.log("Done scraping");
}

main();
