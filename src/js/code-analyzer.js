import * as esprima from 'esprima';

let globalsMap = new Map();
let functionParamsMap;
let vectorInp = [1 , 2 , 3];
let dummyVector = [] ;
let outputLines = [];
let color = [];
let initialFunctionParams;

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

/*function logMapElements(value, key, map) {
    console.log(`m[${key}] = ${value['symbolicVal']}`);
    console.log(`m[${key}] = ${value['value']}`);
}*/

const initializeVectorInput = (vectorInput) => {
    //{ "x" : 6 , "Y" : 9 , "z" : 20 }  with no error
    //{ "x" : { "x" : 6 , "Y" : 9 , "z" : 20 } , "Y" : 9 , "z" : 20 }  with error
    //alert(vectorInput.length );
    if (vectorInput.length === 0) return [];
    let vecObj = JSON.parse(vectorInput);
    let isObj = (typeof vecObj === 'object');
    if (!isObj) return vecObj;
    let vectorInp = Object.keys(vecObj).map(function(key) {
        return [key, initializeVectorInput(JSON.stringify(vecObj[key]))];
    });
    vectorInp = vectorInp.map(function(arr) { return arr[1]; });
    return vectorInp;
};

const parseSymbolic = (jsonObj,vectorInput) => {
    //initiazlie
    globalsMap = new Map();
    functionParamsMap = new Map();
    outputLines = [];
    color = [];
    dummyVector = [ 0 ];
    vectorInp = initializeVectorInput(vectorInput);
    AnalyzeGlobals(jsonObj);
    let lengthOfProgram = jsonObj.body.length;
    for(let i = 0; i< lengthOfProgram; i++) { parsingSymbolicProgram( jsonObj.body[i],globalsMap); }
    /*functionParamsMap.forEach(logMapElements);*/
    /*for(let i=0 ; i<outputLines.length; i++ ) {
        console.log(outputLines[i]);
    }*/
    return extractLinesAndPaint();
};

const extractLinesAndPaint = () => {
    let arr = '';
    for(let i=0; i<outputLines.length; i++) {
        let greenLine = '<p style="background-color: green;">' + outputLines[i]+ '<p>' + '\n';
        let readLine = '<p style="background-color: red;">' + outputLines[i]+ '<p>' + '\n';
        let whiteLine = '<p style="background-color: white;">' + outputLines[i]+ '<p>' + '\n';
        let currentColoredLine = (color[i] === 1)? greenLine : (color[i] === 2)? readLine : whiteLine;
        arr = arr + currentColoredLine;
    }
    return arr;
};

const AnalyzeGlobals = (exp) => {
    let lengthOfProgram = exp.body.length;
    for(let i = 0; i< lengthOfProgram; i++) {
        if (exp.body[i].type === 'VariableDeclaration') AnalyzeGlobalsVariableDeclaration(exp.body[i],globalsMap);
    }
};

const parsingSymbolicProgram = (expression,env) => {
    let result = null;
    switch (expression.type) {
    case 'FunctionDeclaration' : /*console.log('in func');*/ result = AnalyzeFunctionDecleration(expression,functionParamsMap); break;
    case 'VariableDeclaration' : /*console.log('in VariableDeclaration');*/ result = AnalyzeVariableDeclaration(expression,env); break;
    case 'MemberExpression' : /*console.log('in MemberExpression');*/ result = AnalyzeMemberExpression(expression,env); break;
    case 'BinaryExpression' : /*console.log('in BinaryExpression'); */result =  AnalyzeBinaryExpression(expression,env); break;
    default: result = parsingSymbolicProgram2(expression,env);
    }
    return result;
};

const parsingSymbolicProgram2 = (expression,env) => {
    let result = null;
    switch (expression.type) {
    case 'Identifier' : /*console.log('in Identifier');*/ result =  AnalyzeIdentifier(expression,env); break;
    case 'AssignmentExpression' : /*console.log('in AssignmentExpression');*/ result = AnalyzeAssignmentExpression(expression,env); break;
    case 'ExpressionStatement' : /*console.log('in ExpressionStatement');*/ result = parsingSymbolicProgram(expression.expression,env); break;
    case 'ReturnStatement' : /*console.log('in ReturnStatement');*/ result = AnalyzeReturnStatement(expression,env); break;
    default: result = parsingSymbolicProgram3(expression,env);
    }
    return result;
};

const parsingSymbolicProgram3 = (expression,env) => {
    let result = null;
    switch (expression.type) {
    case 'BlockStatement' : /*console.log('in BlockStatement');*/ for(let i=0; i<expression.body.length; i++) { parsingSymbolicProgram(expression.body[i],env); } break;
    case 'Literal' : /*console.log('in Literal');*/ result =  { 'name': expression.value, 'symbolicVal': expression.value, 'value': expression.value }; break;
    case 'ArrayExpression' : /*console.log('in ArrayExpression');*/ result = AnalyzeArrayExpression(expression,env); break;
    default: break;
    }
    return result;
};

