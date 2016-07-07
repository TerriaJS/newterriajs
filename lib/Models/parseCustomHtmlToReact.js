'use strict';

const React = require('react');
const HtmlToReact = require('html-to-react');
const combine = require('terriajs-cesium/Source/Core/combine');
const defined = require('terriajs-cesium/Source/Core/defined');

const CustomComponents = require('./CustomComponents');


const htmlToReactParser = new HtmlToReact.Parser(React);
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);

const isValidNode = function() {
    return true;
};

const shouldProcessEveryNodeExceptWhiteSpace = function(node) {
    // Use this to avoid white space between table elements, eg.
    //     <table> <tbody> <tr>\n<td>x</td> <td>3</td> </tr> </tbody> </table>
    // being rendered as empty <span> elements, and causing React errors.
    return node.type !== 'text' || node.data.trim();
};

let keyIndex = 0;

function getProcessingInstructions(catalogItem, feature) {

    function boundProcessor(processor) {
        return {
            shouldProcessNode: processor.shouldProcessNode,
            processNode: processor.processNode.bind(null, catalogItem, feature)
        };
    }

    // Process custom nodes specially.
    let processingInstructions = [];
    const customComponents = CustomComponents.values();
    for (let i = 0; i < customComponents.length; i++) {
        const customComponent = customComponents[i];
        processingInstructions.push({
            shouldProcessNode: node => (node.name === customComponent.name),
            processNode: customComponent.processNode.bind(null, catalogItem, feature)
        });
        const processors = customComponent.furtherProcessing;
        if (defined(processors)) {
            processingInstructions = processingInstructions.concat(
                processors.map(boundProcessor)
            );
        }
    }

    // Make sure any <a href> tags open in a new window
    processingInstructions.push({
        shouldProcessNode: node => node.name === 'a',
        processNode: function(node, children) {
            return React.createElement('a', combine({
                displayName: 'a',
                key: 'anchor-' + (keyIndex++),
                target: '_blank'
            }, node.attribs), node.data, children);
        }
    });

    // Process all other nodes as normal.
    processingInstructions.push({
        shouldProcessNode: shouldProcessEveryNodeExceptWhiteSpace,
        processNode: processNodeDefinitions.processDefaultNode
    });
    return processingInstructions;
}

function parseCustomHtmlToReact(html, catalogItem, feature) {
    if (!defined(html) || html.length === 0) {
        return html;
    }
    return htmlToReactParser.parseWithInstructions(html, isValidNode, getProcessingInstructions(catalogItem, feature));
}

module.exports = parseCustomHtmlToReact;
