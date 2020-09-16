var libsodium = require('libsodium-wrappers-sumo')
const assert = require('assert').strict;
const blake3 = require('blake3')
var FileReader = require('filereader')
var Blob = require('blob');
const derivationCodes = require('../../src/keri/core/derivationCode&Length')
const stringToBnary  = require('../../src/keri/help/stringToBinary')
const {Crymat} = require('../../src/keri/core/cryMat')
async function test_cryderivationcodes(){

assert.equal(derivationCodes.crySelectCodex.two,0)
console.log("assert response ----->",assert.equal(derivationCodes.crySelectCodex.two,0))

let crySelectCodex = JSON.stringify(derivationCodes.crySelectCodex)
crySelectCodex.includes('A') == false
crySelectCodex.includes('0') == true

assert.equal(derivationCodes.oneCharCode.Ed25519_Seed == 'A')
assert.equal(derivationCodes.oneCharCode.Ed25519N == 'B')
assert.equal(derivationCodes.oneCharCode.X25519 == 'C')
assert.equal(derivationCodes.oneCharCode.Ed25519 == 'D')

assert.equal(derivationCodes.oneCharCode.Blake3_256 == 'E')
assert.equal(derivationCodes.oneCharCode.Blake2b_256 == 'F')
assert.equal(derivationCodes.oneCharCode.Blake2s_256 == 'G')
assert.equal(derivationCodes.oneCharCode.SHA3_256 == 'H')

assert.equal(derivationCodes.oneCharCode.SHA2_256 == 'I')
assert.equal(derivationCodes.oneCharCode.ECDSA_secp256k1_Seed == 'J')
assert.equal(derivationCodes.oneCharCode.Ed448_Seed == 'K')
assert.equal(derivationCodes.oneCharCode.X448 == 'L')

let oneCharCode = derivationCodes.oneCharCode
oneCharCode.includes('0') == false


assert.equal(derivationCodes.twoCharCode.Seed_128 == '0A')
assert.equal(derivationCodes.twoCharCode.Ed25519 == '0B')
assert.equal(derivationCodes.twoCharCode.ECDSA_256k1 == '0C')

let jsonString = JSON.stringify(derivationCodes.twoCharCode)
jsonString.includes('A') == false

}

/**
 * @description : Test the support functionality for cryptographic material
 * 
 */
async function test_cryMat(){
    await libsodium.ready
    let keypair = await libsodium.crypto_sign_keypair()
let verkey  = 'iN\x89Gi\xe6\xc3&~\x8bG|%\x90(L\xd6G\xddB\xef`\x07\xd2T\xfc\xe1\xcd.\x9b\xe4#'


// let bytes = stringToBytes(verkey).done(bytes =>
//     {
//         console.log(bytes);
//         return bytes
//     });



// //    verkey = b'iN\x89Gi\xe6\xc3&~\x8bG|%\x90(L\xd6G\xddB\xef`\x07\xd2T\xfc\xe1\xcd.\x9b\xe4#'
// prefix = 'BaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM'
// prebin = (b'\x05\xa5:%\x1d\xa7\x9b\x0c\x99\xfa-\x1d\xf0\x96@\xa13Y\x1fu\x0b\xbd\x80\x1f'
//           b'IS\xf3\x874\xbao\x90\x8c')
verkey = Buffer.from(verkey, 'binary')
console.log('verkey -------->',verkey.toString())
let prefix = 'BaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM'
let prebin = String.fromCharCode.apply(null, Buffer.from(verkey, 'utf-8'))


const cryMat = new Crymat(verkey)
   let response = cryMat._infil()
    //console.log("Response ------------------------->",response)
assert.deepStrictEqual(cryMat.raw , verkey) 
assert.deepStrictEqual(cryMat.code , derivationCodes.oneCharCode.Ed25519N) 
assert.deepStrictEqual(cryMat.qb64 , prefix) 
assert.deepStrictEqual(cryMat.qb2 , prebin) 
}


test_cryMat()



// async function stringToBytes(str)
// {
//     let reader = new FileReader();
//     let done = () => {};

//     reader.onload = event =>
//     {
//         done(new Uint8Array(event.target.result), str);
//     };
//     reader.readAsArrayBuffer(new Blob([str], { type: "application/octet-stream" }));

//     return { done: callback => { done = callback; } };
// }