const { Crymat } = require('./cryMat')
const verfer = require('./verfer')
const { Verfer } = require('./verfer')



/**
 * @description  A Crymat subclass holding signature with verfer property
 * Verfer verify signature of serialization
 * .raw is signature and .code is signature cipher suite
 * .verfer property to hold Verfer instance of associated verifier public key
 */
class Sigver extends Crymat {

  constructor(verfer = null, ...kwg) {
// Assign verfer to .verfer attribute
        super(...kwg)
        this._verfer = verfer
    }


 /**
  * @description  this will return verfer instance 
  */   
     getVerfer(){
        return this._verfer
    }

    setVerfer(verfer){
        this._verfer = verfer
    }
}


module.exports = { Sigver }