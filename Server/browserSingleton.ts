import puppeteer, { Browser, Page } from 'puppeteer';
// This is to get around not being able to instantiate the Browser in the server global
// or idk maybe this was just a hack ChatGPT gave me. it's 11:30PM and i don't want to think about it
let globalBrowser: Browser | null = null;
let globalPage: Page | null = null;
export async function initializeBrowser() {
    if (!globalBrowser) {
        globalBrowser = await puppeteer.launch({ headless: "new" });
        globalPage = await globalBrowser.newPage();
        await globalPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }
}

export function getGlobalBrowser(): Browser | null {
    return globalBrowser;
}
export function getGlobalPage(): Page | null {
    return globalPage
}