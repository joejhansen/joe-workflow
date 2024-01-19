import * as express from "express";
// import express, { Express, Request, Response } from "express";
import * as bodyParser from "body-parser"
import * as dotenv from "dotenv";
import * as path from "path";
import * as cors from "cors";
import * as jsdom from 'jsdom'
import * as fs from 'fs'
import puppeteer, { Browser, Page } from 'puppeteer'
import { initializeBrowser, getGlobalBrowser, getGlobalPage } from './browserSingleton';
dotenv.config();
const app: express.Express = express();
const port = 3069;
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.get("/", (req: express.Request, res: express.Response) => {
//     // res.send("Express + TypeScript Server");
//     res.sendFile(path.join(__dirname, '/index.html'))
// });
let corsOptions = {
    origin: "app://obsidian.md",
    optionsSuccessStatus: 200
}

initializeBrowser();

async function fetchPageHTML(url: string): Promise<string> {
    try {
        let page = getGlobalPage();
        // Navigate to the page
        if (!page) {
            throw new Error("No Page!")
        } else {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const htmlContent = await page.content();
            return htmlContent;
        }

        // Wait for JavaScript to execute (you can adjust the wait time as needed)
        // await new Promise(r => setTimeout(r, 500));

        // Get the HTML content after JavaScript has executed

        // Close the browser
    } catch (e) {
        console.log(`Couldn't reach URL: ${url}\n${e}`)
        return "<div>Something fucked up</div>"
    }
}

// Example usage
const url = 'https://example.com';
// #lv-spells.children[1].children[1].children[0].children[1].children[0].children[0].getAttribute("href")
app.get("/start-browser", cors(corsOptions), async (req, res) => {
    console.log(`${Date.now()} -> ${req.ip}; Starting Puppeteer Browser`)
})
app.get("/AscensionS9Talent/:talent", cors(corsOptions), async (req, res) => {
    console.log(`${Date.now()} -> ${req.ip}; Fetching talent: ${req.params.talent}`)
    let someString = req.params.talent
    const url = `https://db.ascension.gg/?spells=410.2&filter=na=${someString}`
    try {
        fetchPageHTML(url)
            .then((html) => {
                // fs.writeFileSync(`./Data/data-${Date.now()}.html`, html, 'utf8')
                // console.log(html)
                const doc = new jsdom.JSDOM(html);
                const tableContents = doc.window.document.getElementById("lv-spells")?.children[1]?.children[1]?.children
                let linkWeWant: string = ""
                someString.replace("%20", " ")
                if (!tableContents) {
                    throw new Error(`${Date.now()} -> ${req.ip}; No table of contents!`)
                }
                for (let spell of tableContents) {
                    if (spell?.children[1]?.children[0]?.children[0]?.textContent?.toLocaleUpperCase() === someString.toLocaleUpperCase()) {
                        linkWeWant = spell.children[1].children[0].children[0].getAttribute("href") as string
                    }
                }

                if (!linkWeWant || !linkWeWant.length) {
                    throw new Error(`${Date.now()} -> ${req.ip}; Couldn't find that talent: ${someString}`)
                }
                console.log(`${Date.now()} -> ${req.ip}; Found talent: ${someString}`)
                res.send({ link: `[${someString}](https://db.ascension.gg/${linkWeWant})` })
                return
                // res.send({ link: `https://db.ascension.gg/${linkWeWant}` })
            })
    } catch (e) {
        console.log(`${Date.now()} -> ${req.ip}; Something fucked up on the server\n${e}`)
        res.send({ link: someString })
        return
    }
})
app.get("/AscensionS9Spell/:spell", cors(corsOptions), async (req, res) => {
    let someString = req.params.spell
    console.log(`${Date.now()} -> ${req.ip}; Fetching spell: ${req.params.spell}`)
    const url = `https://db.ascension.gg/?spells=410.1&filter=na=${someString}`
    try {
        fetchPageHTML(url)
            .then((html) => {
                // fs.writeFileSync(`./Data/data-${Date.now()}.html`, html, 'utf8')
                // console.log(html)
                const doc = new jsdom.JSDOM(html);
                const tableContents = doc.window.document.getElementById("lv-spells")?.children[1]?.children[1]?.children
                let linkWeWant: string = ""
                someString.replace("%20", " ")
                if (!tableContents) {
                    throw new Error(`${Date.now()} -> ${req.ip}; No table of contents!`)
                }
                for (let spell of tableContents) {
                    if (spell?.children[1]?.children[0]?.children[0]?.textContent?.toLocaleUpperCase() === someString.toLocaleUpperCase()) {
                        linkWeWant = spell.children[1].children[0].children[0].getAttribute("href") as string
                    }
                }

                if (!linkWeWant || !linkWeWant.length) {
                    throw new Error(`${Date.now()} -> ${req.ip}; Couldn't find that spell: ${someString}`)
                }
                console.log(`${Date.now()} -> ${req.ip}; Found talent: ${someString}`)
                res.send({ link: `[${someString}](https://db.ascension.gg/${linkWeWant})` })
                return
            })
    } catch (e) {
        console.log(`${Date.now()} -> ${req.ip}; Something fucked up on the server\n${e}`)
        res.send({ link: someString })
        return
    }
})
app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})