import $ from 'jquery';
import {CFGFromCode} from './code-analyzer';
import * as flowchart from 'flowchart.js';

let properties = {
    'x': 0,
    'y': 0,
    'line-width': 3,
    'line-length': 50,
    'text-margin': 10,
    'font-size': 14,
    'font-color': 'black',
    'line-color': 'black',
    'element-color': 'black',
    'fill': 'white',
    'yes-text': 'T',
    'no-text': 'F',
    'arrow-end': 'block',
    'scale': 1,
    // style symbol types
    'symbols': {
        'start': {
            'font-color': 'red',
            'element-color': 'green',
            'fill': 'yellow'
        },
        'end':{
            'class': 'end-element'
        }
    },
    // even flowstate support ;-)
    'flowstate' : {
        'past' : { 'fill' : '#0dcc08', 'font-size' : 12},
        // 'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
        // 'future' : { 'fill' : '#FFFF99'},
        // 'request' : { 'fill' : 'blue'}//,
        // 'invalid': {'fill' : '#444444'},
        // 'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'APPROVED', 'no-text' : 'n/a' },
        // 'rejected' : { 'fill' : '#C45879', 'font-size' : 12, 'yes-text' : 'n/a', 'no-text' : 'REJECTED' }
    }
};

let input_counter = 0;
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        document.getElementById('diagram').innerHTML = '';
        let codeToParse = $('#codePlaceholder').val();
        let inputs = [];
        for(let i = 0; i < input_counter; i++){
            inputs.push(document.getElementById('input_'+i).value);
        }
        let CFG = CFGFromCode(codeToParse,inputs);
        let diagram = flowchart.parse(CFG);
        diagram.drawSVG('diagram',properties);
        $('#parsedCode').val(CFG);
    });
    $('#add-input-button').click(()=>{
        let element = document.createElement('input');
        element.type = 'text';
        element.id = 'input_'+input_counter++;
        document.getElementById('input_div').appendChild(element);
    });
});
