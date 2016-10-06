#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const bem = require('./bemutils');
const path = require('path');
const open = require('open');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const minimist = require('minimist');

function getTree($, node, parentBlockList = []) {
    const blockList = bemUtils.getBlockList(node);
    
    let children = [];
    const childrenBlockList = [...blockList, ...parentBlockList];
    node.children().each((index, child) => {
        let subTree = getTree($, $(child), childrenBlockList);
        if (!Array.isArray(subTree)) subTree = [subTree];
        children = [...children, ...subTree];
        children = _.reduce(children, (result, value) => {
            const duplicate = _.find(result, {name: value.name, children: value.children});
            if (duplicate) {
                duplicate.count++;
            } else {
                result.push(value);
            }
            return result;
        }, []);
    });

    if (!blockList.length) {
        return children;
    }

    return {name: blockList.join(' '), count: 1, children};
}

function parsePage(url, rootQuery) {
    return fetch(url)
        .then((response) => response.text())
        .then(html => cheerio.load(html))
        .then($ => {
            let tree = getTree($, $(rootQuery).first());
            if (Array.isArray(tree)) {
                if (tree.length == 1) {
                    tree = tree[0];
                } else {
                    tree = {name: ':root', children: tree}
                }
            }
                
            fs.readFile(`${__dirname}/template.html`, 'utf8', (err, template) => {
                if (err) throw err;
                const output = template.replace('"#data#"', `[${JSON.stringify(tree)}]`);
                const outputFile = path.resolve('./bemview.html');
                fs.writeFile(outputFile, output, 'utf8', (err) => {
                    if (err) throw err;
                    open(outputFile);
                });
            });
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
