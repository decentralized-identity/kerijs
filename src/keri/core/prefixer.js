const { Crymat } = require('./cryMat')
const derivation_code = require('./derivationCode&Length')
const libsodium = require('libsodium-wrappers-sumo')
const blake3 = require('blake3')
const { version } = require('utf8')
const { Verfer } = require('./verfer')
const verfer = require('./verfer')
const { Sigver } = require('./sigver')
    +
    /**
     * @description Aider is CryMat subclass for autonomic identifier prefix using basic derivation
        from public key
        inherited attributes and properties:
        Attributes:
        Properties:
        Methods:verify():  Verifies derivation of aid
     */


    class Prefixer extends Crymat {



        //elements in digest or signature derivation from inception icp
        IcpLabels = ["sith", "keys", "nxt", "toad", "wits", "cnfg"]

        // elements in digest or signature derivation from delegated inception dip
        DipLabels = ["sith", "keys", "nxt", "toad", "wits", "perm", "seal"]



        /**
         * @description  // This constructor will assign
         *  ._verify to verify derivation of aid  = .qb64
         */
        constructor(raw = null, code = derivation_code.oneCharCode.Ed25519N, ked = null, seed = null, secret = null, ...kwa) {

            try {
                super(raw = raw, code = code, ...kwa)
            } catch (error) {
                if (!(ked || code))
                    throw error  // throw error if no ked found 
                verfer = this._derive(ked) // else obtain AID using ked
                super(raw = verfer.raw, code = verfer.code, ...kwa)
            }

            if (this.code == derivation_code.oneCharCode.Ed25519N)
                this._verify = this._ed25519n
            else if (this.code == derivation_code.oneCharCode.Ed25519)
                this._verify = this._ed25519
            else if (this.code == derivation_code.oneCharCode.Blake3_256)
                this._verify = this._VerifyDigBlake3_256
            else if (code == CryTwoDex.Ed25519)
                this._verify = this._VerifySigEd25519
            else
                throw `Unsupported code = ${this.code} for prefixer.`

        }



        /**
         * @description   Returns tuple (raw, code) of basic nontransferable 
         * Ed25519 prefix (qb64) as derived from key event dict ke
         * @param {*} ked  ked is inception key event dict
         * @param {*} seed seed is only used for sig derivation it is the secret key/secret
         * @param {*} secret secret or private key 
         */
        derive(ked, seed = null, secret = null) {
            return this._derive(ked = ked, seed = seed, secret = secret)
        }



        /**
         * @descriptionReturns return  (raw, code) of basic nontransferable Ed25519 prefix (qb64)
         * @param {*} ked  ked is inception key event dict
         * @param {*} seed seed is only used for sig derivation it is the secret key/secret
         * @param {*} secret secret or private key 
         */
        _DeriveBasicEd25519N(ked, seed = null, secret = null) {

            try {
                keys = ked["keys"]
                if (keys.length != 1)
                    throw `Basic derivation needs at most 1 key got ${keys.length} keys instead`
                verfer = new Verfer(qb64 = keys[0])

            } catch (e) { throw `Error extracting public key = ${e}` }

            if (!(Object.values(derivation_code.oneCharCode.Ed25519N).includes(verfer.code))) {
                throw `Invalid derivation code = ${verfer.code}.`
            }

            try {
                if ((Object.values(derivation_code.oneCharCode.Ed25519N).includes(verfer.code)) && ked["nxt"]) {
                    throw `Non-empty nxt = ${ked["nxt"]} for non-transferable code = ${verfer.code}`
                }
            } catch (e) { throw `Error checking nxt = ${e}` }

            return { "raw": verfer.raw, "code": verfer.code }
        }



        /**
         * @description  Returns tuple raw, code of basic Ed25519 prefix (qb64)
                         as derived from key event dict ked
         * @param {*} ked 
         * @param {*} seed 
         * @param {*} secret 
         */
        _DeriveBasicEd25519(ked, seed = null, secret = null) {



            try {
                keys = ked["keys"]
                if (keys.length != 1)
                    throw `Basic derivation needs at most 1 key got ${keys.length} keys instead`
                verfer = new Verfer(qb64 = keys[0])

            } catch (e) { throw `Error extracting public key = ${e}` }

            if (!(Object.values(derivation_code.oneCharCode.Ed25519N).includes(verfer.code))) {
                throw `Invalid derivation code = ${verfer.code}.`
            }
            return { "raw": verfer.raw, "code": verfer.code }
        }



        /**
         * @description Returns raw, code of basic Ed25519 pre (qb64)
                        as derived from key event dict ked
         * @param {*} ked  ked is inception key event dict
         * @param {*} seed seed is only used for sig derivation it is the secret key/secret
         * @param {*} secret secret or private key 
         */
        _DeriveDigBlake3_256(ked, seed = null, secret = null) {
            let [labels, values, ser, dig]
            ilk = ked["ilk"]

            if (ilk == Ilks.icp)
                labels = this.IcpLabels
            if (ilk == Ilks.icp)
                labels = this.DipLabels
            else
                throw `Invalid ilk = ${ilk} to derive pre.`

            for (let l in labels) {
                if (Object.values(ked).includes(l)) { `Missing element = {l} from ked.` }
            }

            values = extractValues(ked = ked, labels = labels)
            ser = Buffer.from("".concat(values), 'utf-8')
            dig = blake3.createHash(ser).digest()
            return { 'dig': dig, 'blake3_256': derivation_code.oneCharCode.Blake3_256 }
        }



        /**
         * @description   Returns  raw, code of basic Ed25519 pre (qb64)
                    as derived from key event dict ked
         * @param {*} ked  ked is inception key event dict
         * @param {*} seed seed is only used for sig derivation it is the secret key/secret
         * @param {*} secret secret or private key 
         * 
         * 
         */
        _DeriveSigEd25519(ked, seed = null, secret = null) {

            let [labels, values, ser, keys, verfer, signer, sigver]
            ilk = ked["ilk"]

            if (ilk == Ilks.icp)
                labels = this.IcpLabels
            if (ilk == Ilks.icp)
                labels = this.DipLabels
            else
                throw `Invalid ilk = ${ilk} to derive pre.`

            for (let l in labels) {
                if (!Object.values(ked).includes(l)) { `Missing element = {l} from ked.` }
            }

            values = extractValues(ked = ked, labels = labels)
            ser = Buffer.from("".concat(values), 'utf-8')

            try {
                keys = ked["keys"]
                if (keys.length != 1)
                    throw `Basic derivation needs at most 1 key  got ${keys.length} keys instead`

                verfer = Verfer(qb64 = keys[0])
            } catch (exception) {
                throw Error`extracting public key = ${exception}`
            }


            if (verfer.code != derivation_code.oneCharCode.Ed25519)
                throw `Invalid derivation code = ${verfer.code}`
            if (!(seed || secret))
                throw `Missing seed or secret.`

            signer = Signer(raw = seed, qb64 = secret)

            if (verfer.raw != signer.verfer.raw)
                throw `Key in ked not match seed.`

            sigver = signer.sign(ser = ser)
            return { 'sigver': sigver.raw, 'Ed25519': derivation_code.twoCharCode.Ed25519 }

        }



        /**
         * @description  This function will return TRUE if derivation from iked for .code matches .qb64
         * @param {*} ked inception key event dict
         */
        verify(ked) {

            return this._verify(ked = ked, pre = this.qb64)

        }



        /**
         * @description This will return  True if verified raises exception otherwise
                Verify derivation of fully qualified Base64 pre from inception iked dict
         * @param {*} ked    ked is inception key event dict
         * @param {*} pre   pre is Base64 fully qualified prefix
         */
 _VerifyBasicEd25519N(ked, pre) {

            let [keys]

            try {
                keys = ked["keys"]
                if (keys.length != 1)
                    return false
                if (keys[0] != pre)
                    return false
                if (ked['nxt'])
                    return false
            } catch (e) {
                return false
            }
            return true
        }




        /**
         * @description  Returns True if verified raises exception otherwise
                         Verify derivation of fully qualified Base64 prefix from
                         inception key event dict (ked)
         * @param {*} ked    ked is inception key event dict
         * @param {*} pre   pre is Base64 fully qualified prefix
         */
_VerifyBasicEd25519(ked, pre) {
            let [keys]

            try {
                keys = ked["keys"]
                if (keys.length != 1)
                    return false
                if (keys[0] != pre)
                    return false
                if (ked['nxt'])
                    return false
            } catch (e) {
                return false
            }
            return true
        }




/**
 * @description : Verify derivation of fully qualified Base64 prefix from
                  inception key event dict (ked). returns TRUE if verified else raise exception
         * @param {*} ked    ked is inception key event dict
         * @param {*} pre   pre is Base64 fully qualified prefix
 */
        _VerifyDigBlake3_256(ked, pre){

            let raw,code = ''
try{

   response =  this._DeriveDigBlake3_256(ked=ked)
    raw  = response.dig
    code = response.blake3_256

    crymat = CryMat(raw=raw, code=derivation_code.oneCharCode.Blake3_256)
    if (crymat.qb64 != pre)
        return False



}catch(exception){
    return false
}
return True

        }



        /**
  * @description : Verify derivation of fully qualified Base64 prefix from
        inception key event dict (ked). returns TRUE if verified else raise exception
         * @param {*} ked    ked is inception key event dict
         * @param {*} pre   pre is Base64 fully qualified prefix
         */
        _VerifySigEd25519(ked, pre){

            let [ilk,]

            try{

                let [labels, values, ser, keys, verfer, signer, sigver]
                ilk = ked["ilk"]
    
                if (ilk == Ilks.icp)
                    labels = this.IcpLabels
                if (ilk == Ilks.icp)
                    labels = this.DipLabels
                else
                    throw `Invalid ilk = ${ilk} to derive pre.`
    
                for (let l in labels) {
                    if (!Object.values(ked).includes(l)) { `Missing element = ${l} from ked.` }
                }
    
                values = extractValues(ked = ked, labels = labels)
                ser = Buffer.from("".concat(values), 'utf-8')
                try{
                if(keys.length !=1)
                            throw `Basic derivation needs at most 1 key got ${keys.length} keys instead`
                            verfer = Verfer(qb64=keys[0])
                }catch(e){
                    throw `Error extracting public key = ${e}`
                }
              if  (!(Object.values(derivation_code.oneCharCode.Ed25519).includes(verfer.code))) {
                    throw `Invalid derivation code = ${verfer.code}`
                }

                sigver =  new Sigver(qb64=pre, verfer=verfer)

                result = sigver.getVerfer.verify(sig=sigver.raw, ser=ser)
                return result
                
            }catch(exception){
                return false
            }

            return true
        }

    }


module.exports = { Prefixer }