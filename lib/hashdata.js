const _max = require('lodash').max;
const _min = require('lodash').min;
const _sum = require('lodash').sum;
const _range = require('lodash').sum;
const _isArray = require('lodash').isArray;
const _round = require('lodash').round;
const scientificToDecimal = require('scientific-to-decimal');
var numberIsFloat = require('number-is-float');


module.exports = {decode, encode};

function decode(hash, strict){

    if(typeof hash  !== 'string'){
        throw new Error("Value entered as 'hash' to decode must be a string!");
    }

    strict = strict===undefined ? false : (strict);
    //infer strict
    if(hash.slice(-1)=='+'){
        strict = true;
        hash = hash.slice(0,-1);
    }
    // console.log(hash);


    let upperLetterMap = letter_map('A','Z');
    let lowerLetterMap = upperLetterMap.map((a)=>a.toLowerCase());

    let baseNum = upperLetterMap.indexOf(hash.slice(hash.length-1));

    //slice last char 
    hash  = hash.slice(0,-1);
    
    //replace back rpeated
    hash  = expand_repeated(hash );

    // console.log(hash );
    
    let bestBase = Math.pow(10, baseNum);    
    let decimals = baseNum+1;

    let matches = (hash.match(/[a-z][0-9]+/ig)||[]);

    let maxDigits = _max(matches.map((a)=>a.length-1 ));

    //decimals should never lose precision, Never!
    if(decimals < maxDigits){ decimals = maxDigits; }

    // console.log(decimals, maxDigits);

    let decoded = [];

    // console.log(hash );
    //split to numbers
    matches = hash.match(/[a-z]|[A-Z]+[0-9]+|[A-Z]+[a-z]+|[A-Z]$/g) || [];
    // console.log(matches);

    let nums = matches.map((a)=>{
        let letters = (a.match(/([a-z]+)([0-9]+)/i)||[]).slice(1) ;
        if(letters.length===0){
            letters = [a];
        }

        // console.log(a, letters);
        // console.log();
        let l = letters.shift()
                       .split('')
                       .map((a)=>{
                            let i = upperLetterMap.indexOf(a) ;
                            if(i==-1){ i = lowerLetterMap.indexOf(a)}
                            return i;
                        }).join('') + '.' + letters.join('');

    

        //
        let mult =  _round( Number(l) * bestBase, (strict===true ? 0 : decimals) ) ;

        // console.log(l, bestBase, mult, decimals);

        decoded.push(mult);
    });
    

    // console.log(decoded);

    return decoded;

}




function encode( arr , strict, log ){

    if(!Array.isArray(arr) || arr.length ===0 ){
        throw new Error("Error!" + (arr.length) ? "Value entered is not an Array!" : "Array cannot be empty!" );
    }

    strict = strict === undefined ? false : (strict);

    let bestBase = best_base(arr, 'min');
    let baseNum =  base_num(bestBase);
    let decimals = baseNum+1;
    let upperLetterMap = letter_map('A','Z');


    //if strict, filter out non integers
    if(strict){
        arr = arr.filter((n) =>  Number.isInteger(n) );
    }   

    if(arr.length === 0 ) {
        throw new Error("Array has no values." + (strict) ? " All float values have been removed from the array." : '' )
    }  
    

    //ensure all values are decimal
    arr = arr.map((n)=>scientificToDecimal(n));

    // console.log(arr, strict);

    let maxDigits = arr.reduce((a,b)=> a.length>b.length ? a.length : b.length );

    if( maxDigits > 15 ){
        throw new Error("Encoding Values with more than 15 digits or arrays with more than 100 values cannot guarantee accurate results!");
    }

    //past 6 digits, we must use strict mode...
    if(maxDigits>6 && !strict){
        strict = true;
    }
    
    // console.log(maxDigits);sss()

    if(decimals===0){decimals = 1}
    if(decimals<maxDigits){ decimals=maxDigits; }

    //1) devide by best base....
    let obj = Object.assign(
        {0:arr}, 
        { baseNum, bestBase, decimals }, 
        {letterMap: upperLetterMap.join(', '), letterMapCount: upperLetterMap.length} 
    );
    
    //Step 1: round off values
    obj[1] = obj[0].map((a)=> round( a/bestBase, decimals) );

    let lastL = '';
    //Step 2: map letters
    obj[2] = obj[1].map((a,i)=>{

        let decArray = String(a).split('.');
        let wholeNum = decArray.shift();

        let l = mapLetters( wholeNum, upperLetterMap );  

        //join decimal numerals
        l+=decArray.join('');


        //Camel-Case Letters
        l = l.replace(/^([A-Z])([A-Z]+)?$/, (a,b,c) => { 
            return (c) ? b + c.toLowerCase()  :  b.toLowerCase() ;           
        });

        //if we have a lower 1st Char and Lower last Char in the last digits, then the encoding is wrong. Let us correct
        if(l.length ==1 && /[a-z]/.test(l) && /[a-z]/.test(lastL.slice(-1))){
            l=l.toUpperCase();
        }
        // console.log(l,lastL);

        lastL = l;
        // console.log( l, decArray );
        return l

    });

    if(log){
        // console.log(JSON.stringify(obj,0,4));
        console.log(obj);
    }

    //There's a limit to the values we can accept!
    if(baseNum > upperLetterMap.length-1 ){
        throw new Error("Values too big to encode safely!");
    }
    // console.log(diffBase);
    

    let encoded = obj[2].join('')+ upperLetterMap[baseNum] ;

    //replace repeated
    encoded = compress_repeated(encoded);

    //add + for strict
    if(strict){
        encoded+='+';
    }

    return encoded;

}


