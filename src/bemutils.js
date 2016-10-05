#!/usr/bin/env node

const _ = require('lodash');

function startsWith(haystack, needle) {
    return haystack.substr(0, needle.length) == needle;
}

function isModifierName(className) {
    return className.indexOf('--') !== -1;
}

function isElementName(className) {
    return className.indexOf('__') !== -1;
}

function isBlockName(className) {
    return !isModifierName(className) && !isElementName(className);
}

function getClassList(node, prefixList = []) {
    const classAttribute = node.attr('class');
    if (!classAttribute) return [];

    const classList = classAttribute.split(' ');
    if (!classList.length) return [];

    const prefixedClassList = _.filter(classList, (className) => {
        if (!prefixList.length) return true;
        return _.find(prefixList, (prefix) => startsWith(className, prefix));
    });
    if (!prefixedClassList.length) return [];
    
    return prefixedClassList;
}

module.exports = (prefixList = []) => ({
    getBlockList(node) {
        const classList = getClassList(node, prefixList);
        const blockList = _.filter(classList, isBlockName);
        
        return blockList;
    },
    
    check(node, parentBlockList = []) {
        const classList = getClassList(node, prefixList);
        const blockList = _.filter(classList, isBlockName);
        
        _.map(classList, (className) => {
            if (isModifierName(className)) {
                const referenceName = className.substr(0, className.indexOf('--'));
                if (isElementName(className)) {
                    if (!_.includes(classList, referenceName)) {
                        console.log(`/!\\ Modifier "${className}" is not used on a "${referenceName}". Actual block "${classList.join(' ')}"`);
                    }
                } else if (!_.includes(blockList, referenceName)) {
                    console.log(`/!\\ Modifier "${className}" is not used on a "${referenceName}". Actual block "${blockList.join(' ')}"`);
                }
            } else if (isElementName(className)) {
                const blockName = className.substr(0, className.indexOf('__'));
                if (!_.includes(parentBlockList, blockName)) {
                    console.log(`/!\\ Element "${className}" is not used in a "${blockName}". Actual context "${parentBlockList.join(' ')}"`);
                }
            }
        });
    }
});