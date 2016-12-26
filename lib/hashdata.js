const _ = require('lodash');
const fs = require('fs');
const SeededShuffle = require('seededshuffle');

const _values = require('lodash').values;
const _keys = require('lodash').keys;
const _uniq = require('lodash').uniq;
const _orderBy = require('lodash').orderBy;
const _zipObject = require('lodash').zipObject;
const _max = require('lodash').max;
const _random = require('lodash').random;
const _sample = require('lodash').sample;

const lettersData = require('./letters');
const path = require('path');


const data_path = path.join(__dirname,'..','data');

const letter_map = read_json(path.join(data_path, 'letter_map.json'));
const letters = lettersData.letters;

//infer word/num size
const numSize = _.values(letter_map.letters)[0].length ;

const lettersPat = new RegExp('['+letters.join('')+']{'+(numSize-1)+'}','g');
const numsPat = new RegExp( '(' + _keys(letter_map.nums).join('|') + ')', 'g' );
const letterSep = '-';

//special letters
const {
    Array_glue_replacement, 
    Zero_replacement, 
    Decimal_replacement, 
    Array_glue ,
    Scientific_notation_plus_replacement
} = lettersData.special_letters;

const regExps = {
    decode_Array_glue_replacement : new RegExp(Array_glue_replacement + '[0-9]', 'g'),
    decode_zero_replacement : new RegExp(Zero_replacement + '[0-9]', 'g'),
    decode_decimal_replacement : new RegExp(Decimal_replacement,'g'),
    encode_repeated_array_glue : new RegExp( Array_glue + '{2,9}' , 'g'),

    hash_repeated_array_glue : new RegExp('('+Array_glue+')\\1+','g'),
    array_glue : new RegExp(Array_glue,'g'),
    non_array_glue_repated : new RegExp('([^'+Array_glue+'])\\1+','g'),
    repeated_array_glue_plus : new RegExp('('+Array_glue+')\\1+(\\.)?','g'),

    scientific_notation_plus_replacement : new RegExp(Scientific_notation_plus_replacement,'g'),

}


// console.log(regExps);


module.exports = {encode, decode};




//decode
function decode(hash){

    let arr = hash.split(letterSep);
    
    let numSeed = null;
    let arrSeed = null;
    let zeroSeed = null;
    let matche = [];
    
    hash = arr.length >= 2  ? arr[1] : arr[0];
    numSeed = arr[0] ;

    if(arr.length>2){
        arr = arr[2].split(Scientific_notation_plus_replacement);
        // console.log(arr);
        arrSeed = arr[0] || null;
        zeroSeed = arr[1] || null;
    }

    // console.log(numSeed, arrSeed, zeroSeed);
    // numSeed = to_num(numSeed);
    // arrSeed = to_num(arrSeed);
    // zeroSeed = to_num(zeroSeed);
    // console.log(numSeed, arrSeed, zeroSeed);
    
    //replace the ZZZ
    matches = hash.match( regExps.decode_zero_replacement ) ||[];

    matches.forEach((m)=>{
        let rep = '0'.repeat(m.slice(1));
        // console.log(m, rep);
        hash = hash.replace(m, rep);
    });

    //  console.log(hash);
    
    if( zeroSeed ){
        hash = unshuffle(hash,zeroSeed);
    }

    // console.log(hash);

    //Array_glue_replacement + '[0-9]', 'g')
    matches = hash.match( regExps.decode_Array_glue_replacement )||[];

    matches.forEach((m)=>{
        let rep = Array_glue.repeat(m.slice(1));
        // console.log(m, rep);
        hash = hash.replace(m, rep);
    });


    //replace all Scientific_notation_plus_replacement back to + for scientific notation
    // Scientific_notation_plus_replacement
    hash = hash.replace( regExps.scientific_notation_plus_replacement, '+');


    if( arrSeed ){
        hash = unshuffle(hash,arrSeed);
    }

    
    //replace back the values
    matches = hash.match(lettersPat) || [];
    // console.log(hash, matches);

    matches.forEach((m)=>{
        let rep = letter_map.letters[m];
        hash = hash.replace(m,rep);
    });

    //replace decimals
    hash = hash.replace( regExps.decode_decimal_replacement ,'.');

   
    // console.log(hash, numSeed); 
    //second unshuffle....
    // console.log(numSeed);
    if(numSeed){
        hash = unshuffle(hash,numSeed);
    }
    
    // console.log(hash);

    //split back to array
    arr = hash.split(Array_glue)
              .map((s)=>Number(s));


    return arr;
}

