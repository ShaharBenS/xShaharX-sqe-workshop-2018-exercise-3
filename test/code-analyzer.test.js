import assert from 'assert';
import {CFGFromCode, substituteVars} from '../src/js/code-analyzer';
/* eslint-disable max-lines-per-function,no-unused-vars,no-unused-function */

/*eslint complexity: [0, 0]*/

describe('The javascript parser', () => {
    it('is substituting expression 1' ,()=>{
        let vars = {x: 3, y: 6, z: [3,6]};
        let expresion = '((z[0] + z[1]) === x + y)';
        assert.equal(
            eval(substituteVars(expresion,vars)),true
        );
    });

    it('is substituting expression 2' ,()=>{
        let vars = {a: 'abc', b: 3, c: 1};
        let expresion = '(a.length === b * 1)';
        assert.equal(
            eval(substituteVars(expresion,vars)),true
        );
    });

    it('is substituting expression 3' ,()=>{
        let vars = {vvvvv: 5, vvvv: 4, vvv: 3, vv: 2, v : 1};
        let expresion = 'vvvvv * vvvv * vvv * vv * v';
        assert.equal(
            eval(substituteVars(expresion,vars)),120
        );
    });

    it('is parsing example function 1', () => {
        let codeToParse = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n';

        let CFG = CFGFromCode(codeToParse,[1,2,3]);

        assert.equal(
            CFG,
            'node_1=>operation:  (1)\n' +
            'a = x + 1\n' +
            'b = a + y\n' +
            'c = 0|past\n' +
            'node_3=>condition:  (3)\n' +
            'b < z|past\n' +
            'node_4=>operation:  (4)\n' +
            'c = c + 5\n' +
            'node_2=>end:  (2)|past\n' +
            'node_8=>operation:  (8)\n' +
            'return c;|past\n' +
            'node_5=>condition:  (5)\n' +
            'b < z * 2|past\n' +
            'node_6=>operation:  (6)\n' +
            'c = c + x + 5|past\n' +
            'node_7=>operation:  (7)\n' +
            'c = c + z + 5\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3(yes)->node_4\n' +
            'node_3(no)->node_2\n' +
            'node_3(no)->node_5\n' +
            'node_4->node_2\n' +
            'node_2->node_8\n' +
            'node_5(yes)->node_6\n' +
            'node_5(no)->node_2\n' +
            'node_5(no)->node_7\n' +
            'node_6->node_2\n' +
            'node_7->node_2\n'
        );
    });

    it('is parsing example function 2', () => {
        let codeToParse = 'function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a++;\n' +
            '   }\n' +
            '   \n' +
            '   return z;\n' +
            '}\n';

        let CFG = CFGFromCode(codeToParse,[1,2,3]);

        assert.equal(
            CFG,
            'node_1=>operation:  (1)\n' +
            'a = x + 1\n' +
            'b = a + y\n' +
            'c = 0|past\n' +
            'node_3=>operation:  (3)\n' +
            'NULL|past\n' +
            'node_2=>condition:  (2)\n' +
            'a < z|past\n' +
            'node_4=>operation:  (4)\n' +
            'c = a + b\n' +
            'z = c * 2\n' +
            'a++|past\n' +
            'node_5=>operation:  (5)\n' +
            'return z;|past\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3->node_2\n' +
            'node_2(yes)->node_4\n' +
            'node_2(no)->node_5\n' +
            'node_4->node_2\n'
        );
    });

    it('is parsing custom function 1', () => {
        let codeToParse = 'function secondsToTime(seconds_number){\n' +
            '    let hours   = Math.floor(seconds_number / 3600);\n' +
            '    let minutes = Math.floor((seconds_number - (hours * 3600)) / 60);\n' +
            '    let seconds = seconds_number - (hours * 3600) - (minutes * 60);\n' +
            '\n' +
            '    if (hours   < 10) {hours   = \'0\'+hours;}\n' +
            '    if (minutes < 10) {minutes = \'0\'+minutes;}\n' +
            '    if (seconds < 10) {seconds = \'0\'+seconds;}\n' +
            '    return hours+\':\'+minutes+\':\'+seconds;\n' +
            '}';

        let CFG = CFGFromCode(codeToParse,[166]);
        let flowchart = 'node_1=>operation:  (1)\n' +
            'hours   = Math.floor(seconds_number / 3600)\n' +
            'minutes = Math.floor((seconds_number - (hours * 3600)) / 60)\n' +
            'seconds = seconds_number - (hours * 3600) - (minutes * 60)|past\n' +
            'node_3=>condition:  (3)\n' +
            'hours   < 10|past\n' +
            'node_4=>operation:  (4)\n' +
            'hours   = \'0\'+hours|past\n' +
            'node_2=>end:  (2)|past\n' +
            'node_7=>condition:  (7)\n' +
            'minutes < 10|past\n' +
            'node_8=>operation:  (8)\n' +
            'minutes = \'0\'+minutes|past\n' +
            'node_6=>end:  (6)|past\n' +
            'node_11=>condition:  (11)\n' +
            'seconds < 10|past\n' +
            'node_12=>operation:  (12)\n' +
            'seconds = \'0\'+seconds\n' +
            'node_10=>end:  (10)|past\n' +
            'node_13=>operation:  (13)\n' +
            'return hours+\':\'+minutes+\':\'+seconds;|past\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3(yes)->node_4\n' +
            'node_3(no)->node_2\n' +
            'node_4->node_2\n' +
            'node_2->node_7\n' +
            'node_7(yes)->node_8\n' +
            'node_7(no)->node_6\n' +
            'node_8->node_6\n' +
            'node_6->node_11\n' +
            'node_11(yes)->node_12\n' +
            'node_11(no)->node_10\n' +
            'node_12->node_10\n' +
            'node_10->node_13\n';
        assert.equal(
            CFG,flowchart
        );
    });

    it('is parsing custom function 2', () => {
        let codeToParse = 'function func(arg1,arg2) {\n' +
            '    let global1 = \'abc\';\n' +
            '    let global2 = \'abc3\';\n' +
            '    let a = arg1;\n' +
            '    \n' +
            '    if(global1+a === global2){\n' +
            '        if(arg2){\n' +
            '            return global1;\n' +
            '        }\n' +
            '        else if(!arg2){\n' +
            '            return a;\n' +
            '        }\n' +
            '    }\n' +
            '    return -1;\n' +
            '}';

        let CFG = CFGFromCode(codeToParse,['3',0]);
        let flowchart = 'node_1=>operation:  (1)\n' +
            'global1 = \'abc\'\n' +
            'global2 = \'abc3\'\n' +
            'a = arg1|past\n' +
            'node_3=>condition:  (3)\n' +
            'global1+a === global2|past\n' +
            'node_6=>condition:  (6)\n' +
            'arg2|past\n' +
            'node_7=>operation:  (7)\n' +
            'return global1;\n' +
            'node_5=>end:  (5)|past\n' +
            'node_2=>end:  (2)|past\n' +
            'node_11=>operation:  (11)\n' +
            'return -1;|past\n' +
            'node_8=>condition:  (8)\n' +
            '!arg2|past\n' +
            'node_9=>operation:  (9)\n' +
            'return a;|past\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3(yes)->node_6\n' +
            'node_3(no)->node_2\n' +
            'node_6(yes)->node_7\n' +
            'node_6(no)->node_5\n' +
            'node_6(no)->node_8\n' +
            'node_7->node_5\n' +
            'node_5->node_2\n' +
            'node_2->node_11\n' +
            'node_8(yes)->node_9\n' +
            'node_8(no)->node_5\n' +
            'node_9->node_5\n';
        assert.equal(
            CFG,flowchart
        );
    });

    it('is parsing custom function 3', () => {
        let codeToParse = 'function foo(b)\n' +
            '{\n' +
            '    let a = 0;\n' +
            '    let c = [1, 2];\n' +
            '    c[0] = 3;\n' +
            '    while (c[0] < b[1]) {\n' +
            '        a++;\n' +
            '        c[0] = c[0] + 1;\n' +
            '    }\n' +
            '    return a;\n' +
            '}';

        let CFG = CFGFromCode(codeToParse,[[0,6]]);
        let flowchart = 'node_1=>operation:  (1)\n' +
            'a = 0\n' +
            'c = [1, 2]\n' +
            'c[0] = 3|past\n' +
            'node_3=>operation:  (3)\n' +
            'NULL|past\n' +
            'node_2=>condition:  (2)\n' +
            'c[0] < b[1]|past\n' +
            'node_4=>operation:  (4)\n' +
            'a++\n' +
            'c[0] = c[0] + 1|past\n' +
            'node_5=>operation:  (5)\n' +
            'return a;|past\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3->node_2\n' +
            'node_2(yes)->node_4\n' +
            'node_2(no)->node_5\n' +
            'node_4->node_2\n';
        assert.equal(
            CFG,flowchart
        );
    });

    it('is parsing custom function 4', () => {
        let codeToParse = 'function hateCoverage(a,b,c){\n' +
            '    if(a > b){\n' +
            '        return a + b + c;\n' +
            '    }\n' +
            '    else if(b > c){\n' +
            '        return 1;\n' +
            '    }\n' +
            '    else{\n' +
            '        while(b > c){\n' +
            '            return 0;\n' +
            '        }\n' +
            '    }\n' +
            '    return 666;\n' +
            '}';

        let CFG = CFGFromCode(codeToParse,[1,2,3]);
        let flowchart = 'node_3=>condition:  (3)\n' +
            'a > b|past\n' +
            'node_4=>operation:  (4)\n' +
            'return a + b + c;\n' +
            'node_2=>end:  (2)|past\n' +
            'node_12=>operation:  (12)\n' +
            'return 666;|past\n' +
            'node_5=>condition:  (5)\n' +
            'b > c|past\n' +
            'node_6=>operation:  (6)\n' +
            'return 1;\n' +
            'node_9=>operation:  (9)\n' +
            'NULL|past\n' +
            'node_8=>condition:  (8)\n' +
            'b > c|past\n' +
            'node_10=>operation:  (10)\n' +
            'return 0;\n' +
            '\n' +
            'node_3(yes)->node_4\n' +
            'node_3(no)->node_2\n' +
            'node_3(no)->node_5\n' +
            'node_4->node_2\n' +
            'node_2->node_12\n' +
            'node_5(yes)->node_6\n' +
            'node_5(no)->node_2\n' +
            'node_5(no)->node_9\n' +
            'node_6->node_2\n' +
            'node_9->node_8\n' +
            'node_8(yes)->node_10\n' +
            'node_8(no)->node_2\n' +
            'node_10->node_8\n';
        assert.equal(
            CFG,flowchart
        );
    });

    it('is parsing custom function 5', () => {
        let codeToParse = 'function IFIFIF(a, b, c, d, e)\n' +
            '{\n' +
            '    let ab = a + b;\n' +
            '    let bc = c + d;\n' +
            '    let cd = c + d;\n' +
            '    let de = d + e;\n' +
            '\n' +
            '    if (ab > bc) {\n' +
            '        if (cd < ab) {\n' +
            '            return -1;\n' +
            '        }\n' +
            '        else if(ab < de){\n' +
            '            return -1;\n' +
            '        }\n' +
            '        else if(cd > de){\n' +
            '            while (ab < bc) {\n' +
            '                bc++;\n' +
            '            }\n' +
            '        }\n' +
            '        else {\n' +
            '            while (ab > bc) {\n' +
            '                bc--;\n' +
            '            }\n' +
            '        }\n' +
            '    }\n' +
            '    else if (bc > cd) {\n' +
            '        if (cd > 0) {\n' +
            '            if (de > ab) {\n' +
            '                return de;\n' +
            '            }\n' +
            '        }\n' +
            '        else if(cd < 0){\n' +
            '            return -1;\n' +
            '        }\n' +
            '    }\n' +
            '    else {\n' +
            '        return ab * bc;\n' +
            '    }\n' +
            '    return de;\n' +
            '}';

        let CFG = CFGFromCode(codeToParse,[5,4,3,2,1]);
        let flowchart = 'node_1=>operation:  (1)\n' +
            'ab = a + b\n' +
            'bc = c + d\n' +
            'cd = c + d\n' +
            'de = d + e|past\n' +
            'node_3=>condition:  (3)\n' +
            'ab > bc|past\n' +
            'node_6=>condition:  (6)\n' +
            'cd < ab|past\n' +
            'node_7=>operation:  (7)\n' +
            'return -1;|past\n' +
            'node_5=>end:  (5)|past\n' +
            'node_2=>end:  (2)|past\n' +
            'node_35=>operation:  (35)\n' +
            'return de;|past\n' +
            'node_8=>condition:  (8)\n' +
            'ab < de\n' +
            'node_9=>operation:  (9)\n' +
            'return -1;\n' +
            'node_10=>condition:  (10)\n' +
            'cd > de\n' +
            'node_13=>operation:  (13)\n' +
            'NULL\n' +
            'node_12=>condition:  (12)\n' +
            'ab < bc\n' +
            'node_14=>operation:  (14)\n' +
            'bc++\n' +
            'node_18=>operation:  (18)\n' +
            'NULL\n' +
            'node_17=>condition:  (17)\n' +
            'ab > bc\n' +
            'node_19=>operation:  (19)\n' +
            'bc--\n' +
            'node_22=>condition:  (22)\n' +
            'bc > cd\n' +
            'node_25=>condition:  (25)\n' +
            'cd > 0\n' +
            'node_28=>condition:  (28)\n' +
            'de > ab\n' +
            'node_29=>operation:  (29)\n' +
            'return de;\n' +
            'node_27=>end:  (27)\n' +
            'node_24=>end:  (24)\n' +
            'node_31=>condition:  (31)\n' +
            'cd < 0\n' +
            'node_32=>operation:  (32)\n' +
            'return -1;\n' +
            'node_34=>operation:  (34)\n' +
            'return ab * bc;\n' +
            '\n' +
            'node_1->node_3\n' +
            'node_3(yes)->node_6\n' +
            'node_3(no)->node_2\n' +
            'node_3(no)->node_22\n' +
            'node_6(yes)->node_7\n' +
            'node_6(no)->node_5\n' +
            'node_6(no)->node_8\n' +
            'node_7->node_5\n' +
            'node_5->node_2\n' +
            'node_2->node_35\n' +
            'node_8(yes)->node_9\n' +
            'node_8(no)->node_5\n' +
            'node_8(no)->node_10\n' +
            'node_9->node_5\n' +
            'node_10(yes)->node_13\n' +
            'node_10(no)->node_5\n' +
            'node_10(no)->node_18\n' +
            'node_13->node_12\n' +
            'node_12(yes)->node_14\n' +
            'node_12(no)->node_5\n' +
            'node_14->node_12\n' +
            'node_18->node_17\n' +
            'node_17(yes)->node_19\n' +
            'node_17(no)->node_5\n' +
            'node_19->node_17\n' +
            'node_22(yes)->node_25\n' +
            'node_22(no)->node_2\n' +
            'node_22(no)->node_34\n' +
            'node_25(yes)->node_28\n' +
            'node_25(no)->node_24\n' +
            'node_25(no)->node_31\n' +
            'node_28(yes)->node_29\n' +
            'node_28(no)->node_27\n' +
            'node_29->node_27\n' +
            'node_27->node_24\n' +
            'node_24->node_2\n' +
            'node_31(yes)->node_32\n' +
            'node_31(no)->node_24\n' +
            'node_32->node_24\n' +
        'node_34->node_2\n';
        assert.equal(
            CFG,flowchart
        );
    });


});
