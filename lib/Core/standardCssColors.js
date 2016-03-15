'use strict';

var standardCssColors = {

// Colors are from Kelly's 1965 paper 'Twenty-two colors of maximum contrast'
// http://www.iscc.org/pdf/PC54_1724_001.pdf
// - with black removed (it was the second color).
    highContrast: [
        '#FFFFFF',
        '#EAD846',
        '#6F0989',
        '#D9712A',
        '#97C9E4',
        '#B82035',
        '#C3C385',
        '#7F8082',
        '#62AC49',
        '#CE81AD',
        '#476CB3',
        '#DB8963',
        '#491093',
        '#DFAA36',
        '#8F0189',
        '#E7F45E',
        '#7C1B15',
        '#94B741',
        '#6C3715',
        '#D03227',
        '#2B3916'
    ],

     // From ColorBrewer2.org, 9-class Set1 (ie. qualitative).
    brewer9ClassSet1: [
        '#e41a1c',
        '#377eb8',
        '#4daf4a',
        '#984ea3',
        '#ff7f00',
        '#ffff33',
        '#a65628',
        '#f781bf',
        '#999999'
    ]

};

module.exports = standardCssColors;
