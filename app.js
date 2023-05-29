const puppeteer = require("puppeteer");
const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const dns = require("dns");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.json({ msg: "checkout the meta and dns api" });
});

app.get("/meta", (req, res) => {
    const url = req.query.url;

    // Make a request to the URL and parse the response.
    request(url, (err, response, body) => {
        if (err) {
            res.status(500).send(err);
            return;
        }

        const $ = cheerio.load(body);
        
        // Get the meta information from the page.
        const meta = {
            title: $("title").text(),
            description: $('meta[name="description"]').attr("content"),
            image: $('meta[property="og:image"]').attr("content"),
            author: $('meta[name="author"]').attr("content"),
            publicationDate: $('meta[name="publication_date"]').attr("content"),
            lastModifiedDate: $('meta[name="last_modified_date"]').attr("content"),
            keywords: $('meta[name="keywords"]').attr("content"),
            categories: $('meta[name="categories"]').attr("content"),
            contentRating: $('meta[name="content_rating"]').attr("content"),
            language: $('meta[name="language"]').attr("content"),
            characterEncoding: $('meta[name="character_encoding"]').attr("content"),
            robotsMetaTag: $('meta[name="robots"]').attr("content"),
            canonicalURL: $('link[rel="canonical"]').attr("href"),
            openGraphMetaTags: $('meta[property^="og:"]').map(function () {
                return {
                    property: $(this).attr("property"),
                    content: $(this).attr("content"),
                };
            }).get(),
            twitterCardMetaTags: $('meta[name^="twitter:"]').map(function () {
                return {
                    name: $(this).attr("name"),
                    content: $(this).attr("content"),
                };
            }).get(),
        };

        // Send the meta information back to the client.
        res.json(meta);
    });
});

// API endpoint for capturing a screenshot of a URL
app.get("/screenshot", (req, res) => {
    const { url } = req.query;

    puppeteer
        .launch({ headless: "new", })
        .then(async (browser) => {
            const page = await browser.newPage();

            // Set the viewport to your preferred size
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(url);

            // await page.screenshot({ path: "nyt-puppeteer.jpeg", type: "jpeg", fullPage: true });
            let screenshot = await page.screenshot({ encoding: "base64", type: "jpeg" }).then(function (data) {
                let base64Encode = `data:image/jpeg;base64,${data}`;
                return base64Encode;
            });

            await browser.close();

            res.json({ screenshot });
        });
});

// API endpoint for fetching DNS record value for a given domain name and record type (A, AAAA, CNAME, MX, NS, PTR, SOA, TXT)
app.get('/dns', (req, res) => {
    // Get the query parameters
    const name = req.query.name; // The domain name
    const type = req.query.type; // The record type

    // Validate the query parameters
    if (!name || !type) {
        // Send a bad request response if any parameter is missing
        res.status(400).send('Missing name or type parameter');
        return;
    }

    // Resolve the DNS record using the dns module
    dns.resolve(name, type, (err, records) => {
        if (err) {
            // Send an error response if there is any error
            res.status(500).send(err.message);
            return;
        }

        // Send a success response with the records in JSON format
        res.status(200).json(records);
    });

});


// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});