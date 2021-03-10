const { Databaser } = require('./database');

/**
 * @description  Logger sets up named sub databases with Keri Event Logs within main database
 *
 *  Attributes:
        see superclass Databaser for inherited attributes

        .evts is named sub DB whose values are serialized events
            dgKey
            DB is keyed by identifer prefix plus digest of serialized event
            Only one value per DB key is allowed

        .dtss is named sub DB of datetime stamp strings in ISO 8601 format of
            dgKey
            the datetime when the event was first seen by log.
            Used for escrows timeouts and extended validation.
            DB is keyed by identifer prefix plus digest of serialized event

        .sigs is named sub DB of fully qualified event signatures
            dgKey
            DB is keyed by identifer prefix plus digest of serialized event
            More than one value per DB key is allowed

        .rcts is named sub DB of event receipt couplets from nontransferable
            signers. Each couplet is concatenation of fully qualified
            non-transferale prefix plus fully qualified event signature
            by witness, watcher, or validator.
            dgKey
            SB is keyed by identifer prefix plus digest of serialized event
            More than one value per DB key is allowed

        .ures is named sub DB of unverified event receipt escrowed couplets from
            non-transferable signers. Each couplet is concatenation of fully
            qualified non-transferable identfier prefix plus fully qualified
            event signature by witness, watcher, or validator
            dgKey
            SB is keyed by controller prefix plus digest
            of serialized event
            More than one value per DB key is allowed

        .vrcs is named sub DB of event validator receipt triplets from transferable
            signers. Each triplet is concatenation of  three fully qualified items
            of validator. These are transferable prefix, plus latest establishment
            event digest, plus event signature.
            When latest establishment event is multisig then there will
            be multiple triplets one per signing key, each a dup at same db key.
            dgKey
            SB is keyed by identifer prefix plus digest of serialized event
            More than one value per DB key is allowed

        .vres is named sub DB of unverified event validator receipt escrowed
            triplets from transferable signers. Each triplet is concatenation of
            three fully qualified items of validator. These are transferable
            prefix, plus latest establishment event digest, plus event signature.
            When latest establishment event is multisig then there will
            be multiple triplets one per signing key, each a dup at same db key.
            dgKey
            SB is keyed by identifer prefix plus digest of serialized event
            More than one value per DB key is allowed

        .kels is named sub DB of key event log tables that map sequence numbers
            to serialized event digests.
            snKey
            Values are digests used to lookup event in .evts sub DB
            DB is keyed by identifer prefix plus sequence number of key event
            More than one value per DB key is allowed

        .pses is named sub DB of partially signed escrowed event tables
            that map sequence numbers to serialized event digests.
            snKey
            Values are digests used to lookup event in .evts sub DB
            DB is keyed by identifer prefix plus sequence number of key event
            More than one value per DB key is allowed

        .ooes is named sub DB of out of order escrowed event tables
            that map sequence numbers to serialized event digests.
            snKey
            Values are digests used to lookup event in .evts sub DB
            DB is keyed by identifer prefix plus sequence number of key event
            More than one value per DB key is allowed

        .dels is named sub DB of deplicitous event log tables that map sequence numbers
            to serialized event digests.
            snKey
            Values are digests used to lookup event in .evts sub DB
            DB is keyed by identifer prefix plus sequence number of key event
            More than one value per DB key is allowed

        .ldes is named sub DB of likely deplicitous escrowed event tables
            that map sequence numbers to serialized event digests.
            snKey
            Values are digests used to lookup event in .evts sub DB
            DB is keyed by identifer prefix plus sequence number of key event
            More than one value per DB key is allowed
 */

class Logger extends Databaser {
  constructor() {
    super(null, 'main', true);
  }

  /**
      * @description  Use dgKey()
             Write serialized event bytes val to key
             Does not overwrite existing val if any
             Returns True If val successfully written Else False
             Return False if key already exists
      * @param {*} key
      * @param {*} val
      */
  putEvt(key, val) {
    return this.putVal(Buffer.from('evts.', 'binary'), key, val);
  }

