const chalk = require('chalk');
const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash')
const hashdata = require('../');


let array = [ 254, 463, 8097, 99.99, 10.67 ];

//Try strictmode, maybe?
let encoded = hashdata.encode(array,0);
let decoded = hashdata.decode(encoded);

let hashLen = encoded.length;
let arrLen = array.toString().length;
let diffLen = arrLen - hashLen;


console.log(chalk.blue.bold('Hash: ' + encoded));
console.log('IN' , array);
console.log('OUT', decoded);
console.log('An array of %d chars encoded to a hash of %d chars which is %s% compression', arrLen, hashLen, _.round(diffLen/arrLen,2))

//test equality
assert.deepEqual(array, decoded);


function formarNum(n){
    return String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');
}

