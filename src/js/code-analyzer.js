import * as esprima from 'esprima';
/* eslint-disable max-lines-per-function,no-unused-vars,no-unused-function */

/* eslint complexity: [0, 0] */

function copyMap(map)
{
    let new_map = new Map();
    Array.prototype.forEach.call(Object.keys(map), (key) =>
    {
        new_map[key] = map[key];
    });
    return new_map;
}

function CFGToGraph(CFG, doneNodes)
{
    if (doneNodes.includes(CFG.id)) {
        return;
    }
    doneNodes.push(CFG.id);

    let nodeDeclaration = 'node_' + CFG.id + '=>' + CFG.type + ': ' + CFGToBlockText(CFG) + (CFG.executed ? '|past' : '');
    let nextNodeDeclaration = '\n';
    let nextConnectionCode = '';

    CFG.next.forEach((node, index) =>
    {
        nextConnectionCode += 'node_' + CFG.id + (CFG.type === 'condition' ? (index === 0 ? '(yes)' : '(no)') : '') + '->' + 'node_' + node.id + '\n';
    });
    CFG.next.forEach((node) =>
    {
        let childCode = CFGToGraph(node, doneNodes);
        if (childCode !== undefined) {
            nextConnectionCode += childCode.connectionCode;
            nextNodeDeclaration += childCode.nodesCode;
        }
    });
    return {nodesCode: nodeDeclaration + nextNodeDeclaration, connectionCode: nextConnectionCode};
}


function ifToCFG(CFG, ifExpression, vars, executed)
{
    let evalElse = true;
    let continuationPoint = createEmptyBlock();
    continuationPoint.executed = executed;
    continuationPoint.type = 'end';
    let alternate = ifExpression.alternate;
    // If
    let conditionBlock = createConditionBlockFromIf(ifExpression);
    if (executed) {
        conditionBlock.executed = true;
        if (eval(substituteVars(expressionToString(ifExpression.test), vars))) {
            evalElse = false;
        }
    }
    let ifBody = blockToCFG(ifExpression.consequent, conditionBlock, copyMap(vars), executed && !evalElse);
    ifBody.next.push(continuationPoint);
    conditionBlock.next.push(continuationPoint);
    CFG.next.push(conditionBlock);
    // Else if
    while (alternate != null && alternate.type === 'IfStatement') {
        let previousBlock = conditionBlock;
        conditionBlock = createConditionBlockFromIf(alternate);
        let shouldRun = false;
        if (evalElse) {
            if (executed) {
                conditionBlock.executed = true;
                if (eval(substituteVars(expressionToString(alternate.test), vars))) {
                    evalElse = false;
                    shouldRun = true;
                }
            }
        }
        previousBlock.next.push(conditionBlock);
        ifBody = blockToCFG(alternate.consequent, conditionBlock, copyMap(vars), executed && shouldRun);
        ifBody.next.push(continuationPoint);
        conditionBlock.next.push(continuationPoint);
        alternate = alternate.alternate;
    }
    // Else
    if (alternate != null) {
        let elseBody = blockToCFG(alternate, conditionBlock, copyMap(vars), executed && evalElse);
        elseBody.next.push(continuationPoint);
    }
    return continuationPoint;
}

function blockToCFG(block, CFG, vars, executed)
{
    let currentBlock = createEmptyBlock();
    currentBlock.executed = executed;
    for (let i = 0; i < block.body.length; i++) {
        let line = block.body[i];
        if (line.type === 'VariableDeclaration') { //TODO: support arrays vars.//if (statement.declarations[0].type === 'VariableDeclarator')
            let expression = substituteVars(expressionToString(line.declarations[0].init), vars);
            vars[line.declarations[0].id.name] = eval(expression);

            currentBlock.code.push(expressionToString(line.declarations[0]));
        }
        else if (line.type === 'IfStatement') {
            if (currentBlock.type === 'operation' && currentBlock.code.length === 0) {
                CFG = ifToCFG(CFG, line, vars, executed);
            }
            else {
                CFG.next.push(currentBlock);
                CFG = ifToCFG(currentBlock, line, vars, executed);
            }
            currentBlock = createEmptyBlock();
            currentBlock.executed = executed;
        }
        else if (line.type === 'ExpressionStatement') {
            if (line.expression.type === 'AssignmentExpression') {
                let expression = substituteVars(expressionToString(line.expression.right), vars);

                if(line.expression.left.type === 'MemberExpression'){
                    vars[line.expression.left.object.name][eval(substituteVars(expressionToString(line.expression.left.property),vars))] = eval(expression);
                }
                else{
                    vars[line.expression.left.name] = eval(expression);
                }
                currentBlock.code.push(expressionToString(line.expression));
            }
            if (line.expression.type === 'UpdateExpression') {
                if (line.expression.operator === '++') {
                    vars[line.expression.argument.name]++;
                }
                else {
                    vars[line.expression.argument.name]--;
                }
                currentBlock.code.push(expressionToString(line.expression));
            }

            //TODO: add array support
            //TODO: check if there are more cases other than 'AssignmentExpression'
        }
        else if (line.type === 'WhileStatement') {
            let conditionBlock = createConditionBlockFromIf(line);
            let nullBlock = createEmptyBlock();
            nullBlock.executed = executed;

            if (currentBlock.type === 'operation' && currentBlock.code.length === 0) {
                CFG.next.push(nullBlock);
            }
            else {
                CFG.next.push(currentBlock);
                currentBlock.next.push(nullBlock);
            }
            CFG = conditionBlock;
            let runBody = false;
            if (executed) {
                conditionBlock.executed = true;
                if (eval(substituteVars(expressionToString(line.test), vars))) {
                    runBody = true;
                }
            }
            let whileBody = blockToCFG(line.body, CFG, copyMap(vars), executed && runBody);
            whileBody.next.push(conditionBlock);

            nullBlock.code.push('NULL');
            nullBlock.next.push(conditionBlock);
            currentBlock = createEmptyBlock();
            currentBlock.executed = executed;
        }
        else /*if (statement.type === 'ReturnStatement')*/ {
            currentBlock.code.push(expressionToString(line));
            break;
        }
    }
    if(currentBlock.code.length !== 0){
        CFG.next.push(currentBlock);
        CFG = currentBlock;
    }
    return CFG;
}

