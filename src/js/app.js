import $ from 'jquery';
import {CFGFromCode} from './code-analyzer';

let input_counter = 0;
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let CFG = CFGFromCode(codeToParse);
        $('#parsedCode').val(CFG);
    });

    $('#add-input-button').click(()=>{
        let element = document.createElement('input');
        element.type = 'text';
        element.id = 'input_'+input_counter++;
        document.getElementById('input_div').appendChild(element);
    });
});