function mapLetters(wholeNum, letterMap){

    //chunk digits by 2
    let chunks = String(wholeNum).match(/[0-9]{2}|[0-9]$/g);

    //map letters
    let l = chunks.map( 
        (n) => letterMap[n] || 
        n.split('').map((n)=>letterMap[n]).join('') 
    ).join('');


    return l;
}

function round(num, decimals){

    str = String(num);
    let arr = str.split('.');
    
    //truncate...
    if(arr[1]){ 
        // arr[1] = '457';
        // decimals = 2;
        let extra = arr[1].substr(decimals,1)>5?1:0;

        arr[1] = arr[1].substr(0,decimals);
        let digits = arr[1].split('');
        let lastDigit = Number(digits[digits.length-1]) ;
        digits[digits.length-1] = lastDigit < 9 ? String( lastDigit + extra) : String(lastDigit);
        arr[1] = digits.join('');
        // console.log(digits.join(''), extra);
    }
    
    str = arr.join('.');

    //make number 
    num = Number(str);
    //ensure all numbers are in decimal notation
    num = scientificToDecimal(num);

    return num;
}


function expand_repeated(str){
    //Letters Z & X used as repeat char replacements...
    //replace repeated [ZX]NUM 
    let matches = (str.match(/[ZX][0-9]/g) || []);
    var map = {Z:'a',X:'0'};

    // console.log(matches);

    matches.forEach((m)=>{
        let rep = String(map[m.slice(0,1)]).repeat(m.slice(1)) ;
        str = str.replace(m,rep);
    });

    //expand for repeated Letters
    matches = (str.match(/[a-zA-Z]z[3-9]/g) || []);
    matches.forEach((m)=>{
        let rep = String(m.slice(0,1)).repeat(m.slice(2));
        str = str.replace(m,rep);
    });

    //expand for repeated Numbers
    matches = (str.match(/[0-9]x[3-9]/g) || []);
    matches.forEach((m)=>{
        let rep = String(m.slice(0,1)).repeat(m.slice(2));
        str = str.replace(m,rep);
    });

    // console.log(matches);

    return str;
}

function compress_repeated(str){
    //Letters Z & X used as repeat char replacements...

    //replace repeated A & 0
    let matches = (str.match(/[a0]{3,9}/g) || []);
    // console.log(matches);

    matches.forEach((m)=>{
        let rep = m.slice(0,1) == 'a' ? 'Z' : 'X';
        rep+=m.length;
        str = str.replace(m,rep);
    });

    //any other repeated letter is replaced with [letter]z[num]
    //'z' for letters & 'x' for nums
    matches = (str.match(/[^z]([a-z])\1{3,9}/gi) || []);

    matches.forEach((m)=>{
        let rep = m.slice(0,1)+m.slice(1,2)+'z'+(m.length-1);
        str = str.replace(m,rep);
    });


    matches = (str.match(/[^x]([0-9])\1{3,9}/gi) || []);

    // console.log(matches);
    // console.log(str);

    matches.forEach((m)=>{
        let rep = m.slice(0,1)+m.slice(1,2)+'x'+(m.length-1);
        // console.log(m,rep);
        str = str.replace(m,rep);
    });

    // console.log(str);

    // console.log(matches);

    return str;
}


function letter_map( start='A', stop='Z'){
    var result=[];
    //NOTE Z & X used as repeat chars and omitted from map
    var ignore = ['I','O','S','L','Z','X'];

    for (var idx=start.charCodeAt(0),end=stop.charCodeAt(0); idx <=end; ++idx){
        let chr = String.fromCharCode(idx);
        if(ignore.indexOf(chr.toUpperCase())==-1){
            result.push(String.fromCharCode(idx));
        }        
    }

    return result;
}

//get baseNum
function base_num(bestBase){
    let baseNum = Math.ceil( Math.log(bestBase) / Math.log(10) );    
    return baseNum;
}

//GET THE BEST BASE TO USE...
function best_base(arr, method){
    method = method || 'min';

    //check if there are any floats
    let floatArr = arr.filter((a)=>/\./.test(a));

    //default Pow = 10^2
    let basePow = 2;
    

    if(floatArr.length){
        basePow = Math.floor(_min(floatArr)).toString().length-3;
    }
    else{

        let intArr = arr.map((a)=>Math.ceil(a));
        let max = _max(intArr);
        let min = _min(intArr); 

        let baseArr = [min.toString().length-1 ,  max.toString().length-1];
        
        // console.log(baseArr, intArr);

        switch(method){
            case 'avg' : 
                basePow = Math.ceil(_sum(baseArr)/2);
            break;
            case 'max' : 
                basePow = baseArr.pop()-1;
            break;
            case 'min' : 
                basePow = baseArr.shift()-1;
            break;
        }

    }

    // basePow = 1;

    //max basepower == 20
    if(basePow>20){ basePow=20; }

    let bestBase = Math.pow(10, basePow);

    //best base cannot be below 1
    if(bestBase<1){
        bestBase = 1;
    }

    // console.log(bestBase, basePow);

    return bestBase;

}



