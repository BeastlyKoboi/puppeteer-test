'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');

const getQuoteTopics = async () => {
    const topicsSelector = '.topicContentName';

    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    await page.goto('https://www.brainyquote.com/topics');

    await page.waitForSelector(topicsSelector);

    let topicsData = await page.evaluate(selector => {
        const topicSpans = Array.from(document.querySelectorAll(selector));
        const topicsStrings = topicSpans.map(
            topicSpan => topicSpan.innerText
                .replace(/'/g, '')
                .replace(/ /g, '-')
        );

        return topicsStrings;
    }, topicsSelector);

    await browser.close();

    fs.writeFileSync(`data/topics.json`, JSON.stringify(topicsData, null, 2));
};

const getTopicalQuotesFromBrainy = async (topic = 'funny-quotes', pageCount = 1) => {

    let browser;
    let page;
    const quotesSelector = '.grid-item';
    let data = [];

    for (let i = 0; i < pageCount; i++) {
        browser = await puppeteer.launch({
            headless: false
        });

        page = await browser.newPage();

        await page.goto(`https://www.brainyquote.com/topics/${topic}_${i + 1}`);

        await page.waitForSelector(quotesSelector);

        let newData = await page.evaluate(selector => {
            const nodes = Array.from(document.querySelectorAll(selector));
            let quotes = nodes.map(node => {
                let quote = Array.from(node.querySelectorAll('a[title="view quote"]')).reverse()[0];
                let author = node.querySelector('a[title="view author"]');

                if (!quote || !author) return null;

                return [quote.firstElementChild.innerText, author.innerText];
            });
            quotes = quotes.filter((quote) => { return quote });
            return quotes;


        }, quotesSelector);

        data = [...data, ...newData];

        await browser.close();
    }
    console.log(data);

    fs.writeFileSync(`data/${topic}.json`, JSON.stringify(data, null, 2));
}

const getQuotesFromTopics = async (topics = []) => {

    for (let i = 0; i < topics.length; i++) {
        await getTopicalQuotesFromBrainy(topics[i], 1);
    }

}

getQuoteTopics();

let givenTopics = fs.readFileSync('data/topics.json');
givenTopics = JSON.parse(givenTopics);
// givenTopics.splice(20);
getQuotesFromTopics(givenTopics);