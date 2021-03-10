// "use strict";

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const util = require('util');
const lmdb = require('node-lmdb');
const _ = require('lodash');
const { pad } = require('./util');

const encoder = new util.TextEncoder('utf-8');
const MaxHexDigits = 6;
const MaxForks = parseInt('f'.repeat(MaxHexDigits), 16); // # 16777215
class Databaser {
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
    let HeadDirPath = '/var';
    const TailDirPath = 'keri/db';
    const AltHeadDirPath = path.join('~', '.keri/db');
    let AltTailDirPath = '.keri/db';
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
    if (!headDirPath) { headDirPath = HeadDirPath + '/' + TailDirPath; }
    let baseDirPath = path.resolve(resolveHome(headDirPath));
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
    } else if (fs.accessSync(baseDirPath, fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK)) {
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
      const dbi = this.env.openDbi({
        name: db,
        create: true, // will create if database did not exist
      });

      key = encoder.encode(key);
      const txn = this.env.beginTxn();
      txn.putBinary(dbi, key, value, { keyIsBuffer: true });
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
     * @description Write each entry from list of bytes vals to key in db.Adds to existing values at key if any
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
      // console.log("values successfully added")
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
        for (let found = (cursor.goToRange(key) === key); found !== null; found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((key, value) => {
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
      let vals = [];
      if (cursor.goToRange(key) === key) {
        // for (val in cursor.goToNextDup() )
        // yield val
        do {
          cursor.getCurrentNumber((key, data) => {
            response = data;
          });
          yield response;
        } while (cursor.goToNextDup());
      }

      txn.commit();
      dbi.close();
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
        for (let found = (cursor.goToRange(key) === key); found !== null; found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((key, value) => {
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

    if (dups.length == 0 || dups == false) {
      dups = [];
    }
    const dbi = this.env.openDbi({
      name: db,
      create: true, // will create if database did not exist
      dupSort: true,
    });
    try {
      const txn = this.env.beginTxn();
      if (dups.length == 0) {
        var counter = 0;
      } else {
        for (let i = 0; i < dups.length; i++) {
          if (dups[i].toString() == val.toString()) {
            counter = 1;
          } else {
            counter = 0;
          }
        }
      }

      if (counter == 0) {
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
      const vals_ = [];
      const key_ = [];
      if (cursor.goToRange(key)) {
        for (let found = (cursor.goToRange(key) === key); found !== null; found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((key, data) => {
            data = data.slice(7, data.length);
            key_.push(key);
            vals_.push(data);
          });
        }
      }


      txn.commit();
      dbi.close();
      return vals_;
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

    if (dups == false) {
      dups = [];
    }

    for (let i = 0; i < dups.length; i++) {
      if (dups[i].toString() == vals.toString()) {
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
    if (dups == false) {
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
        if (count > MaxForks) {throw new Error(`Too many recovery forks at key = ${key}`); }

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
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true, dupdata: true});
      let vals = null;

      cursor.goToKey(key).toString();
      try {
        for (let found = (cursor.goToKey(key) === key); found !== null; found = cursor.goToLastDup()) {
          cursor.getCurrentBinary((key, data) => {
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
        for (let found = (cursor.goToRange(key) === key); found !== null; found = cursor.goToNextDup()) {
          cursor.getCurrentBinary((key, data) => {
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
      let cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });

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
  *getIoValsAllPreIter(db, pre) {
    try {
      const dbi = this.env.openDbi({
        name: db,
      });
      let key = snkey(pre, 0);
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi, { keyIsBuffer: true });
      const cnt = 0;
      let result = false;
      if (cursor.goToRange(key) === key) {
        do {
          cursor.getCurrentNumber((key, data) => {
            result = data.slice(7, data.length);
          });

          yield result;
          key = snkey(pre, cnt + 1);
        } while (cursor.goToNextDup());
      }
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

  *getIoValsLastAllPreIter(dbi, pre) {
    try {
      let key = snkey(pre, 0);
      const txn = this.env.beginTxn();
      const cursor = new lmdb.Cursor(txn, dbi);
      let result = false;
        const cnt = 0;
      if (cursor.goToRange(key) === key) {
        do {
          cursor.goToLast();
          cursor.getCurrentString((key, data) => {
            result = data.slice(7, data.length);
          });
          // cursor.getCurrentNumber(function(key, data) {
          //     result =  data.slice(7,data.length)
          // });
          yield result;
          key = snKey(pre, cnt + 1);
        } while (cursor.goToNextDup());
      }
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

function dgkey(pre, dig) {
  if (pre) {
    pre = Buffer.from(pre, 'binary');
  }
  if (dig) {
    dig = Buffer.from(dig, 'binary');
  }

  const dotBuf = Buffer.from('.', 'binary');
  return Buffer.concat([pre, dotBuf, dig]);
}

/**
 * @description  Returns bytes db key  from concatenation of qualified Base64 prefix
    bytes pre and int sn (sequence number) of event
 * @param {*} pre
 * @param {*} sn
 */
function snkey(pre, sn) {
  if (pre) { pre = Buffer.from(pre, 'binary');}
  sn = pad(sn, 32);
  sn = '.' + sn;
  sn = Buffer.from(sn, 'binary');
  const arr = [pre, sn];

  return Buffer.concat(arr);
}

module.exports = { snkey, dgkey, Databaser };
