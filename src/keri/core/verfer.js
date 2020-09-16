const { Crymat } = require('./cryMat')
const derivation_code = require('./derivationCode&Length')
const libsodium = require('libsodium-wrappers-sumo')

/**
 * @description  Verfer :sublclass of crymat,helps to verify signature of serialization
 *  using .raw as verifier key and .code as signature cypher suite
 */
class Verfer extends Crymat {

    constructor(...kwg) {

        super(...kwg)
        if (Object.values(derivation_code.oneCharCode.Ed25519N).includes(this.code) ||
            Object.values(derivation_code.oneCharCode.Ed25519).includes(this.code)) {

            this._verify = this._ed25519
        } else {
            throw `Unsupported code = ${this.code} for verifier.`
        }

    }


    /**
     * 
     * @param {bytes} sig   bytes signature  
     * @param {bytes} ser   bytes serialization  
     */
    verify(sig, ser) {

        return this._verify(sig = sig, ser = ser, key = this.raw)
    }

    /**
     * @description This method will verify ed25519 signature on Serialization using  public key 
     * @param {bytes} sig  
     * @param {bytes} ser 
     * @param {bytes} key 
     */


    _ed25519(sig, ser, key) {

        try {
            let result = libsodium.crypto_sign_verify_detached(sig, ser, key)
            if (result)
                return true
            else
                return false
        } catch (error) {
            throw error
        }

    }
}



module.exports = {Verfer}