  /**
      * @description  Use dgKey()
             Write serialized event bytes val to key
             Overwrites existing val if any
             Returns True If val successfully written Else False
      * @param {} key
      * @param {*} val
      */
  setEvt(key, val) {
    return this.setVal(Buffer.from('evts.', 'binary'), key, val);
  }

  /**
      * @description  Use dgKey()
             Write serialized event bytes val to key
             Overwrites existing val if any
             Returns True If val successfully written Else False
      * @param {} key
      * @param {*} val
      */
  getEvt(key) {
    return this.getVal(Buffer.from('evts.', 'binary'), key);
  }

  /**
  * @description  Use dgKey()
         Deletes value at key.
         Returns True If key exists in database Else False
  * @param {*} key
  */
  delEvt(key) {
    return this.delVal(Buffer.from('evts.', 'binary'), key);
  }

  /**
      *    Use dgKey()
             Write serialized event datetime stamp val to key
             Does not overwrite existing val if any
             Returns True If val successfully written Else False
             Returns False if key already exists
      * @param {*} key
      * @param {*} val
      */

  putDts(key, val) {
    return this.putVal(Buffer.from('dtss.', 'binary'), key, val);
  }

  /**
      * @description   Use dgKey()
             Write serialized event datetime stamp val to key
             Overwrites existing val if any
             Returns True If val successfully written Else False
      * @param {*} key
      * @param {*} val
      */
  setDts(key, val) {
    return this.setVal(Buffer.from('dtss.', 'binary'), key, val);
  }

  /**
      * @description  Use dgKey()
             Return datetime stamp at key
             Returns None if no entry at key
      * @param {*} key
      */
  getDts(key) {
    return Buffer.from(this.getVal(Buffer.from('dtss.', 'binary'), key), 'binary');
  }

