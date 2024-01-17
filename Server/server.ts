import * as express from "express";
// import express, { Express, Request, Response } from "express";
import * as bodyParser from "body-parser"
import * as dotenv from "dotenv";
import * as path from "path";
import * as cors from "cors";
import * as jsdom from 'jsdom'
import * as fs from 'fs'

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
app.get("/AscensionS9Talent/:talent", cors(corsOptions), async (req, res) => {
    let someString = req.body.searchThis
    try {
        await fetch(`https://db.ascension.gg/?spells=410.2&filter=na=${someString}`)
            .then(function (response) { 
                if (response.ok){
                    return response.text() 
                } else {
                    throw new Error("No response object from Ascension")
                }                
            })
            .then(function (html) {
                fs.writeFileSync(`data-${Date.now()}.html`, html, 'utf8')
                console.log(html)
                let doc = new jsdom.JSDOM(html);
                let linkWeWant = doc.window.document.getElementById("lv-spells") // [0].children[1].children[0].children[1].children[1].getAttribute("href") as string
                res.send({link: "cool"})
                // res.send({ link: `https://db.ascension.gg/${linkWeWant}` })
                return
            })
    } catch (e) {
        console.log(`Something fucked up on the server\n${e}`)
        res.send({ link: `https://db.ascension.gg/` })
        return
    }
})
app.get("/AscensionS9Spell/:skill", cors(corsOptions), async (req, res) => {
    let someString = req.body.searchThis
    try {
        await fetch(`https://db.ascension.gg/?spells=410.1&filter=na=${someString}`)
            .then(function (response) { return response.text() })
            .then(function (html) {
                let doc = new jsdom.JSDOM(html);
                let linkWeWant = doc.window.document.getElementsByClassName("listview-mode-default")[0].children[1].children[0].children[1].children[1].getAttribute("href") as string
                res.send({ link: `https://db.ascension.gg/${linkWeWant}` })
                return
            })
    } catch (e) {
        console.log(`Something fucked up on the server\n${e}`)
        res.send({ link: `https://db.ascension.gg/` })
        return
    }
})
app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})