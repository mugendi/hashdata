const SeededShuffle = require('seededshuffle');
const _uniq = require('lodash').uniq;
const _difference = require('lodash').difference;
const _values = require('lodash').values;

//Z replaces repeated Zeros
//d replaces repeated A
//E replaces + in scientific notation

var letters  = ["A","B","C","D", "E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","X","Y", "Z"];

//abcdefghijklmnopqrstuvwxyz
//bdhiklt

var special_letters = {
    Array_glue_replacement : 'b',
    Zero_replacement : 'a',
    Decimal_replacement : 't',
    Array_glue : 'h',
    Scientific_notation_plus_replacement : 'd',
}


letters = _difference( _uniq(letters), _values(special_letters) );

//shuffle them
letters = SeededShuffle.shuffle(letters, 'my-salt');

// console.log(letters.join(','));


module.exports = {letters, special_letters}
