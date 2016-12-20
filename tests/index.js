const chalk = require('chalk');
const chai = require('chai');
const assert = chai.assert;
const _ = require('lodash')
const mock = require("mock-data");
const hashdata = require('../')


//number of tests
var testsNum = 5000;

//run tests
for(i=0; i<testsNum; i++) test();

function test(){

    //generate random array for test
    mock.generate(
    {
        type: "integer",
        count: _.random(2,100),
        params: {start: 1, end: 9999999999999 }
    },
    function (err, array) {
        
        let encoded = hashdata.encode(array,1,0);
        let decoded = hashdata.decode(encoded);


        //assert
        try {
            assert.deepEqual(array, decoded);
        } catch (error) {
            console.log("\n\n--------------------------------------------");
            console.log(encoded,'\n');
            console.log(array);
            console.log(decoded);
            console.log(_.difference(array,decoded));
            console.log("----------------------------------------------\n\n");

            throw new Error(error);
        }
        

        // console.log(encoded);
        console.log(chalk.green('\n>DEEP EQUALITY TEST PASSED...'));
        // console.log('Array Encoded : ', chalk.blue.bold(encoded) );
        console.log( 'Array Length: ', chalk.magenta.bold(formarNum( array.length) +' values ') )
        console.log( 'Array Max: ', chalk.magenta.bold(formarNum(_.max(array))) )
        console.log( 'Array Min: ', chalk.magenta.bold(formarNum(_.min(array))) ) 

        let arrLength = array.toString().length;
        let diff = arrLength - encoded.length;
        
    
        console.log( _.round(diff / arrLength * 100, 2) + '% Compression' );


    });

}



function formarNum(n){
    return String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');
}