const initializeParamsList = (funcExpr,env) => {
    let paramatersLength = funcExpr.params.length;
    let params = '';
    for (let i = 0; i < paramatersLength; i++) {
        let param = '' + funcExpr.params[i].name;
        params = params + param + ', ';
        env.set(param, {'symbolicVal': param, 'value': vectorInp[i]});   //vactorInp should be initialized...
    }
    params = (paramatersLength !== 0) ? params.substring(0, params.length - 2) : params;
    return params;
};



const AnalyzeArrayExpression = (arrExp,env) => {
    let elements = arrExp.elements;
    let arr = [];
    for (let i=0; i<elements.length; i++) {
        let currentElement = parsingSymbolicProgram(elements[i],env);
        let CurrEleValue = currentElement['value'];
        arr.push(CurrEleValue);
    }
    return { 'name': arr , 'symbolicVal' : '[ ' +arr.toString() + ' ]' , 'value' : arr };
};

const AnalyzeFunctionDecleration = (funcExpr,env) => {
    let params = initializeParamsList(funcExpr,env);
    initialFunctionParams = new Map(env);
    outputLines.push('function '+funcExpr.id.name + '('+ params + ') {'); //thinking about something else
    color.push(0);
    let functionBody = funcExpr.body.body;
    analyzeFunctionBody(functionBody,env);
    outputLines.push('}');
    color.push(0);
};

const analyzeFunctionBody = (functionBody,env) => {
    for(let i=0; i<functionBody.length; i++) {
        analyzeSpecificExp(functionBody,env,i);
    }
};

const analyzeSpecificExp = (functionBody,env,i) => {
    let currentExp = functionBody[i];
    switch (currentExp.type) {
    case 'VariableDeclaration': AnalyzeVariableDeclaration(currentExp,env); break;
    case 'ExpressionStatement' : AnalyzeAssignmentExpression(currentExp.expression,env); break;
    case 'IfStatement' : AnalyzeIfStatement(currentExp,new Map(env)); AnalyzeElseIfStatement(currentExp.alternate,new Map(env)); break;
    case 'WhileStatement' : AnalyzeWhileStatement(currentExp,new Map(env)); break;
    default: parsingSymbolicProgram(currentExp,env);
    }
};

const AnalyzeWhileStatement = (whileExp,env) => {
    let test = parsingSymbolicProgram(whileExp.test,env);
    let testValue = eval(test['value']);
    outputLines.push('while '+ test['symbolicVal'] + ' {');
    let colored = testValue? 1 : 2 ;
    color.push(colored);
    parsingSymbolicProgram(whileExp.body,env);
    outputLines.push('}');
    color.push(0);
};

const AnalyzeElseIfStatement = (elseifExp,env) => {
    if (elseifExp !== null) {
        if (elseifExp.type === 'IfStatement') {
            let elseEnv = new Map(env); let test = parsingSymbolicProgram(elseifExp.test,env); let testValue = eval(test['value']);
            outputLines.push('else if '+ test['symbolicVal'] + ' {');
            let colored = testValue? 1 : 2 ;
            color.push(colored);
            parsingSymbolicProgram(elseifExp.consequent,env); outputLines.push('}'); color.push(0);
            AnalyzeElseIfStatement(elseifExp.alternate,elseEnv);
        }
        else {
            outputLines.push('else {'); color.push(0);
            parsingSymbolicProgram(elseifExp,env);
            outputLines.push('}'); color.push(0);
        }
    }
    return null; //just for return something
};

const AnalyzeReturnStatement = (retExp,env) => {
    let argument = parsingSymbolicProgram(retExp.argument,env);
    outputLines.push('return '+ argument['symbolicVal']);
    color.push(0);
    return argument;
};

//AnalyzeIfStatement
const AnalyzeIfStatement = (ifExp,env) => {
    let test = parsingSymbolicProgram(ifExp.test,env);
    let testValue = eval(test['value']);
    outputLines.push('if '+ test['symbolicVal'] + ' {');
    let colored = testValue? 1 : 2 ;
    color.push(colored);
    parsingSymbolicProgram(ifExp.consequent,env);
    outputLines.push('}');
    color.push(0);
    return test;
};

const AnalyzeGlobalsVariableDeclaration = (variableDecleration,env) => {
    for(let i=0; i<variableDecleration.declarations.length; i++) {
        let variableDeclarator = variableDecleration.declarations[i];
        let name = variableDeclarator.id.name;
        let init = parsingSymbolicProgram(variableDeclarator.init,env);
        if (init['value'] !== null) {
            let newObj = {'symbolicVal': init['symbolicVal'], 'value': eval(init['value'])}; //been changed
            env.set(name, newObj);
            outputLines.push('let ' + name + ' = ' + init['symbolicVal']);
            color.push(0);
        }
        else continue;
    }
    return null; //just for returning something
};

