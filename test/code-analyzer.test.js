import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {parseSymbolic} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });

    it('test3', () => {
        assert.equal(
            parseSymbolic(parseCode('function foo(x, y, z)' +
                '{let a = x + 1;' +
                'let b = a + y;' +
                'let c = 0;' +
                'if (b < z) {' +
                'c = c + 5;' +
                'return x + y + z + c;' +
                '} else if (b < z * 2) {' +
                'c = c + x + 5;' +
                'return x + y + z + c;' +
                '} else {' +
                'c = c + z + 5;' +
                'return x + y + z + c;' +
                '}' +
                '}'),'{ "x" : 6 , "Y" : 9 , "z" : 20 }').length,640);
    });

    it('test4', () => {
        assert.equal(
            parseSymbolic(parseCode('function foo(x, y, z)' +
                '{let a = x + 1;' +
                'let b = a + y;' +
                'let c = 0;' +
                'if (b < z) {' +
                'c = c + 5;' +
                'return x + y + z + c;' +
                '} else if (b < z * 2) {' +
                'c = c + x + 5;' +
                'return x + y + z + c;' +
                '} else {' +
                'c = c + z + 5;' +
                'return x + y + z + c;' +
                '}' +
                '}'),'{ "x" : 15 , "Y" : 9 , "z" : 20 }').length,638);
    });

    it('test5', () => {
        assert.equal(
            parseSymbolic(parseCode(    'function foo(x, y, z){' +
                'while (x + 1 < z) {' +
                'z = (x + 1 + x + 1 + y) * 2;' +
                '}' +
                'return z;' +
                '}'),'{ "x" : 6 , "Y" : 9 , "z" : 20 }').length,329);
    });

    it('test6', () => {
        assert.equal(
            parseSymbolic(parseCode(    'function foo(x, y, z){' +
                'while (x + 1 < z) {' +
                'z = (x + 1 + x + 1 + y) * 2;' +
                '}' +
                'return z;' +
                '}'),'{ "x" : 20 , "Y" : 9 , "z" : 20 }').length,327);
    });

    it('test7', () => {
        assert.equal(
            parseSymbolic(parseCode(    'function foo(x, y, z){' +
                'while (x + 1 < z) {' +
                'let d = x;' +
                'z = (x + 1 + x + 1 + y) * 2;' +
                '}' +
                'return z;' +
                '}'),'{ "x" : 20 , "Y" : 9 , "z" : 20 }').length,327);
    });

    it('test8', () => {
        assert.equal(
            parseSymbolic(parseCode(   'let m = 10;'  +
                'function foo(x, y, z){' +
                'while (x + 1 < z) {' +
                'let d = x;' +
                'z = (x + 1 + x + 1 + y) * 2;' +
                '}' +
                'return z;' +
                '}'),'{ "x" : 20 , "Y" : 9 , "z" : 20 }').length,377);
    });

    it('test9', () => {
        assert.equal(
            parseSymbolic(parseCode(   'function foo(){' +
                'let a = 8;' +
                'let b = 6;' +
                'let c = 0;' +
                'while (a < c) {' +
                'let d = a;' +
                '}' +
                'return c;' +
                '}'),'').length,239);
    });

    it('test10', () => {
        assert.equal(
            parseSymbolic(parseCode(   'function foo(x,y,z){' +
                'let a = 8;' +
                'let b = 6;' +
                'let c = 0;' +
                'x=8;' +
                'y[1] = 19;' +
                'while (a < c) {' +
                'let d = a;' +
                '}' +
                'if (x>0) {' +
                'y=9;' +
                '}' +
                'else if (x>20) {' +
                '}' +
                'else {' +
                'y = 90;' +
                '}' +
                'return c;' +
                '}'),'{ "x" : 3 , "Y" : { "x" : 6 , "Y" : 9 , "z" : 20 } , "z" : 20 }').length,708);
    });

    it('test11', () => {
        assert.equal(
            parseSymbolic(parseCode('let m =9;' +
                'function f(x, y, z) {' +
                'let d = m;' +
                'return d;' +
                '}'),'{ "x" : 3 , "Y" : { "x" : 6 , "Y" : 9 , "z" : 20 } , "z" : 20 }').length,199);
    });

    it('test12', () => {
        assert.equal(
            parseSymbolic(parseCode('let m =9;' +
                'function f(x, y, z) {' +
                'let d = m;' +
                'm = 10;' +
                'return d;' +
                '}'),'{ "x" : 3 , "Y" : { "x" : 6 , "Y" : 9 , "z" : 20 } , "z" : 20 }').length,245);
    });

    it('test13', () => {
        assert.equal(
            parseSymbolic(parseCode('i++;'),'{ "x" : 3 , "Y" : { "x" : 6 , "Y" : 9 , "z" : 20 } , "z" : 20 }').length,0);
    });

    it('test14', () => {
        assert.equal(
            parseSymbolic(parseCode('let f = [9 , 99 , 3];'),'').length,58);
    });

    it('test15', () => {
        assert.equal(
            parseSymbolic(parseCode('let f = [9 , 99 , 3];'+
                'function foo(x, y, z){' +
                'f[2] = 11;'+
                'if (f[2] > 10) {'+
                'z = 8;' +
                '}' +
                'return f[2];' +
                '}'),'').length,413);
    });

    it('test16', () => {
        assert.equal(
            parseSymbolic(parseCode('let f = null;'),'').length,0);
    });
});
