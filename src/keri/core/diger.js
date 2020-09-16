const {Crymat} = require('./cryMat')
const derivation_code = require('./derivationCode&Length')
const libsodium = require('libsodium-wrappers-sumo')
const blake3 = require('blake3')

/**
 * @description : Diger is subset of Crymat and is used to verify the digest of serialization
 * It uses  .raw : as digest
 * .code as digest algorithm
 * 
 */
class Diger extends Crymat {

    //This constructor will assign digest verification function to ._verify
    constructor(raw=Buffer.from('','utf-8'), ser=Buffer.from('','utf-8'), code=derivation_code.oneCharCode.Blake3_256, ...kwa){

        try{
            super(raw=raw, code=code, ...kwa)
        }catch(error){
                if(!ser)
                throw error
                if(code=derivation_code.oneCharCode.Blake3_256 ){
                dig = blake3.createHash(ser).digest()
                    super(raw=dig, code=code, ...kwa)
            }else {
                throw   `Unsupported code = ${code} for digester.`
            }
        }


        if(this.code ==derivation_code.oneCharCode.Blake3_256)
        this._verify = this._blake3_256
        else 
        throw   `Unsupported code = ${code} for digester.`
    }



    /**
     * 
     * @param {bytes} ser  serialization bytes
     * @description  This method will return true if digest of bytes serialization ser matches .raw
     * using .raw as reference digest for ._verify digest algorithm determined
        by .code
     */
    verify(ser){
        return this._verify(ser=ser, dig=this.raw)
    }
  static  _blake3_256(ser, dig){
    return blake3.createHash(ser).digest() == dig
  }
}


module.exports = {Diger}