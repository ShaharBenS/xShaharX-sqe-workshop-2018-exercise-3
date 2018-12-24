import * as esprima from 'esprima';
/* eslint-disable max-lines-per-function */


function CFGToGraph(CFG){
    let nodeDeclaration = 'node_'+CFG.id+'=>'+CFG.type+': '+(CFG.code.length === 0 ? '.' : CFG.code);
    let nextNodeDeclaration = '\n';
    let nextConnectionCode = '';
    CFG.next.forEach((node,index)=>{
        nextConnectionCode += 'node_'+CFG.id+(CFG.type === 'condition' ? (index === 0 ? '(yes)' : '(no)') : '')+'->'+'node_'+node.id+'\n';
    });
    CFG.next.forEach((node)=>{
        let childCode = CFGToGraph(node);
        nextConnectionCode += childCode.connectionCode;
        nextNodeDeclaration += childCode.nodesCode;
    });
    return {nodesCode:nodeDeclaration+nextNodeDeclaration,connectionCode: nextConnectionCode};
}


function ifToCFG(CFG,ifExpression){
    let continuationPoint = createEmptyBlock();
    continuationPoint.type = 'end';
    let alternate = ifExpression.alternate;
    // If
    let conditionBlock = createConditionBlockFromIf(ifExpression);
    let ifBody = blockToCFG(ifExpression.consequent,conditionBlock);
    ifBody.next.push(continuationPoint);
    conditionBlock.next.push(continuationPoint);
    CFG.next.push(conditionBlock);
    // Else if
    while(alternate != null && alternate.type === 'IfStatement'){
        let previousBlock = conditionBlock;
        conditionBlock = createConditionBlockFromIf(alternate);
        previousBlock.next.push(conditionBlock);
        ifBody = blockToCFG(alternate.consequent,conditionBlock);
        ifBody.next.push(continuationPoint);
        conditionBlock.next.push(continuationPoint);
        alternate = alternate.alternate;
    }
    // Else
    if(alternate != null){
        let elseBody = blockToCFG(alternate,conditionBlock);
        elseBody.next.push(continuationPoint);
        conditionBlock.next.push(elseBody);
    }
    return continuationPoint;
}

function blockToCFG(block, CFG){
    let currentBlock = createEmptyBlock();
    for(let i = 0; i < block.body.length; i++){
        let line = block.body[i];
        if (line.type === 'VariableDeclaration') { //TODO: support arrays vars.//if (statement.declarations[0].type === 'VariableDeclarator')
            currentBlock.code.push(expressionToString(line.declarations[0]));
        }
        else if (line.type === 'IfStatement') {
            CFG.next.push(currentBlock);
            CFG = ifToCFG(currentBlock,line);
            currentBlock = createEmptyBlock();
        }
        else if (line.type === 'ExpressionStatement') {
            if (line.expression.type === 'AssignmentExpression') {
                currentBlock.code.push(expressionToString(line.expression));
            }
            //TODO: add array support
            //TODO: check if there are more cases other than 'AssignmentExpression'
        }
        else if (line.type === 'WhileStatement') {
            /*substitutedCode += 'while('+substituteExpression(statement.test,vars)+')\n';
            let returnValue = substituteLine(statement.body,copyMap(vars),false,parsed_function_params);
            substitutedCode += returnValue.substitutedCode;*/
        }
        else /*if (statement.type === 'ReturnStatement')*/ {
            currentBlock.code.push(expressionToString(line));
            break;
        }
    }
    CFG.next.push(currentBlock);
    return currentBlock;
}

function functionToCFG(parsedFunction) {
    let root = new Node([],false,[],'root');
    blockToCFG(parsedFunction.body,root);
    return root;
}

function makeCFGTree(parsedCode) {
    let CFG;
    Array.prototype.forEach.call(parsedCode.body, (line) => {
        if (line.type === 'VariableDeclaration') {
            //TODO
        }
        if (line.type === 'FunctionDeclaration') {
            CFG = functionToCFG(line);
        }
    });
    return CFG;
}

let originalCode = '';
const CFGFromCode = (codeToParse) => {
    originalCode = codeToParse;
    let parsedCode = esprima.parseScript(codeToParse,{loc:true,range:true});
    let CFG = makeCFGTree(parsedCode);
    let result = CFGToGraph(CFG.next[0]);
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

function expressionToString(expression) {
    return originalCode.substring(expression.range[0],expression.range[1]);
}


function createConditionBlockFromIf(ifExpression){
    let block = createEmptyBlock();
    block.code = expressionToString(ifExpression.test);
    block.type = 'condition';
    return block;
}

function createEmptyBlock() {
    return new Node([],false,[],'operation');
}

let id = 0;
class Node{
    constructor(code,executed,next,type) {
        this.id = id++;
        this.next = next === undefined ? [] : next;
        this.code = code;
        this.executed = executed;
        this.type = type;
    }
}


export {CFGFromCode};



