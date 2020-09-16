'use strict'
const codeAndLength = require('./derivationCode&Length')
var Base64 = require('js-base64').Base64;

/**
 * @description CRYPTOGRAPHC MATERIAL BASE CLASS
 * @subclasses  provides derivation codes and key event element context specific
 * @Properties 
 *         .code  str derivation code to indicate cypher suite
        .raw   bytes crypto material only without code
        .pad  int number of pad chars given raw
        .qb64 str in Base64 with derivation code and crypto material
        .qb2  bytes in binary with derivation code and crypto material
 */
class Crymat {

    //   pad = ""
    //     BASE64_PAD = '='

    constructor(raw = null, qb64 = null, qb2 = null, code = codeAndLength.oneCharCode.Ed25519N, index = 0) {

        /*
          Validate as fully qualified
        Parameters:
            raw is bytes of unqualified crypto material usable for crypto operations
            qb64 is str of fully qualified crypto material
            qb2 is bytes of fully qualified crypto material
            code is str of derivation code

        When raw provided then validate that code is correct for length of raw
            and assign .raw
        Else when qb64 or qb2 provided extract and assign .raw and .code
        */


        this.raw = raw
        this.qb64 = qb64
        this.qb2 = qb2
        this.code = code
      //  console.log("raw length is ----->", raw.length)
     //   console.log("Code ----->", this.code)
        let rawString = raw.toString()
        ///typeof(this.raw)== typeof(Buffer.from('', 'binary') ||typeof(this.raw)== typeof(Buffer.from('', 'binary'))))
        if (this.raw) {
            if (!(Buffer.isBuffer(this.raw) || Array.isArray(this.raw))) {
                throw `Not a bytes or bytearray, raw= ${this.raw}.`
            }
         //   console.log("Buffer.byteLength(raw, 'utf-8') ---------->", Buffer.byteLength(raw, 'utf-8'))
            let pad = this._pad(this.raw)
               // console.log("PAD Value is ------->",pad)
            
            // this.raw = Buffer.byteLength(raw, 'utf-8')
            
            if (!((pad == 1 && Object.values(JSON.stringify(codeAndLength.CryOneSizes)).includes(this.code))
                || (pad == 2 && Object.values(codeAndLength.CryTwoSizes).includes(this.code)
                    || (pad == 0 && Object.values(codeAndLength.CryFourSizes).includes(this.code))))) {
                throw `Wrong code= ${this.code} for raw= ${this.raw} .`
            }
            if (Object.values(codeAndLength.CryCntCodex).includes(this.code)
                && (index < 0) || (index > codeAndLength.CRYCNTMAX)) {
                throw `Invalid index=${index} for code=${code}.`
            }
                 //   console.log('codeAndLength.cryAllRawSizes[this.code]-------->',codeAndLength.cryAllRawSizes[this.code])
                 
            raw = raw.slice(0, codeAndLength.cryAllRawSizes[this.code])
         //   console.log("raw value after slicing is --->",raw.toString())
            if (raw.length != codeAndLength.cryAllRawSizes[this.code]) {
                throw `Unexpected raw size= ${raw.length} for code= ${this.code}"
                " not size= ${codeAndLength.cryAllRawSizes[this.code]}.`
            }

        }
        else if (!(qb64 = null)) {
            qb64 = qb64.toString('utf-8')
            this._exfil(qb64)
        }
    }

    _pad(raw) {
       // console.log("raw length is ------>", Buffer.byteLength(raw, 'binary'))
        let reminder =  Buffer.byteLength(raw, 'binary') % 3
      //  console.log("reminder", reminder)
        if (reminder == 0)
            return 0
        else {
            return 3 - reminder
        }
    }

    _exfil(qb64) {

        let cs = 1   //code size
        let code_slice = qb64.slice(0, cs)
        let index = 0

        if (Object.values(codeAndLength.oneCharCode).includes(code_slice)) {
            qb64 = qb64.slice(0, codeAndLength.CryOneSizes[code_slice])
        }

        else if (code_slice == codeAndLength.crySelectCodex.two) {
            cs += 1
            code_slice = qb64.slice(0, cs)
            if (!Object.values(codeAndLength.twoCharCode).includes(code_slice))
                throw `Invalid derivation code = ${code_slice} in ${qb64}.`

            qb64 = qb64.slice(0, codeAndLength.CryTwoSizes[code_slice])
        }

        else if (code_slice == codeAndLength.crySelectCodex.four) {
            cs += 3
            code_slice = qb64.slice(0, cs)
            if (!Object.values(codeAndLength.fourCharCode).includes(code_slice))
                throw `Invalid derivation code = ${code_slice} in ${qb64}.`

            qb64 = qb64.slice(0, codeAndLength.CryFourSizes[code_slice])
        }
        else if (code_slice == codeAndLength.crySelectCodex.dash) {
            cs += 1
            code_slice = qb64.slice(0, cs)
            if (!Object.values(codeAndLength.CryCntCodex).includes(code_slice))
                throw `Invalid derivation code = ${code_slice} in ${qb64}.`

            qb64 = qb64.slice(0, codeAndLength.CryCntSizes[code_slice])
            cs += 2  // increase code size
            index = B64ToInt(qb64.slice(cs-2 , cs))  // last two characters for index
            print('base64 to int conversion',index)
        }

        else {
            throw `Improperly coded material = ${qb64}`
        }

        if (qb64.length != code.cryAllSizes[code_slice])
            throw `Unexpected qb64 size= ${qb64.length} for code= ${code_slice} not size= ${code.cryAllSizes[code_slice]}.`

        pad = cs % 4
        base = qb64.slice(pre, qb64.length) + pad * BASE64_PAD
        raw = Base64.decode(Buffer.from(base, "utf-8"))

        if (raw.length != Math.floor((qb64.length - pre) / 3)) {
            throw `Improperly qualified material = ${qb64}`
        }
        this._code = code_slice
        this._raw = raw
        this._index = index


    }

    _infil() {

      let  encodedVal = Base64.encodeURI(this._raw)
        console.log("Encoded value ---------------->",encodedVal)
        let decodedVal = Base64.decode(encodedVal)
        console.log("decodedVal ---------------->",encodedVal)

        if (Object.values(codeAndLength.CryCntCodex).includes(this.code)){
            let l = codeAndLength.CryCntIdxSizes[this.code]
            let full = `${this.code}${}`
        }

      let  pad = this.pad
        // Validate pad for code length
        if ((this.code).length % 4 != pad) {
            // Here pad is not the reminder of code length
            throw `Invalid code = ${this.code} for converted raw pad = ${this.pad}.`
        }
        return decodedVal.slice(0, -pad)
    }

     qb64() {
        // qb64 = Qualified Base64 version,this will return qualified base64 version assuming
        // self.raw and self.code are correctly populated

        return this._infil()
    }

    qb2() {
        /* Property qb2:
         Returns Fully Qualified Binary Version Bytes
         redo to use b64 to binary decode table since faster
         """
         # rewrite to do direct binary infiltration by
         # decode self.code as bits and prepend to self.raw
         */
        return Buffer.from(this._infil(), 'utf-8')
    }

    raw() {
        return this.raw
    }

    pad() {
        return this._pad(this.raw)
    }

    code() {
        return this._code

    }
}


module.exports = { Crymat }