//VariableDeclarator
const AnalyzeVariableDeclaration = (variableDecleration,env) => {
    for(let i=0; i<variableDecleration.declarations.length; i++) {
        let variableDeclarator = variableDecleration.declarations[i];
        let name = variableDeclarator.id.name;
        let init = parsingSymbolicProgram(variableDeclarator.init,env);
        let newObj = { 'symbolicVal': init['symbolicVal'] , 'value': eval(init['value']) }; //been changed
        env.set(name,newObj);
    }
    return null; //just for returning something
};

const AnalyzeIdentifier = (identifier,env) => {
    let name = identifier.name;
    let localExist = env.get(name) !== undefined;
    /*let paramExist = functionParamsMap.get(name) !== undefined;*/
    return localExist ? { 'name': name, 'symbolicVal': env.get(name)['symbolicVal'], 'value': env.get(name)['value'] }  :
    /*paramExist ? { 'name': name, 'symbolicVal': functionParamsMap.get(name)['symbolicVal'], 'value': functionParamsMap.get(name)['value'] } :*/
        { 'name': name, 'symbolicVal': globalsMap.get(name)['symbolicVal'], 'value': globalsMap.get(name)['value'] };
};

const AnalyzeMemberExpression = (memExp,env) => {
    let object = parsingSymbolicProgram(memExp.object,env);
    let property = parsingSymbolicProgram(memExp.property,env);
    let objToReturn = { 'name': object['name'] , 'symbolicVal':  object['symbolicVal'] +'[' + property['symbolicVal'] + ']' , 'value': object['value'][eval(property['value'])] , 'index': eval(property['value']) };
    return objToReturn;
};

const isNotUndefined = (vari) => {
    return vari !== undefined;
};

const newArrayFunc =  (isItMemberExp,existInCurrEnv,env,variable,existInFunctionParams,functionParamsMap,existInGlobalsMap, globalsMap) => {
    return isItMemberExp? (existInCurrEnv? env.get(variable)['value'] : /*(existInFunctionParams? functionParamsMap.get(variable)['value'] :*/ globalsMap.get(variable)['value']) : dummyVector;
};

const getIndex =  (isItMemberExp,vari) => {
    return isItMemberExp? vari : 0;
};

const getAnalysis = (existInCurrEnv,env,symbolicVal,value,existInFunctionParams,functionParamsMap,variable,globalsMap) => {
    return existInCurrEnv ? env.set(variable, {'symbolicVal': symbolicVal, 'value': value}) :
        /*existInFunctionParams ? functionParamsMap.set(variable, {
            'symbolicVal': symbolicVal, 'value': value
        }) :*/ /*existInGlobalsMap ?*/
        globalsMap.set(variable, {'symbolicVal': symbolicVal, 'value': value});
};

const AnalyzeAssignmentExpression = (assExp,env) => {
    let left = parsingSymbolicProgram(assExp.left,env); let right = parsingSymbolicProgram(assExp.right, env);
    let isItMemberExp = isNotUndefined(left['index']);
    let variable = left['name'];
    let existInCurrEnv = isNotUndefined(env.get(variable));
    let existInFunctionParams = isNotUndefined(functionParamsMap.get(variable));
    let existInInitialParamsList = isNotUndefined(initialFunctionParams.get(variable));
    let existInGlobalsMap = isNotUndefined(globalsMap.get(variable));
    if (existInInitialParamsList || existInGlobalsMap) { outputLines.push('' + left['symbolicVal'] + ' = ' + right['symbolicVal']); color.push(0); }
    let newArray = newArrayFunc(isItMemberExp,existInCurrEnv,env,variable,existInFunctionParams,functionParamsMap,existInGlobalsMap, globalsMap);
    let index = getIndex(isItMemberExp,left['index']);
    newArray[index] = right['value'];
    let value = isItMemberExp? newArray : right['value'];
    let symbolicVal = isItMemberExp?  left['name'] : right['symbolicVal'];
    return getAnalysis(existInCurrEnv,env,symbolicVal,value,existInFunctionParams,functionParamsMap,variable,globalsMap);
};

const AnalyzeBinaryExpression = (binaryExp,env) => {
    let left = parsingSymbolicProgram(binaryExp.left,env);
    let right = parsingSymbolicProgram(binaryExp.right,env);
    let objToReturn = { 'name': '(' + left['name'] + ' ' + binaryExp.operator + ' '+ right['name'] + ')' , 'symbolicVal': '(' + left['symbolicVal'] + ' ' + binaryExp.operator + ' ' + right['symbolicVal'] + ')', 'value': ''+eval('(' + left['value'] + ' ' + binaryExp.operator + ' ' + right['value'] + ')') };
    return objToReturn;
};

export {parseSymbolic};
export {parseCode};
