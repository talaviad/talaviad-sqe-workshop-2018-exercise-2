import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {parseSymbolic} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vectorInput = $('#vectorInput').val();
        let parsedCode = parseCode(codeToParse);
        let symbolicSubtitution = parseSymbolic(parsedCode,vectorInput);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        $('#symbolicSub').html(symbolicSubtitution);
    });
});