function encode(arr, rand){
    //arrify
    arr = Array.isArray(arr) ? arr : [arr];

    //filter non numbers
    arr = arr.filter((n)=>Number(n));

    //use scientific notation where it results in shorter numbers
    arr = arr.map((n)=>{
        let e = n.toExponential();
        return (String(e).length < String(n).length) ? Math.abs(e) : Math.abs(n);
    });


    //add zeroes to decimals
    arr = arr.map((n)=>{
        let n_arr = String(n).split('.');

        if(n_arr[1] && n_arr[1].length < 3){
            n_arr[1] = n_arr[1] + '0'.repeat(3 - n_arr[1].length);
        }

        return n_arr.join(Decimal_replacement);

    });

    // console.log(arr);

    //join items using Array_glue
    let arrStr = arr.join(Array_glue);

    let encoded = best_num_hash(arrStr, arr.length, rand );
    // encoded = replace_nums(arrStr)
    // console.log(encoded, arrStr );

    let encodedArr = encoded.split('-');
    let hash = encodedArr[1];
    // console.log(encodedArr);

    //replace repeated Array_glue
    matches = hash.match( regExps.encode_repeated_array_glue ) || [];

    matches.forEach((m)=>{
        let rep = Array_glue_replacement + m.length;
        hash = hash.replace(m,rep);
    });


     //if worthwhile
     let sort = ['lscore','nscore'];
     let zeros = (hash.match(/0/g)||[]).length
    //  console.log(zeros);
     if(zeros>3 ){
        //  console.log(zeros);
        let zeroHash = best_hash(hash, sort, rand);

        // console.log(zeroHash);

        //if the replacements we will do are any significant
        if(zeroHash.lscore-2 > zeroHash.letter.length + 1 ){
            // console.log('SSSSSSSSSS');
            encodedArr[1] = zeroHash.hash;
            encodedArr[2] = encodedArr[2] || '';
            // encoded = arr.join('-') + '+' + zeroHash.letter;
            encodedArr[2]+= Scientific_notation_plus_replacement + zeroHash.letter;
            //hash...
            hash = encodedArr[1];
        }

     }

    //replace zeros
    matches = hash.match(/0{2,9}/g) || [];
    // console.log(matches);

    matches.forEach((m)=>{
        let rep = Zero_replacement + m.length;
        hash = hash.replace(m,rep);
    });


    //replace all + brought in by scientific notation
    hash = hash.replace(/\+/g, Scientific_notation_plus_replacement );

    encodedArr[1] = hash;

    // console.log(encodedArr);
    // console.log(encoded);
    encoded = encodedArr.join('-');
    
    return encoded;

}


function best_num_hash(str, arrSize, rand){

    let min = Number('1'+'0'.repeat(numSize-1));
    let max = Number('9'.repeat(numSize));

    let hashMap = [];
    //let us approximate how many loops we need, increasing by string length
    // console.log(str.length * 4 + arrSize);
    let maxLoops = str.length * 5 + arrSize;
    if(maxLoops>max){maxLoops = max}
    // maxLoops = 1000;
    // console.log(maxLoops);    

    //
    for(l=1; l<=maxLoops; l++){
        // console.log(rand);
        let letter = (rand) ? rand_letter() :to_letter(l, 1);
        // let letter = rand_letter();
        // let letter = l;

        // console.log(l);
        let sh = shuffle(str, letter);
        let hash = replace_nums(sh);

        // console.log(sh,hash,l, sh.length, hash.length);
        hashMap.push({
            hash : hash,
            letter : letter,
            str : str, 
            sh : sh,
            matches : (hash.match( regExps.hash_repeated_array_glue )||[]).length,
            nums : (hash.match(/[0-9]/g)||[]).length,
            hash_length : hash.length
        });

    }

    hashMap = _orderBy( hashMap, ['hash_length', 'matches' ], ['asc', 'desc', 'asc'] );

    // console.log(hashMap.slice(0,2));   
    
    let hash = '';

    hash =  hashMap[0].hash;
    var newHash = hash+'';

    // console.log(hash,str);

    if(str !== hash ){
        
        // let seed = to_letter( hashMap[0].letter );
        let seed = hashMap[0].letter;
        var newHash = seed + letterSep + hash;
        // console.log(seed, hash);

        //get best hash only for long arrays...
        //otherwise not performant
        if((hash.match( regExps.array_glue )||[]).length>2){
            let sort = ['nscore','lscore'];
            let bestHash = best_hash(hash, sort, rand);  
            newHash = seed + letterSep + bestHash.hash + letterSep + bestHash.letter;            
        }        
        
    }
    else{
        newHash = hash;
    }

    
    return newHash;
}