function functionToCFG(parsedFunction, inputs)
{
    let root = new Node([], false, [], 'root');
    let params = {};
    parsedFunction.params.forEach((param, index) =>
    {
        params[param.name] = eval(inputs[index]);
    });
    blockToCFG(parsedFunction.body, root, params, true);
    return root;
}

function makeCFGTree(parsedCode, inputs)
{
    let CFG;
    Array.prototype.forEach.call(parsedCode.body, (line) =>
    {
        /*if (line.type === 'VariableDeclaration') {
            //TODO
        }
        if (line.type === 'FunctionDeclaration') {*/
        CFG = functionToCFG(line, inputs);
        /*}*/
    });
    return CFG;
}

let originalCode = '';
const CFGFromCode = (codeToParse, inputs) =>
{
    id = 0;
    originalCode = codeToParse;
    let parsedCode = esprima.parseScript(codeToParse, {loc: true, range: true});
    let CFG = makeCFGTree(parsedCode, inputs);
    let result = CFGToGraph(CFG.next[0], []);
    return result.nodesCode + '\n' + result.connectionCode;
};


/*


  _    _      _                   ______                _   _
 | |  | |    | |                 |  ____|              | | (_)
 | |__| | ___| |_ __   ___ _ __  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___
 |  __  |/ _ \ | '_ \ / _ \ '__| |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
 | |  | |  __/ | |_) |  __/ |    | |  | |_| | | | | (__| |_| | (_) | | | \__ \
 |_|  |_|\___|_| .__/ \___|_|    |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
               | |
               |_|


 */

function expressionToString(expression)
{
    return originalCode.substring(expression.range[0], expression.range[1]);
}


function createConditionBlockFromIf(ifExpression)
{
    let block = createEmptyBlock();
    block.code = [expressionToString(ifExpression.test)];
    block.type = 'condition';
    return block;
}

function createEmptyBlock()
{
    return new Node([], false, [], 'operation');
}

/**
 * @return {string}
 */
function CFGToBlockText(CFG)
{
    let string = ' ';
    string += '(' + CFG.id + ')' + '\n';
    Array.prototype.forEach.call(CFG.code, (line) =>
    {
        string += line + '\n';
    });
    //CFG.code.forEach();
    return string.substring(0, string.length - 1);
}

let id = 0;

class Node
{
    constructor(code, executed, next, type)
    {
        this.id = id++;
        this.next = next;
        this.code = code;
        this.executed = executed;
        this.type = type;
    }
}


let legalCharacters = ['+', '-', '/', '*', '<', '>', '=', '&', '|', '(', ')', ';', ',', '^', '[', ']', '.', '!'];
let charactersParenthesisRight = ['/', '*', '(', '[', '.'];
let charactersParenthesisLeft = ['/', '*', ')', '!'];

function substituteVars(expression, vars)
{
    Array.prototype.forEach.call(Object.keys(vars), (key) =>
    {
        let indices = getIndicesOf(key, expression);
        indices.reverse();
        Array.prototype.forEach.call(indices, (index) =>
        {
            let start_left = index, start_right = index + key.length - 1;
            while (expression[--start_left] === ' ') {/*MAGIC*/
            }
            while (expression[++start_right] === ' ') {/*MAGIC*/
            }
            let should_substitute = false;
            let with_parenthesis = false;
            if (start_left < 0) {
                if (start_right === expression.length) {
                    //Substitute and no parenthesis
                    should_substitute = true;
                }
                else if (legalCharacters.includes(expression[start_right])) {
                    // Substitute
                    should_substitute = true;
                    if (charactersParenthesisRight.includes(expression[start_right])) {
                        //Put parenthesis
                        with_parenthesis = true;
                    }
                    else {
                        // No parenthesis
                    }
                }
            }
            else {
                if (start_right === expression.length) {
                    if (legalCharacters.includes(expression[start_left])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression[start_left])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        }
                        else {
                            // No parenthesis
                        }
                    }
                }
                else {
                    if (legalCharacters.includes(expression[start_left]) && legalCharacters.includes(expression[start_right])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression[start_left]) || charactersParenthesisRight.includes(expression[start_right])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        }
                        else {
                            // No parenthesis
                        }
                    }
                }
            }
            if (should_substitute) {
                let new_string = JSON.stringify(vars[key]);
                if (with_parenthesis) {
                    new_string = '(' + new_string + ')';
                }
                expression = expression.substr(0, index) + new_string + expression.substr(index + key.length);
            }

        });
    });
    return expression;
}


function getIndicesOf(searchStr, str)
{
    let searchStrLen = searchStr.length;
    let startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

export {CFGFromCode, substituteVars};



