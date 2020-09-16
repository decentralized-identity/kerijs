const { Crymat } = require("./cryMat");
const derivation_code = require('./derivationCode&Length')
const libsodium = require('libsodium-wrappers-sumo')
/**
 * @description Signer is CryMat subclass with method to create signature of serialization
 * It will use .raw as signing (private) key seed
 * .code as cipher suite for signing and new property .verfer whose property
 *  .raw is public key for signing.
 *  If not provided .verfer is generated from private key seed using .code
    as cipher suite for creating key-pair.
 */
class Signer extends Crymat {

    constructor(raw = Buffer.from('', 'utf-8'), code = derivation_code.oneCharCode.ECDSA_secp256k1_Seed, transferable = True, ...kwa) {
        try {
            super(raw = raw, code = code, ...kwa)
        } catch (error) {
            if (code = derivation_code.oneCharCode.ECDSA_secp256k1_Seed) {
                raw = libsodium.randombytes_buf(libsodium.crypto_sign_SEEDBYTES)
                super(raw = raw, code = code, ...kwa)
            } else
                throw `Unsupported signer code = ${code}.`

        }
        if(this.code == derivation_code.oneCharCode.ECDSA_secp256k1_Seed){
            this._sign = this._ed25519
             seedKeypair = libsodium.crypto_sign_seed_keypair(this.raw)
             verkey = seedKeypair.publicKey
             sigkey = seedKeypair.privateKey
             
        }

    }


}


module.exports = { Signer }