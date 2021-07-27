const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const util = require('util');
const lmdb = require('node-lmdb');
const { pad } = require('./util');

const encoder = new util.TextEncoder('utf-8');
const MaxHexDigits = 6;
const MaxForks = parseInt('f'.repeat(MaxHexDigits), 16); // # 16777215
exports.Databaser = class Databaser {
  // const MAX_DB_COUNT = 16;
  // const DATABASE_DIR_PATH = "/var/keri/db"
  // const ALT_DATABASE_DIR_PATH = path.join("~", '.keri/db')
  // const DB_KEY_EVENT_LOG_NAME = Buffer.from('kel', 'binary')

  /**
     * @description  Setup main database directory at .dirpath.
                    Create main database environment at .env using .dirpath.
     * @param {*} headDirPath headDirPath is str head of the pathname of directory for main database
                If not provided use default headDirpath
     * @param {*} name  name is str pathname differentiator for directory for main database
                When system employs more than one keri databse name allows
                differentiating each instance by name
     * @param {*} temp   temp is boolean If True then use temporary head pathname  instead of
                headDirPath if any or default headDirPath
     */
  constructor(headDirPath = null, name = 'main', temp = false) {
    let localHeadDirPath = headDirPath;
    let HeadDirPath = '/var';
    const TailDirPath = 'keri/db';
    const AltHeadDirPath = path.join('~', '.keri/db');
    // const AltTailDirPath = '.keri/db';
    // let ALT_DATABASE_DIR_PATH =
    const MaxNamedDBs = 16;
    try {
      if (temp) {
        const tmpDir = os.tmpdir();
        const suffix = '/keri_lmdb_test';
        HeadDirPath = fs.mkdirSync(`${tmpDir}${suffix}`);
        this.path = path.join(HeadDirPath, name);
        fs.mkdirSync(this.path, 0o777);
      }
    } catch (e) {
      console.log('Error while creating directory');
    }
    if (!localHeadDirPath) { localHeadDirPath = `${HeadDirPath}/${TailDirPath}`; }
    let baseDirPath = path.resolve(resolveHome(localHeadDirPath));
    if (!fs.pathExistsSync(baseDirPath)) {
      try {
        fs.mkdirsSync(baseDirPath, 0o777);
      } catch (e) {
        baseDirPath = AltHeadDirPath;
        baseDirPath = path.resolve(resolveHome(baseDirPath));
        if (!fs.pathExistsSync(baseDirPath)) {
          fs.mkdirsSync(baseDirPath, 0o777);
        }
      }
    } else if (fs.accessSync(baseDirPath, fs.constants.F_OK || fs.constants.W_OK
      || fs.constants.R_OK)) {
      baseDirPath = AltHeadDirPath;
      baseDirPath = path.resolve(resolveHome(baseDirPath));
      if (!fs.pathExistsSync(baseDirPath)) { fs.mkdirsSync(baseDirPath, 0o777); }
    }
    const env = new lmdb.Env();
    env.open({ path: baseDirPath, mapSize: 2 * 1024 * 1024 * 1024, maxDbs: MaxNamedDBs });

    this.path = baseDirPath;
    this.env = env;

    this.headDirPath = headDirPath;
    this.name = name;
    this.temp = temp;
    // file = _os.path.join(dir, prefix + name + suffix)
    if (this.temp) {
      const tmpDir = os.tmpdir();
      const suffix = '/keri_lmdb_test';
      HeadDirPath = fs.mkdtempSync(`${tmpDir}${suffix}`);
      this.path = path.join(HeadDirPath, this.name);
      fs.mkdirSync(this.path);
    } else if (!this.headDirPath) {
      this.headDirPath = HeadDirPath;
      this.path = path.join(this.headDirPath, TailDirPath, this.name);

      if (!fs.pathExistsSync(this.path)) {
        try {
          fs.mkdirSync(this.path, { recursive: true });
        } catch (error) {
          this.path = path.join(process.env.HOME, this.headDirPath, TailDirPath, this.name);
        }
      } else {
        console.log('Directory already exist');
      }
    }
  }

  clearDirPath() {
    if (this.env) {
      try {
        this.env.close();
      } catch (err) {
        throw new Error('Error =====>', err);
      }
      if (fs.pathExistsSync(this.path)) {
        fs.removeSync(this.path, { recursive: true });
        console.log('path Successfully removed ');
      }
    }
  }

  /**
     * @description         Write serialized bytes val to location key in db .Does not overwrite.
            Returns True If val successfully written Else False
            Returns False if val at key already exitss
     * @param {*} db db is opened named sub db with dupsort=False
     * @param {*} key key is bytes of key within sub db's keyspace
     * @param {*} value val is bytes of value to be written
     */
  putVal(db, key, value) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist,
        dupSort: true,
      });

      const txn = this.env.beginTxn();
      txn.putBinary(dbi, key, value, { keyIsBuffer: true, overwrite: false });
      txn.commit();
      dbi.close();

      return true;
    } catch (error) {
      console.log('\nERROR:', error);
      return false;
    }
  }

  /**
     * @description  Write serialized bytes val to location key in db
            Overwrites existing val if any
            Returns True If val successfully written Else False
     * @param {} dbi db is opened named sub db with dupsort=False
     * @param {*} key key is bytes of key within sub db's keyspace
     * @param {*} value val is bytes of value to be written
     */
  setVal(db, key, value) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
      });
      // key = encoder.encode(key)
      const txn = this.env.beginTxn();
      this.txn.putBinary(dbi, key, value, { keyIsBuffer: true });
      txn.commit();
      dbi.close();
      //  this.env.close();
      return true;
    } catch (error) {
      console.log('ERROR : \n', error);
      return false;
    }
  }

  updateVal(db, key, value) {
    try {
      this.key = key;
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
      });

      this.key = encoder.encode(this.key);
      const txn = this.env.beginTxn();
      txn.putBinary(dbi, this.key, value, { keyIsBuffer: true });
      txn.commit();
      dbi.close();
      // this.env.close();
      return true;
    } catch (error) {
      console.log('ERROR :\n', error);
      return false;
    }
  }

  getVal(db, key) {
    const dbi = this.env.openDbi({
      name: db,
    });
    try {
      const txn = this.env.beginTxn();
      const data = txn.getBinary(dbi, key);
      txn.commit();
      dbi.close();
      return data;
    } catch (error) {
      console.log('ERROR :\n', error);
      return false;
    }
  }

  getAllVal(db, key) {
    const dbi = this.env.openDbi({
      name: db,
      dupSort: true,
      // create : true
    });
    try {
      const txn = this.env.beginTxn();
      const data = txn.getBinary(dbi, key);
      txn.commit();
      dbi.close();
      return data;
    } catch (error) {
      console.log('ERROR :\n', error);
      return false;
    }
  }

  delVal(db, key) {
    const dbi = this.env.openDbi({
      name: db,
      // will create if database did not exist
    });
    try {
      const txn = this.env.beginTxn();

      txn.del(dbi, key);
      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      console.log('ERROR :\n');
      return false;
    }
  }

  /**
     * @description Write each entry from list of bytes vals to key in db.
     * Adds to existing values at key if any
     */
  putVals(db, key, vals) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
        // dupSort: true,
      });
      const txn = this.env.beginTxn();

      for (const val in vals) {
        txn.putBinary(dbi, key, vals[val], { keyIsBuffer: true, dupdata: true });
      }

      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      console.log('Error : ', error);
      return false;
    }
  }

  /**
     * @description   Return array of values at key in db .Returns empty array if no entry at key

        Duplicates are retrieved in lexocographic order not insertion order.
     * @param {*} db db is opened named sub db with dupsort=True
     * @param {*} key key is bytes of key within sub db's keyspace
     */
  getVals(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        dupSort: true,

      });
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      const vals = [];

      if (cursor.goToRange(key)) {
        for (let found = (cursor.goToRange(key) === key); found !== null;
          found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((keyParam, value) => {
            vals.push(value);
          });
        }
      }
      txn.commit();
      dbi.close();
      return vals;
    } catch (error) {
      console.log('Error:', error);

      return false;
    }
  }

  /**
     * @description Return iterator of all dup values at key in db
            Raises StopIteration error when done or if empty
            Duplicates are retrieved in lexocographic order not insertion order.
     * @param {*} db    db is opened named sub db with dupsort=True
     * @param {*} key   key is bytes of key within sub db's keyspace
     */

  * getValsIter(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
        dupSort: true,
      });
      let response = null;
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi);
      // let vals = [];
      if (cursor.goToRange(key) === key) {
        // for (val in cursor.goToNextDup() )
        // yield val
        do {
          cursor.getCurrentNumber((keyParam, data) => {
            response = data;
          });
          yield response;
        } while (cursor.goToNextDup());
      }

      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
     * @description Return count of dup values at key in db, or zero otherwise

     * @param {*} db db is opened named sub db with dupsort=True
     * @param {*} key key is bytes of key within sub db's keyspace
     */

  cntVals(db, key) {
    const txn = this.env.beginTxn();
    let count = 0;
    try {
      const dbi = this.env.openDbi({
        name: db,
        // create: true,
        dupSort: true,
      });
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      if (cursor.goToRange(key)) {
        for (let found = (cursor.goToRange(key) === key); found !== null;
          found = cursor.goToNextDup()) {
          cursor.getCurrentBinary(() => {
            count += 1;
          });
        }
      }
      txn.commit();
      dbi.close();
      return count;
    } catch (error) {
      console.log('ERROR :', error);
      return false;
    }
  }

  /**
     * @description Deletes all values at key in db.
            Returns True If key exists in db Else False
     * @param {*} db
     * @param {*} key
     */

  delVals(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        dupSort: true,
      });
      const txn = this.env.beginTxn();

      txn.del(dbi, key);

      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      console.log('ERROR: ', error);
      return false;
    }
  }

  /**
     * @description       Add val bytes as dup to key in db
            Adds to existing values at key if any
            Returns True if written else False if dup val already exists
            Duplicates are inserted in lexocographic order not insertion order.
            Lmdb does not insert a duplicate unless it is a unique value for that
            key.
            Does inclusion test to dectect of duplicate already exists
            Uses a python set for the duplicate inclusion test. Set inclusion scales
            with O(1) whereas list inclusion scales with O(n).
     */

  addVal(db, key, val) {
    let dups = this.getVals(db, key);

    if (dups.length === 0 || dups === false) {
      dups = [];
    }
    const dbi = this.env.openDbi({
      name: db,
      create: true, // will create if database did not exist
      dupSort: true,
    });
    try {
      const txn = this.env.beginTxn();
      let counter;
      if (dups.length === 0) {
        counter = 0;
      } else {
        for (let i = 0; i < dups.length; i + 1) {
          if (dups[i].toString() === val.toString()) {
            counter = 1;
          } else {
            counter = 0;
          }
        }
      }

      if (counter === 0) {
        txn.putBinary(dbi, key, Buffer.from(val, 'binary'), { overwrite: false, keyIsBuffer: true });
      }
      txn.commit();
      dbi.close();
      // this.env.close();
      return true;
    } catch (error) {
      console.log('ERROR  :', error);
      return false;
    }
  }

  /**
     * @description Return list of values associated with a key in db (in insertion order)
     * returns empty  if there is no key . Duplicates are retrieved in insertion order.
     * lmdb is lexocographic an insertion ordering value is prepended to
           all values that makes lexocographic order that same as insertion order
            Duplicates are ordered as a pair of key plus value so prepending prefix
           to each value changes duplicate ordering. Prefix is 7 characters long.
           With 6 character hex string followed by '.' for a max
           of 2**24 = 16,777,216 duplicates,
     *
     */

  getIOValues(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        dupSort: true,
      });

      const txn = this.env.beginTxn({ buffers: true });
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      const valsArray = [];
      const keyArray = [];
      if (cursor.goToRange(key)) {
        for (let found = (cursor.goToRange(key) === key); found !== null;
          found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((keyParam, data) => {
            this.data = data;
            this.data = this.data.slice(7, this.data.length);
            keyArray.push(keyParam);
            valsArray.push(this.data);
          });
        }
      }

      txn.commit();
      dbi.close();
      return valsArray;
    } catch (error) {
      console.log(' ERROR :', error);
      return false;
    }
  }

  /**
     * @description Add val bytes as dup in insertion order to key in db
            Adds to existing values at key if any
            Returns True if written else False if val is already a dup
            Duplicates preserve insertion order.
     * @param {*} db        db is opened named sub db with dupsort=False
     * @param {*} key       key is bytes of key within sub db's keyspace
     * @param {*} val       val is bytes of value to be written
     */
  async addIOVal(db, key, vals) {
    let dups = this.getIOValues(db, key);

    if (dups.toString === 'false') {
      dups = [];
    }

    for (let i = 0; i < dups.length; i + 1) {
      if (dups[i].toString() === vals.toString()) {
        return false;
      }
    }

    return this.addIOVALToDb(db, key, vals);
  }

  async addIOVALToDb(db, key, vals) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
      });
      const txn = this.env.beginTxn();
      const count = 0;
      let val = null;
      let countPad = 0;
      if (count > MaxForks) { throw new Error(`Too many recovery forks at key = ${key}`); }

      countPad = pad(count, 6);
      countPad += '.';
      val = Buffer.concat([Buffer.from(countPad, 'binary'), Buffer.from(vals, 'binary')]);
      txn.putBinary(dbi, key, val, { keyIsBuffer: true, dupdata: true });

      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      console.log('ERROR:', error);
      return false;
    }
  }

  /**
     * * @description Write each entry from list of bytes vals to key in db in insertion order
            Adds to existing values at key if any
            Returns True If at least one of vals is added as dup, False otherwise
            Duplicates preserve insertion order.
            Because lmdb is lexocographic an insertion ordering value is prepended to
            all values that makes lexocographic order that same as insertion order
            Duplicates are ordered as a pair of key plus value so prepending prefix
            to each value changes duplicate ordering. Prefix is 7 characters long.
            With 6 character hex string followed by '.' for a max
            of 2**24 = 16,777,216 duplicates. With prepended ordinal must explicity
            check for duplicate values before insertion. Uses a python set for the
            duplicate inclusion test. Set inclusion scales with O(1) whereas list
            inclusion scales with O(n).
     * @param {*} db   db is opened named sub db with dupsort=False
     * @param {*} key key is bytes of key within sub db's keyspace
     * @param {*} val val is bytes of value to be written
     */
  putIOVals(db, key, vals) {
    let dups = this.getIOValues(db, key);
    if (dups.toString() === 'false') {
      dups = [];
    }

    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
        dupSort: true,
      });

      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      let count = 0;
      // let result = false;
      let val = null;
      let countPad = 0;
      if (cursor.goToRange(key)) {
        for (let found = cursor.goToFirst(); found !== null; found = cursor.goToNext()) {
          count += 1;
        }
      }
      if (!dups.includes(vals)) {
        if (count > MaxForks) { throw new Error(`Too many recovery forks at key = ${key}`); }

        countPad = pad(count, 6);
        countPad += '.';
        const arr = [Buffer.from(countPad, 'binary'), Buffer.from(vals.toString(), 'binary')];

        val = Buffer.concat(arr);
        // result = true;
        txn.putBinary(dbi, key, val, { keyIsBuffer: true });
        count += 1;
      } else {
        txn.abort();
        dbi.close();
        return false;
      }
      txn.commit();
      dbi.close();
      return true;
    } catch (error) {
      console.log('ERROR:', error);
      return false;
    }
  }

  /**
     * @description Return last added dup value at key in db in insertion order
            Returns None no entry at key
            Duplicates are retrieved in insertion order.
            Because lmdb is lexocographic an insertion ordering value is prepended to
            all values that makes lexocographic order that same as insertion order
            Duplicates are ordered as a pair of key plus value so prepending prefix
            to each value changes duplicate ordering. Prefix is 7 characters long.
            With 6 character hex string followed by '.' for a max
            of 2**24 = 16,777,216 duplicates,
     * @param {*} db db is opened named sub db with dupsort=True
     * @param {*} key key is bytes of key within sub db's keyspace
     */
  getIOValsLast(db, key) {
    const dbi = this.env.openDbi({
      name: db,
      // create: true, // will create if database did not exist
      dupSort: true,
    });

    try {
      const txn = this.env.beginTxn({ readOnly: true });
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true, dupdata: true });
      let vals = null;

      cursor.goToKey(key).toString();
      try {
        for (let found = (cursor.goToKey(key) === key); found !== null;
          found = cursor.goToLastDup()) {
          cursor.getCurrentBinary((keyParam, data) => {
            vals = data.slice(7, data.length);
          });
        }
        txn.commit();
        dbi.close();
        return vals;
      } catch (error) {
        txn.commit();
        dbi.close();
        return vals;
      }
    } catch (error) {
      console.log('\n\nERROR :', error);
      return false;
    }
  }

  /**
     * @description Return count of dup values at key in db, or zero otherwise
     * @param {*} db db is opened named sub db with dupsort=True
     * @param {*} key key is bytes of key within sub db's keyspace
     */
  cntIoVals(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
        dupSort: true,
      });

      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      let count = 0;

      if (cursor.goToRange(key)) {
        for (let found = (cursor.goToRange(key) === key); found !== null;
          found = cursor.goToNextDup()) {
          cursor.getCurrentBinary(() => {
            count += 1;
          });
        }
      } else {
        return count;
      }
      txn.commit();
      dbi.close();
      //    this.env.close();
      return count;
    } catch (error) {
      console.log('ERROR :', error);
      return false;
    }
  }

  delIoVals(db, key) {
    try {
      const dbi = this.env.openDbi({
        name: db,
      });

      const txn = this.env.beginTxn();
      // let cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });

      txn.del(dbi, key);
      txn.commit();
      dbi.close();
      // this.env.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
     * @description  Returns iterator of all dup vals in insertion order for all entries
            with same prefix across all sequence numbers in order without gaps
            starting with zero. Stops if gap or different pre.
            Assumes that key is combination of prefix and sequence number given
            by .snKey().
            Raises StopIteration Error when empty.
            Duplicates are retrieved in insertion order.
            Because lmdb is lexocographic an insertion ordering value is prepended to
            all values that makes lexocographic order that same as insertion order
            Duplicates are ordered as a pair of key plus value so prepending prefix
            to each value changes duplicate ordering. Prefix is 7 characters long.
            With 6 character hex string followed by '.' for a max
            of 2**24 = 16,777,216 duplicates,
     * @param {*} db     db is opened named sub db with dupsort=True
     * @param {*} pre   pre is bytes of itdentifier prefix prepended to sn in key
                    within sub db's keyspace
     */
  * etIoValsAllPreIter(db, pre) {
    try {
      const dbi = this.env.openDbi({
        name: db,
      });
      let key = snKey(pre, 0);
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      const cnt = 0;
      let result = false;
      if (cursor.goToRange(key) === key) {
        do {
          cursor.getCurrentNumber((keyParam, data) => {
            result = data.slice(7, data.length);
          });

          yield result;
          key = snKey(pre, cnt + 1);
        } while (cursor.goToNextDup());
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
     * @description  Returns iterator of last only dup vals in insertion order for all entries
            with same prefix across all sequence numbers in order without gaps
            starting with zero. Stops if gap or different pre.
            Assumes that key is combination of prefix and sequence number given
            by .snKey().
            Raises StopIteration Error when empty.
            Duplicates are retrieved in insertion order.
            Because lmdb is lexocographic an insertion ordering value is prepended to
            all values that makes lexocographic order that same as insertion order
            Duplicates are ordered as a pair of key plus value so prepending prefix
            to each value changes duplicate ordering. Prefix is 7 characters long.
            With 6 character hex string followed by '.' for a max
            of 2**24 = 16,777,216 duplicates,
     * @param {*} db  db is opened named sub db with dupsort=True
     * @param {*} pre   pre is bytes of itdentifier prefix prepended to sn in key
                    within sub db's keyspace
     */

  * getIoValsLastAllPreIter(dbi, pre) {
    try {
      let key = snKey(pre, 0);
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi);
      let result = false;
      const cnt = 0;

      if (cursor.goToRange(key) === key) {
        do {
          cursor.goToLast();
          cursor.getCurrentString((keyParam, data) => {
            result = data.slice(7, data.length);
          });
          // cursor.getCurrentNumber(function(key, data) {
          //     result =  data.slice(7,data.length)
          // });
          yield result;
          key = snKey(pre, cnt + 1);
        } while (cursor.goToNextDup());
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

function resolveHome(filepath) {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  }
  return filepath;
}

/**
 * Returns bytes DB key from concatenation of '.' with qualified Base64 prefix
    bytes pre and qualified Base64 bytes digest of serialized event
    If pre or dig are str then converts to bytes
 * @param {*} pre 
 * @param {*} dig 
 * @returns 
 */
module.exports.dgkey = (pre, dig) => {
  this.pre = pre;
  this.dig = dig;

  if (typeof this.pre === 'string') {
    this.pre = Buffer.from(this.pre, 'binary'); // convert str to bytes 
  }
  if (typeof this.dig === 'string') {
    this.dig = Buffer.from(this.dig, 'binary'); // convert str to bytes
  }
  const dotBuf = Buffer.from('.', 'binary');

  return Buffer.concat([this.pre, dotBuf, this.dig]);
}

/**
 * @description Returns bytes DB key from concatenation with '.' of qualified Base64 prefix
    bytes pre and int ordinal number of event, such as sequence number or first
    seen order number.
 * @param {*} pre 
 * @param {*} sn 
 * @returns 
 */
module.exports.onKey = (pre, sn) => {
  this.pre = pre;
  this.sn = pad(sn, 32);
  this.sn = Buffer.from(this.sn, 'binary');

  if (typeof this.pre === 'string') {
    this.pre = Buffer.from(this.pre, 'binary'); // convert str to bytes 
  }

  const dotBuf = Buffer.from('.', 'binary');
  return Buffer.concat([this.pre, dotBuf, this.sn]);
}

/**
 * @description Returns bytes DB key from concatenation of '|' qualified Base64 prefix
    bytes pre and bytes dts datetime string of extended tz aware ISO8601
    datetime of event
 * @param {*} pre 
 * @param {*} dts = '2021-02-13T19:16:50.750302+00:00'
 * @returns 
 */
module.exports.dtKey = (pre, dts) => {
  this.pre = pre;
  this.dts = dts;

  if (typeof this.pre === 'string') {
    this.pre = Buffer.from(this.pre, 'binary'); // convert str to bytes 
  }
  if (typeof this.dts === 'string') {
    this.dts = Buffer.from(this.dts, 'binary'); // convert str to bytes
  }
  const pipeBuf = Buffer.from('|', 'binary');

  return Buffer.concat([this.pre, pipeBuf, this.dts]);
}

/**
 * @description  Returns bytes db key  from concatenation of qualified Base64 prefix
    bytes pre and int sn (sequence number) of event
 * @param {*} pre
 * @param {*} sn
 * @returns
 */
module.exports.snKey = (pre, sn) => {
  this.pre = pre;
  this.sn = sn;

  if (this.pre) { this.pre = Buffer.from(this.pre, 'binary'); }
  this.sn = pad(this.sn, 32);
  this.sn = `.${this.sn}`;
  this.sn = Buffer.from(this.sn, 'binary');
  const arr = [this.pre, this.sn];

  return Buffer.concat(arr);
}

/**
 * @description  Returns tuple of pre and either dig or on, sn, fn str or dts datetime str by
    splitting key at bytes sep
    Accepts either bytes or str key and returns same type
    Raises ValueError if key does not split into exactly two elements
 * @param {*} key: key is database key with split at sep
 * @param {*} sep: sep is bytes separator character. default is b'.'
 */
module.exports.splitKey = (key, sep = '.') => {
  this.key = key;
  this.sep = Buffer.from(sep, 'binary');

  if (Buffer.isBuffer(this.key)) {
    this.key = this.key.toString();
  }
  // str not bytes
  if (typeof this.key === "string") {
    if (typeof this.sep !== "string")  // make sep match bytes or str
      this.sep = this.sep.toString();
  }

  const splits = this.key.split(this.sep);
  if (splits.length != 2)
    throw Error(`Unsplittable key = ${this.key}`);
  return splits;
}

/**
 * @description Returns list of pre and int on from key
    Accepts either bytes or str key
    ordinal number  appears in key in hex format
 * @param {*} key 
 * @returns 
 */
module.exports.splitKeyON = (key) => {
  this.key = key;

  if (Buffer.isBuffer(this.key)) {
    this.key = this.key.toString();
  }

  const result = this.splitKey(this.key)
  if (result[1] && result[1].length) {
    result[1] = parseInt(result[1], 16);
  }
  return result;
}

/**
 * @description Returns list of pre and dts converted to datetime from key
    dts is TZ aware Iso8601 '2021-02-13T19:16:50.750302+00:00'
 * @param {*} key: Accepts either bytes or str key
 * @returns
 */
module.exports.splitKeyDT = (key) => {
  this.key = key;
  const sep = Buffer.from('|', 'binary');

  if (Buffer.isBuffer(this.key)) {
    this.key = this.key.toString();
    console.log('this.key >>>>> ', this.key)
  }

  const result = this.splitKey(this.key, sep)

  if (result[1] && result[1].length && typeof this.sep !== "string")  // make sep match bytes or str
    result[1] = result[1].toString().toISOString();

  return result;
}
