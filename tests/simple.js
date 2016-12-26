const chalk = require('chalk');
const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash')
const hashdata = require('../');


let array = [ 254, 463, 8097, 99.99, 10.5 ];

//Try strictmode, maybe?
let encoded = hashdata.encode(array);
let decoded = hashdata.decode(encoded);

let hashLen = encoded.length;
let arrLen = JSON.stringify(array).length;
let diffLen = arrLen - hashLen;

console.log("\n");
console.log(chalk.green.bold('Hash: ' + encoded));
console.log('->' , array);
console.log('<-', decoded);
console.log('An array of %d chars encoded to a hash of %d chars which is %s% compression', arrLen, hashLen, _.round(diffLen/arrLen,2));
console.log("\n");

//test equality
assert.deepEqual(array, decoded);


function formarNum(n){
    return String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');
}

