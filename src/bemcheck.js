#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const bem = require('./bemutils');
const path = require('path');
const open = require('open');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const minimist = require('minimist');

function walk($, node, parentBlockList = []) {
    bemUtils.check(node, parentBlockList);
    
    const blockList = bemUtils.getBlockList(node);
    const childrenBlockList = [...blockList, ...parentBlockList];
    node.children().each((index, child) => {
        walk($, $(child), childrenBlockList);
    });
}

function parsePage(url, rootQuery) {
    fetch(url)
        .then((response) => response.text())
        .then(html => cheerio.load(html))
        .then($ => {
            walk($, $(rootQuery).first());
        })
        .catch((error) => {
            console.dir(error);
        })
    ;
}

// Main
const argv = minimist(process.argv.slice(2));
if (argv['_'].length < 1) {
    console.log(`Usage: npm run bemcheck <url> -- (-r <root-query>) (-p <list,of,filtering,prefix>)`);
    process.exit();
}

const url = argv['_'][0];
const rootQuery = argv['r'] ? argv['r'] : 'body';
const prefixList = argv['p'] ? argv['p'].replace(' ', '').split(',') : [];
const bemUtils = bem(prefixList);
parsePage(url, rootQuery);
