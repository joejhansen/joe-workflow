import * as express from "express";
// import express, { Express, Request, Response } from "express";
import * as bodyParser from "body-parser"
import * as dotenv from "dotenv";
import * as path from "path";
import * as cors from "cors";
import * as jsdom from 'jsdom'
import * as fs from 'fs'
import puppeteer from 'puppeteer'

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
async function fetchPageHTML(url: string): Promise<string> {
    const browser = await puppeteer.launch(
        // { headless: false }
    );
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    // Navigate to the page
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for JavaScript to execute (you can adjust the wait time as needed)
    await new Promise(r => setTimeout(r, 500));

    // Get the HTML content after JavaScript has executed
    const htmlContent = await page.content();

    // Close the browser
    await browser.close();

    return htmlContent;
}

// Example usage
const url = 'https://example.com';
// #lv-spells.children[1].children[1].children[0].children[1].children[0].children[0].getAttribute("href")
app.get("/AscensionS9Talent/:talent", cors(corsOptions), async (req, res) => {
    let someString = req.params.talent
    const url = `https://db.ascension.gg/?spells=410.2&filter=na=${someString}`
    try {
        fetchPageHTML(url)
            .then((html) => {
                fs.writeFileSync(`./Data/data-${Date.now()}.html`, html, 'utf8')
                // console.log(html)
                let doc = new jsdom.JSDOM(html);
                let tableContents = doc.window.document.getElementById("lv-spells")?.children[1]?.children[1]?.children
                let linkWeWant: string = ""
                someString.replace("%20", " ")
                if (tableContents !== undefined && tableContents !== null) {
                    for (let spell of tableContents) {
                        if (spell?.children[1]?.children[0]?.children[0]?.textContent === someString) {
                            if (spell?.children[1]?.children[0]?.children[0]?.getAttribute("href")) {
                                linkWeWant = spell.children[1].children[0].children[0].getAttribute("href") as string
                            }
                        } // [0].children[1].children[0].children[1].children[1].getAttribute("href")){
                    }
                }
                // ?.children[0]?.children[1]?.children[0]?.children[0]?.getAttribute("href") // [0].children[1].children[0].children[1].children[1].getAttribute("href") as string
                if (!linkWeWant || !linkWeWant.length) {
                    console.log(`Couldn't find that spell: ${someString}`)
                    res.send({ link: `[${someString}](https://db.ascension.gg/})` })
                } else {
                    res.send({ link: `[${someString}](https://db.ascension.gg/${linkWeWant})` })
                }
                return
                // res.send({ link: `https://db.ascension.gg/${linkWeWant}` })
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (e) {
        console.log(`Something fucked up on the server\n${e}`)
        res.send({ link: `https://db.ascension.gg/` })
        return
    }
})
app.get("/AscensionS9Spell/:skill", cors(corsOptions), async (req, res) => {
    let someString = req.params.skill
    const url = `https://db.ascension.gg/?spells=410.1&filter=na=${someString}`
    try {
        fetchPageHTML(url)
            .then((html) => {
                fs.writeFileSync(`./Data/data-${Date.now()}.html`, html, 'utf8')
                // console.log(html)
                let doc = new jsdom.JSDOM(html);
                let tableContents = doc.window.document.getElementById("lv-spells")?.children[1]?.children[1]?.children
                let linkWeWant: string = ""
                someString.replace("%20", " ")
                if (tableContents !== undefined && tableContents !== null) {
                    for (let spell of tableContents) {
                        if (spell?.children[1]?.children[0]?.children[0]?.textContent === someString) {
                            if (spell?.children[1]?.children[0]?.children[0]?.getAttribute("href")) {
                                linkWeWant = spell.children[1].children[0].children[0].getAttribute("href") as string
                            }
                        } // [0].children[1].children[0].children[1].children[1].getAttribute("href")){
                    }
                }
                // ?.children[0]?.children[1]?.children[0]?.children[0]?.getAttribute("href") // [0].children[1].children[0].children[1].children[1].getAttribute("href") as string
                if (!linkWeWant || !linkWeWant.length) {
                    console.log(`Couldn't find that spell: ${someString}`)
                    res.send({ link: `[${someString}](https://db.ascension.gg/})` })
                } else {
                    res.send({ link: `[${someString}](https://db.ascension.gg/${linkWeWant})` })
                }
                return
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (e) {
        console.log(`Something fucked up on the server\n${e}`)
        res.send({ link: `https://db.ascension.gg/` })
        return
    }
})
app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})