const _ = require('lodash');
const fs = require('fs');
const clearRequire = require('clear-require');
const async = require('async');


var nums = fs.readFileSync('./data/nums.txt')
                 .toString()
                 .match(/[0-9]{3}/g);

const lettersData = require('./lib/letters');



// const letter_map = read_json('./data/letter_map.json');
var letters = lettersData.letters;
const numSize = 3;
const test_array = [ 1.1, 2000, 5664, 6546, 6900000900000, 100000000 ];

// console.log(letters);\

var letter_maps = [];


test_make();

function test_make(){
    async.eachOfLimit(_.range(1,21), 1, function(num, i,next){

        console.log(`running test ${num}`);

        // console.log(i);
        make(function(map){

            // console.log(_.keys(map));
            const hashData = require('./index');
            clearRequire('./index');        
            let hash = hashData.encode(test_array);  
            let length = hash.length;

            map.size = _.size(map.nums);
            
            // console.log(hash, length);
            letter_maps.push({map,hash,length,num});

            next();

        }, i);    

    }, function(){

        //get best lettermap
        letter_maps = _.orderBy(letter_maps, ['length']);
       
        // console.log(letter_maps);
        console.log(`Saving most performant: Test ${letter_maps[0].num} with ${letter_maps[0].length} characters.`);
        //write most performant
        fs.writeFileSync('./data/letter_map.json', JSON.stringify(letter_maps[0].map,0,4));

    });

}





function make(cb, recall){

    // console.log(recall);

    letters = letters.filter((l)=>/[a-z]/i.test(l));
    // console.log(letters);;

    if(letters.length){
        // console.log(letter_map);
        //make divisors only once
        if(!recall){
            num_divisors();
        }
        
        // return arrSeed();
        make_letter_map(cb, false) ;
    }
    
}


function read_json(file){
    
    return JSON.parse( fs.readFileSync(file).toString() );
}


function randLetters(){

    let LL = '';

    for(i=1; i<numSize; i++){
        LL+=_.sample(letters);
    }

    return LL;
}

function make_letter_map(cb, write){

    let combinations = [];
    let min = Number('1'+'0'.repeat(numSize-1));
    let max = Number('9'.repeat(numSize));

    let divisors = read_json('./data/num-divisors.json');
    let map = {};

    _.each(divisors, function(o){
        let LL = randLetters();
        let loops =0;

        while(map[LL] && loops<min){
            LL = randLetters();
            loops++;
        }

        map[LL] = String(o.num);

    });

    // console.log(map);

    let letter_map = {
        letters : map,
        nums : _.zipObject(_.values(map),_.keys(map))
    }


    letter_map.size = _.size(map);

    if(write){
        // console.log('sjhgfshgsf');
        fs.writeFileSync('./data/letter_map.json', JSON.stringify(letter_map,0,4));
    }
    
    // console.log('retuen');
    cb(letter_map);

}

function num_divisors(){

    
    let min = Number('1'+'0'.repeat(numSize-1));
    let max = Number('9'.repeat(numSize))
    nums = _.union(nums, _.range(min, max ));

    //get numeric divisors
    let divisors = [3,5,7,11,13];

    // console.log(min, max);

    // nums = nums.slice(0,10)
    nums = nums.filter((n)=>Number(n)>=min);

    nums = nums.map((n)=>{
        // let divs = divisors.filter((d)=>n % d===0);
        return {
            num : n,
            divisors : divisors.filter((d)=>n % d===0).length
        }
    });


    nums = _.orderBy(nums, ['divisors'], ['desc']);

    fs.writeFileSync('./data/num-divisors.json', JSON.stringify(nums,0,4));

    return nums;

}