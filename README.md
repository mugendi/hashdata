# Hash that Data!
When you need to hash your data and maintain numeric precision!

<!-- TOC -->

- [Hash that Data!](#hash-that-data)
    - [Why Hash Arrays of Data?](#why-hash-arrays-of-data)
    - [Practicals](#practicals)
    - [And so...](#and-so)
    - [Time to code!](#time-to-code)
    - [API](#api)
        - [```.encode( arr [,random] )```](#encode-arr-random-)
        - [```.decode( hash )```](#decode-hash-)
    - [Be wise Bro, will you?](#be-wise-bro-will-you)
    - [Wait, so you need to hash Objects too?](#wait-so-you-need-to-hash-objects-too)
    - [Tests](#tests)
    - [TODO](#todo)

<!-- /TOC -->

Before proceeding, it is important you check out [HashIds](https://www.npmjs.com/package/hashids). No, Really!

Ok. So let us proceed...

## Why Hash Arrays of Data?
So, often you find yourself needing to generate hashes that can be used (especially within URL's) that encode certain data. Often, these hashes are limited and no sooner do you start working on a complex system do you realize you need to pass around more data.

Arrays are the simplest objects and perfect for passing around such data. It is for this reason that **HashIds** and **this** module exist.

## Practicals

So let us take this practical scenario:
- Your company sells products via an *e-commerce* site and through numerous merchants in different countries.
- Every merchant has a unique (numeric) ID
- Every product has a (numeric) product code
- You want an easy way to monitor who sells what.

An easy solution is to generate a hash from that data:

Say, the array ```[254, 463, 8097]``` represents the data as follows : ```['country-code', 'merchant-id', 'product-code']```. You can then generate a hash(code) that packages all this data and can be used within your URL's.

Using **this module** that hash would be ```Z-HQb2QKYJ4```. Sweet!

## And so...

At this point, you would be justified to ask why then shouldn't you just use **HashIds**?

Well, you should. Really! Having run about **100,000** tests, this library is still in its infancy. But here is why it was born...

Back to the scenario above. Suppose then that you wanted to capture the following data also;

- Price of the product
- Percent discount allowed for respective merchant (normally, merchants who sell more are allowed bigger discounts, No?)

This then becomes our array: ```[ 254, 463, 8097, 99.99, 10.5 ]``` where ```['country-code', 'merchant-id', 'product-code', 'product-price', 'percentage-discount']```

With **HashData** that generates the following Hash: ```JW-Gb3a2t4JLJ9PhtVYMB5D-BE```. Nice!

And that is the greatest motivation for writing this module. Because almost every other module works with integers only!

So in short, I wrote this coz I needed a module that will:

1. Hash both integers & floats.

2. Work with incredibly big integers! This module has been tested with numbers upto **10e15**;

3. As much as possible, generate human-friendly hashes (like **CF4EG3JAK7B**). This module does not use the letters **'I|i, L|l, O|o, S|s'** because they resemble the numerals **'1, 0 & 5'** and thus would result in confusing hashes. 

## Time to code!

First install using ```npm install -s hashdata```

```javascript 

const hashdata = require('../');


let array = [ 254, 463, 8097, 99.99, 10.5 ];

//Encode
let encoded = hashdata.encode(array);
//Decode
let decoded = hashdata.decode(encoded);

console.log('Hash:' + encoded);
console.log('IN' , array);
console.log('OUT', decoded);

```

This should output: 

```
Hash: JW-Gb3a2t4JLJ9PhtVYMB5D-BE
IN [ 254, 463, 8097, 99.99, 10.5 ]
OUT [ 254, 463, 8097, 99.99, 10.5 ]
```
Simple!

## API
This module exposes only two methods...

### ```.encode( arr [,random] )```
- **arr** : Array to encode/hash

- **random** : If set to true, hashes generated are much more random. 

### ```.decode( hash )```
- **hash** : The encoded hash to decode.

## Be wise Bro, will you?
This module is not written with any notion of security whatsoever in mind! So never use it to hash sensitive data!

Also, this module does not seek or attempt to compress data! Actually, it is impossible to keep hashes *neat* and *pretty* while still achieving any reasonable form of compression. So if you seek shorter hashes, then this is not for you! From tests run, the average compression is a paltry 12-15%. 

## Wait, so you need to hash Objects too?
OK, Check out my other module [Object-Encode](https://www.npmjs.com/package/object-encode/). That one does a little more to obscure your data but don't be fooled. Public Hashes are never to be used with sensitive information! Period!

## Tests 
First install dev dependencies then run ``` npm run test```. Head to the *./tests* folder to view test files for more.

This Module comfortably encodes/decodes arrays where:
- Array size does not exceed 100 values &
- The largest value does not exceed 10^15


## TODO
- Tell me what you think we should add.
- Find even better ways to make hashes more human friendly.
- Increase accuracy for arrays bigger than 100 values. Doubt anyone will ever need this. But...