function best_hash( str, sort = ['nscore','lscore'], rand ){
    // console.log(letters);
    let pat = /([0a])\1+/g;
    let array_glue_pat = regExps.repeated_array_glue_plus;
    let m =  [];
    let nm = [];

    // console.log(pat, array_glue_pat);
    var scoreHashes = [];

    let x_num =( str.match( regExps.array_glue ) || []).length;

    let min = Number('1'+'0'.repeat(numSize-1));
    let max = Number('9'.repeat(numSize));
    max = letter_map.size;

    let breakLoop = false;
    let maxLoops = str.length*50;
    if(maxLoops>max){maxLoops=max;}
    // console.log(str.length*50);
    // console.log(maxLoops);

    for( l = 1; l < maxLoops; l++ ){

        let letter = (rand) ? rand_letter() : to_letter(l,1);

        // console.log(l, letter);


        let sh = shuffle( str, letter );
        if(sort[0]=='nscore'){ sh+='.' }
        m = sh.match(pat) || [];
        nm = sh.match(array_glue_pat) || [];

        // let lscore =  _max( m.length ? m.map((a)=>a.length) : [0]);
        // console.log(m, (nm[0]||'').length, x_num);

        if( 
            (sort[0] == 'nscore' && (nm[0]||'').length == x_num) 
        ){ breakLoop=true; }

        scoreHashes.push({           
            str : str,
            hash : sh,
            str_length : str.length,
            hash_length : sh.length,
            m:m , 
            nm:nm, 
            lscore : _max( m.length ? m.map((a)=>a.length) : [0]), 
            nscore : (nm[0]||'').length, 
            letter : letter
        });

        if(breakLoop){ break; }
    }

    scoreHashes = _orderBy(scoreHashes, sort, ['desc', 'desc'] );

    str = scoreHashes[0].hash;

    //remove last \.
    scoreHashes[0].hash = scoreHashes[0].hash.replace(/\.$/,'');
    // scoreHashes[0].letter = to_letter( scoreHashes[0].letter );

    // console.log(scoreHashes[0]);

    return scoreHashes[0];

}


function to_letter(num, byIndex){

    if(/^[0-9]+$/i.test(num)){

        if(byIndex){
            num = letters[num] || _values(letter_map.nums)[num] ||  num;
        }
        else{
            num = letters[num] || letter_map.nums[num] ||  num;
        }
        
    }

    return num;
}

function to_num(letter){

    if(/[a-z]/i.test(letter)){
        letter = ( letters.indexOf(letter)>-1?letters.indexOf(letter): null )  || letter_map.letters[letter] || letter;
    }

    return letter;
}

function rand_letter(){
    let rand_count = _random(0,1);
    let letterArr = [];

    for(i=0; i<=rand_count; i++ ){
        letterArr.push( _sample(letters) )
    }

    // console.log(letterArr);

    return letterArr.join('');
}



function replace_nums(str){
    // console.log(str);

    let matches = str.match(numsPat) || [];

    matches.forEach((m)=>{
        let rep = letter_map.nums[m];
        str = str.replace(m,rep);
        // console.log(rep, m);
    });


    

    return str;
}



function shuffle(str, seed){

    // console.log(str);

    let arr = str.split('');

    var array = SeededShuffle.shuffle( arr,seed ); 

    return array.join('');
}

function unshuffle(str, seed){

    let arr = str.split('');

    var array = SeededShuffle.unshuffle( arr,seed ); 
    
    return array.join('');
}

function read_json(file){
    
    return JSON.parse( fs.readFileSync(file).toString() );
}