  /**
      * @description  Use dgKey()
             Deletes value at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delDts(key) {
    return this.delVal(Buffer.from('dtss.', 'binary'), key);
  }

  /**
      * @description   Use dgKey()
             Return list of signatures at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */
  getSigs(key) {
    return this.getVals(Buffer.from('sigs.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Return iterator of signatures at key
             Raises StopIteration Error when empty
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */

  getSigsIter(key) {
    return this.getValsIter(Buffer.from('sigs.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Write each entry from list of bytes signatures vals to key
             Adds to existing signatures at key if any
             Returns True If no error
             Apparently always returns True (is this how .put works with dupsort=True)
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putSigs(key, vals) {
    return this.putVals(Buffer.from('sigs.', 'binary'), key, vals);
  }

  /**
      * @description  Use dgKey()
             Return list of signatures at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} val
      */
  addSig(key, val) {
    return this.addVal(Buffer.from('sigs.', 'binary'), key, val);
  }

  //   /**
  //       * @description   Use dgKey()
  //              Return list of signatures at key
  //              Returns empty list if no entry at key
  //              Duplicates are retrieved in lexocographic order not insertion order.
  //       * @param {*} key
  //       */
  //   getSigs(key) {
  //     return this.getVals(Buffer.from('sigs.', 'binary'), key);
  //   }

  /**
      * @description   Use dgKey()
             Return count of signatures at key
             Returns zero if no entry at key
      * @param {*} key
      */
  cntSigs(key) {
    return this.cntVals(Buffer.from('sigs.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Deletes all values at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delSigs(key) {
    return this.delVals(Buffer.from('sigs.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Write each entry from list of bytes receipt couplets vals to key
             Adds to existing receipts at key if any
             Returns True If no error
             Apparently always returns True (is this how .put works with dupsort=True)
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putRcts(key, vals) {
    return this.putVals(Buffer.from('rcts.', 'binary'), key, vals);
  }

  /**
      * @description   Use dgKey()
             Add receipt couplet val bytes as dup to key in db
             Adds to existing values at key if any
             Returns True if written else False if dup val already exists
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} val
      */
  addRct(key, val) {
    return this.addVal(Buffer.from('rcts.', 'binary'), key, val);
  }

  /**
      * @description      Use dgKey()
             Return list of receipt couplets at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */
  getRcts(key) {
    return this.getVals(Buffer.from('rcts.', 'binary'), key);
  }

  /**
      * @description    Use dgKey()
             Return count of receipt couplets at key
             Returns zero if no entry at key
      * @param {*} key
      */
  cntRcts(key) {
    return this.cntVals(Buffer.from('rcts.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Deletes all values at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delRcts(key) {
    return this.delVals(Buffer.from('rcts.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Return iterator of signatures at key
             Raises StopIteration Error when empty
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */

  getRctsIter(key) {
    return this.getValsIter(Buffer.from('rcts.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Write each entry from list of bytes receipt couplets vals to key
             Adds to existing receipts at key if any
             Returns True If no error
             Apparently always returns True (is this how .put works with dupsort=True)
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putUres(key, vals) {
    return this.putVals(Buffer.from('ures.', 'binary'), key, vals);
  }

  /**
      * @description   Use dgKey()
             Add receipt couplet val bytes as dup to key in db
             Adds to existing values at key if any
             Returns True if written else False if dup val already exists
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} val
      */
  addUre(key, val) {
    return this.addVal(Buffer.from('ures.', 'binary'), key, val);
  }

  /**
      * @description      Use dgKey()
             Return list of receipt couplets at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */
  getUres(key) {
    return this.getVals(Buffer.from('ures.', 'binary'), key);
  }

  /**
      * @description    Use dgKey()
             Return count of receipt couplets at key
             Returns zero if no entry at key
      * @param {*} key
      */
  cntUres(key) {
    return this.cntVals(Buffer.from('ures.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Deletes all values at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delUres(key) {
    return this.delVals(Buffer.from('ures.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Return iterator of signatures at key
             Raises StopIteration Error when empty
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */

  getUresIter(key) {
    return this.getValsIter(Buffer.from('ures.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Write each entry from list of bytes receipt couplets vals to key
             Adds to existing receipts at key if any
             Returns True If no error
             Apparently always returns True (is this how .put works with dupsort=True)
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putVrcs(key, vals) {
    return this.putVals(Buffer.from('vrcs.', 'binary'), key, vals);
  }

  /**
      * @description   Use dgKey()
             Add receipt couplet val bytes as dup to key in db
             Adds to existing values at key if any
             Returns True if written else False if dup val already exists
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} val
      */
  addVrc(key, val) {
    return this.addVal(Buffer.from('vrcs.', 'binary'), key, val);
  }

  /**
      * @description      Use dgKey()
             Return list of receipt couplets at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */
  getVrcs(key) {
    return this.getVals(Buffer.from('vrcs.', 'binary'), key);
  }

  /**
      * @description    Use dgKey()
             Return count of receipt couplets at key
             Returns zero if no entry at key
      * @param {*} key
      */
  cntVrcs(key) {
    return this.cntVals(Buffer.from('vrcs.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Deletes all values at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delVrcs(key) {
    return this.delVals(Buffer.from('vrcs.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Return iterator of signatures at key
             Raises StopIteration Error when empty
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */

  getVrcsIter(key) {
    return this.getValsIter(Buffer.from('vrcs.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Write each entry from list of bytes receipt couplets vals to key
             Adds to existing receipts at key if any
             Returns True If no error
             Apparently always returns True (is this how .put works with dupsort=True)
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putVres(key, vals) {
    return this.putVals(Buffer.from('vres.', 'binary'), key, vals);
  }

  /**
      * @description   Use dgKey()
             Add receipt couplet val bytes as dup to key in db
             Adds to existing values at key if any
             Returns True if written else False if dup val already exists
             Duplicates are inserted in lexocographic order not insertion order.
      * @param {*} key
      * @param {*} val
      */
  addVre(key, val) {
    return this.addVal(Buffer.from('vres.', 'binary'), key, val);
  }

  /**
      * @description      Use dgKey()
             Return list of receipt couplets at key
             Returns empty list if no entry at key
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */
  getVres(key) {
    return this.getVals(Buffer.from('vres.', 'binary'), key);
  }

  /**
      * @description    Use dgKey()
             Return count of receipt couplets at key
             Returns zero if no entry at key
      * @param {*} key
      */
  cntVres(key) {
    return this.cntVals(Buffer.from('vres.', 'binary'), key);
  }

  /**
      * @description  Use dgKey()
             Deletes all values at key.
             Returns True If key exists in database Else False
      * @param {*} key
      */
  delVres(key) {
    return this.delVals(Buffer.from('vres.', 'binary'), key);
  }

  /**
      * @description Use dgKey()
             Return iterator of signatures at key
             Raises StopIteration Error when empty
             Duplicates are retrieved in lexocographic order not insertion order.
      * @param {*} key
      */

  getVresIter(key) {
    return this.getValsIter(Buffer.from('vres.', 'binary'), key);
  }

  /**
      * @description     Use snKey()
         Write each key event dig entry from list of bytes vals to key
         Adds to existing event indexes at key if any
         Returns True If at least one of vals is added as dup, False otherwise
         Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putKes(key, vals) {
    return this.putIOVals(Buffer.from('kels.', 'binary'), key, vals);
  }

  /**
      * @description   Use snKey()
         Add key event val bytes as dup to key in db
         Adds to existing event indexes at key if any
         Returns True if written else False if dup val already exists
         Duplicates are inserted in insertion order.
      */
  async addKe(key, val, flag) {
    return await this.addIOVal(Buffer.from('kels.', 'binary'), key, val, flag);
  }

  /**
      * @description  Use snKey()
         Return list of key event dig vals at key
         Returns empty list if no entry at key
         Duplicates are retrieved in insertion order.
      * @param {*} key
      */
  getKes(key) {
    return this.getIOValues(Buffer.from('kels.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
        Return last inserted dup key event dig vals at key
        Returns None if no entry at key
        Duplicates are retrieved in insertion order.
      */
  getKeLast(key) {
    return this.getIOValsLast(Buffer.from('kels.', 'binary'), key);
  }

  /**
      * @description   Use snKey()
         Return count of dup key event dig val at key
         Returns zero if no entry at key
      * @param {*} key
      */
  cntKes(key) { return this.cntIoVals(Buffer.from('kels.', 'binary'), key); }

  /**
      * @description  Use snKey()
        Deletes all values at key.
        Returns True If key exists in database Else False
      * @param {*} key
      */
  delKes(key) { return this.delIoVals(Buffer.from('kels.', 'binary'), key); }

  /**
      * @description   Returns iterator of all dup vals in insertion order for all entries
         with same prefix across all sequence numbers without gaps. Stops if
         encounters gap.
         Assumes that key is combination of prefix and sequence number given
         by .snKey().

         Raises StopIteration Error when empty.
         Duplicates are retrieved in insertion order.

         Parameters:
             db is opened named sub db with dupsort=True
             pre is bytes of itdentifier prefix prepended to sn in key
                 within sub db's keyspace
      * @param {*} pre
      */

  getKelIter(pre) {
    if (pre) {
      pre = encodeURIComponent(pre);
    }
    return this.getIoValsAllPreIter(Buffer.from('kels.', 'binary'), pre);
  }

  /**
      * @description    Returns iterator of last dup vals in insertion order for all entries
         with same prefix across all sequence numbers without gaps. Stops if
         encounters gap.
         Assumes that key is combination of prefix and sequence number given
         by .snKey().

         Raises StopIteration Error when empty.
         Duplicates are retrieved in insertion order.

      * @param {*} pre is bytes of itdentifier prefix prepended to sn in key
                 within sub db's keyspace
      */
  getKelEstIter(pre) {
    if (pre) {
      pre = encodeURIComponent(pre);
    }
    return this.getIoValsLastAllPreIter(Buffer.from('kels.', 'binary'), pre);
  }

  /**
      * @description  Use snKey()
      Write each partial signed escrow event entry from list of bytes dig vals to key
      Adds to existing event indexes at key if any
      Returns True If at least one of vals is added as dup, False otherwise
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} vals
      */

  putPses(key, vals) {
    return this.putIOVals(Buffer.from('pses.', 'binary'), key, vals);
  }

  /**
      * @description  Use snKey()
    Add Partial signed escrow val bytes as dup to key in db
    Adds to existing event indexes at key if any
    Returns True if written else False if dup val already exists
    Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} val
      */
  addPse(key, val) {
    return this.addIOVal(Buffer.from('pses.', 'binary'), key, val);
  }

  /**
      * @description  Use snKey()
     Return list of partial signed escrowed event dig vals at key
     Returns empty list if no entry at key
     Duplicates are retrieved in insertion order.
      * @param {*} key
      */
  getPses(key) {
    return this.getIOValues(Buffer.from('pses.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Return last inserted dup partial signed escrowed event dig val at key
      Returns None if no entry at key
      Duplicates are retrieved in insertion order.
      */
  getPsesLast(key) {
    return this.getIOValsLast(Buffer.from('pses.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Return count of dup event dig vals at key
      Returns zero if no entry at key
      * @param {*} key
      */
  cntPses(key) {
    return this.cntIoVals(Buffer.from('pses.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Deletes all values at key.
      Returns True If key exists in database Else False
      * @param {*} key
      */
  delPses(key) {
    return this.delIoVals(Buffer.from('pses.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Write each out of order escrow event dig entry from list of bytes vals to key
      Adds to existing event indexes at key if any
      Returns True If at least one of vals is added as dup, False otherwise
      Duplicates are inserted in insertion order.
      * @param {} key
      * @param {*} vals
      */
  putOoes(key, vals) { return this.putIOVals(Buffer.from('ooes.', 'binary'), key, vals); }

  /**
      * @description  Use snKey()
      Add out of order escrow val bytes as dup to key in db
      Adds to existing event indexes at key if any
      Returns True if written else False if dup val already exists
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} val
      */
  addOoe(key, val) {
    return this.addIOVal(Buffer.from('ooes.', 'binary'), key, val);
  }

  /**
      * @description  Use snKey()
     Return list of out of order escrow event dig vals at key
     Returns empty list if no entry at key
     Duplicates are retrieved in insertion order.
      * @param {*} key
      */
  getOoes(key) { return this.getIOValues(Buffer.from('ooes.', 'binary'), key); }

  /**
      * @description  Use snKey()
      Return last inserted dup out of order escrow event dig at key
      Returns None if no entry at key
      Duplicates are retrieved in insertion order.

      * @param {*} key
      */
  getOoesLast(key) {
    return this.getIOValsLast(Buffer.from('ooes.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Return count of dup event dig at key
      Returns zero if no entry at key
      * @param {*} key
      */

  cntOoes(key) {
    return this.cntIoVals(Buffer.from('ooes.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Deletes all values at key.
      Returns True If key exists in database Else False
      * @param {*} key
      */
  delOoes(key) {
    return this.delIoVals(Buffer.from('ooes.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Write each duplicitous event entry dig from list of bytes vals to key
      Adds to existing event indexes at key if any
      Returns True If at least one of vals is added as dup, False otherwise
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} vals
      */
  putDes(key, vals) { return this.putIOVals(Buffer.from('dels.', 'binary'), key, vals); }

  /**
      * @description  Use snKey()
      Add duplicate event index val bytes as dup to key in db
      Adds to existing event indexes at key if any
      Returns True if written else False if dup val already exists
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} val
      */
  addDe(key, val) {
    return this.addIOVal(Buffer.from('dels.', 'binary'), key, val);
  }

  /**
      * @description  """
     Use snKey()
     Return list of duplicitous event dig vals at key
     Returns empty list if no entry at key
     Duplicates are retrieved in insertion order.
     """
      * @param {*} self
      * @param {*} key
      */
  getDes(self, key) {
    return this.getIOValues(Buffer.from('dels.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Return last inserted dup duplicitous event dig vals at key
      Returns None if no entry at key

      Duplicates are retrieved in insertion order.
      * @param {*} self
      * @param {*} key
      */
  getDesLast(key) {
    return this.getIOValsLast(Buffer.from('dels.', 'binary'), key);
  }

  /**
      * @description     Use snKey()
         Return count of dup event dig vals at key
         Returns zero if no entry at key
      * @param {*} key
      */
  cntDes(key) {
    return this.cntIoVals(Buffer.from('dels.', 'binary'), key);
  }

  /**
      * @description  """
      Use snKey()
      Deletes all values at key.
      Returns True If key exists in database Else False
      """
      * @param {*} key
      */
  delDes(key) { return this.delIoVals(Buffer.from('dels.', 'binary'), key); }

  /**
      * @description Returns iterator of all dup vals  in insertion order for any entries
      with same prefix across all sequence numbers including gaps.
      Assumes that key is combination of prefix and sequence number given
      by .snKey().

      Raises StopIteration Error when empty.
      Duplicates are retrieved in insertion order.
      * @param {*} pre      pre is bytes of itdentifier prefix prepended to sn in key
              within sub db's keyspace
      */
  getDelIter(pre) {
    if (pre) {
      pre = encodeURIComponent(pre);
    }
    return this.getIoValsAnyPreIter(Buffer.from('dels.', 'binary'), pre);
  }

  /**
      * @description  Use snKey()
      Write each likely duplicitous event entry dig from list of bytes vals to key
      Adds to existing event indexes at key if any
      Returns True If at least one of vals is added as dup, False otherwise
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} vals
      */
  putLdes(key, vals) {
    return this.putIOVals(Buffer.from('ldes.', 'binary'), key, vals);
  }

  /**
      * @description  Use snKey()
      Add likely duplicitous escrow val bytes as dup to key in db
      Adds to existing event indexes at key if any
      Returns True if written else False if dup val already exists
      Duplicates are inserted in insertion order.
      * @param {*} key
      * @param {*} val
      */
  addLde(key, val) {
    return this.addIOVal(Buffer.from('ldes.', 'binary'), key, val);
  }

  /**
      * @description  Use snKey()
      Return list of likely duplicitous event dig vals at key
      Returns empty list if no entry at key
      Duplicates are retrieved in insertion order.
      * @param {*} key
      */
  getLdes(key) { return this.getIOValues(Buffer.from('ldes.', 'binary'), key); }

  /**
      * @description  Use snKey()
     Return last inserted dup likely duplicitous event dig at key
     Returns None if no entry at key
     Duplicates are retrieved in insertion order.
      * @param {*} key
      */
  getLdesLast(key) {
    return this.getIOValsLast(Buffer.from('ldes.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
      Return count of dup event dig at key
      Returns zero if no entry at key
      * @param {*} self
      * @param {*} key
      */
  cntLdes(key) {
    return this.cntIoVals(Buffer.from('ldes.', 'binary'), key);
  }

  /**
      * @description  Use snKey()
     Deletes all values at key.
     Returns True If key exists in database Else False
      * @param {*} key
      */
  delLdes(key) {
    return this.delIoVals(Buffer.from('ldes.', 'binary'), key);
  }
}

/**
 * @description  Wrapper to enable temporary (test) Databaser instances
    When used in with statement calls .clearDirPath() on exit of with block
 * @param {} name name is str name of temporary Databaser dirPath  extended name so
                 can have multiple temporary databasers is use differen name
 * @param {*} cls cls is Class instance of subclass instance
 */
function* openDatabaser(name = 'test', cls = null) {
  if (!cls) {
    cls = new Databaser(null, name, true);
  }
  try {
    // databaser = cls
    yield cls;
  } catch (error) {
    throw new Error(error);
  }
}

function openLogger(name = 'test') {
  return openDatabaser(name, new Logger());
}

module.exports = { Logger, openLogger };
