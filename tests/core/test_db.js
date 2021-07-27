const assert = require('assert').strict;
const lmdb = require('node-lmdb');
const path = require('path');

const { pad } = require('./util');
const fs = require('fs');
const { snKey, splitKey, dgkey, Databaser, onKey, dtKey, splitKeyON, splitKeyDT } = require('../../src/keri/db/database');
const { versify, Serials } = require('../../src/keri/core/core');
const {
  openDatabaser,
  openLogger,
  Logger,
} = require('../../src/keri/db/logger');

function test_opendatabaser() {
  const db = new Databaser();
  assert.deepStrictEqual(db, new Databaser());
  assert.equal(db.name, 'main');
  assert.deepStrictEqual(db.env, new lmdb.Env());
  /// home/shivam/.keri/db


  // Test key utility functions

  // Bytes
  const pre = Buffer.from('BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc', 'binary');
  const dig = Buffer.from('EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4', 'binary');
  const sn = 3;
  const paddedSN = pad(sn, 32);
  const dts = Buffer.from('2021-02-13T19:16:50.750302+00:00', 'binary');

  assert.deepStrictEqual(
    dgkey('BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc', 'EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4'),
    Buffer.from(
      'BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc.EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4'
    )
  );

  assert.deepStrictEqual(
    onKey(pre, sn),
    Buffer.from(
      'BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc.00000000000000000000000000000003'
    )
  );

  assert.deepStrictEqual(
    dtKey(pre, dts),
    Buffer.from(
      'BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc|2021-02-13T19:16:50.750302+00:00'
    )
  );

  assert.deepStrictEqual(
    snKey(pre, sn),
    Buffer.from(
      `BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc.${paddedSN}`
    )
  );

  assert.deepStrictEqual(
    splitKey(snKey(pre, sn)), ['BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc', paddedSN]
  );

  assert.deepStrictEqual(
    splitKeyON(snKey(pre, sn)), ['BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc', sn]
  )

  assert.deepStrictEqual(
    splitKeyDT(dtKey(pre, dts)), ['BWzwEHHzq7K0gzQPYGGwTmuupUhPx5_yZ-Wk1x4ejhcc', '2021-02-13T19:16:50.750302+00:00']
  )

  db.clearDirPath();
  assert.deepStrictEqual(fs.existsSync(db.path), false);

  const dberGen = openLogger('test', null);
  const dberVal = dberGen.next().value;
  let dbi = Buffer.from('Test1', 'binary');

  let key = Buffer.from('omega4', 'binary');
  let val = Buffer.from('Abcd', 'binary');

  const vals = [
    Buffer.from('z', 'binary'),
    Buffer.from('m', 'binary'),
    Buffer.from('x', 'binary'),
    Buffer.from('a', 'binary'),
  ];
  //

  dbi = dberVal.env.openDbi({
    name: 'test_db',
    create: true,
  });

  // assert.equal(dberVal.getVal(dbi, key), false);
  // assert.equal(dberVal.delVal(dbi, key), false);
  // assert.deepStrictEqual(dberVal.putVal(dbi, key, val), true);
  // assert.equal(dberVal.putVal(dbi, key, val), true);
  // assert.deepStrictEqual(dberVal.setVal(dbi, key, val), true);
  // assert.equal((dberVal.getVal(dbi, key)).toString(), val.toString());
  // assert.equal(dberVal.delVal(dbi, key), true);
  // assert.equal(dberVal.getVal(dbi, key), null);

  // assert.deepStrictEqual(dberVal.getVals(dbi, key), []);
  // assert.deepStrictEqual(dberVal.delVals(dbi, key), false);
  // assert.deepStrictEqual(dberVal.cntVals(dbi, key), 0);

  // assert.deepStrictEqual(dberVal.putVals(dbi, key, vals), true); // [Buffer.from('a','binary'),Buffer.from('m','binary'),Buffer.from('x','binary'),Buffer.from('z','binary')]
  // console.log('dberVal.getVals(db, key) -====================>', (dberVal.getVals(dbi, key)).toString());
  // assert.deepStrictEqual(dberVal.getVals(dbi, key), [Buffer.from('a', 'binary'), Buffer.from('m', 'binary'), Buffer.from('x', 'binary'), Buffer.from('z', 'binary')]);

  // assert.deepStrictEqual(dberVal.cntVals(dbi, key), 4);
  // assert.deepStrictEqual(dberVal.putVals(dbi, key, [Buffer.from('a', 'binary')]), true);
  // assert.deepStrictEqual(dberVal.putVals(dbi, key, [Buffer.from('b', 'binary')]), true);
  // assert.deepStrictEqual(dberVal.getVals(dbi, key), [Buffer.from('a', 'binary'), Buffer.from('b', 'binary'),
  //   Buffer.from('m', 'binary'), Buffer.from('x', 'binary'), Buffer.from('z', 'binary')]);

  // assert.deepStrictEqual(dberVal.delVals(dbi, key), true);
  // assert.deepStrictEqual(dberVal.getVals(dbi, key), false);
  //   ============= PENDING =============
  //   assert [val for val in dber.getValsIter(db, key)] == [b'a', b'b', b'm', b'x', b'z']
  //   ================ PENDING

  //     #     # test IoVals insertion order dup methods.  dup vals are insertion order
  //       #     key = b'A'
  //       #     vals = [b'z', b'm', b'x', b'a']
  //       #     db = dber.env.open_db(key=b'peep.', dupsort=True)

  dbi = Buffer.from('peep.', 'binary');

  console.log('dber --------------------->', dberVal.env);
  key = Buffer.from('A', 'binary');
  val = Buffer.from('Abcd', 'binary');

  // assert.deepStrictEqual(dberVal.getIOValues(dbi, key), false);
  // assert.deepStrictEqual(dberVal.getIOValsLast(dbi, key), false);
  // assert.deepStrictEqual(dberVal.cntIoVals(dbi, key), 0);
  // assert.deepStrictEqual(dberVal.delIoVals(dbi, key), false);
  // assert.deepStrictEqual(dberVal.putIOVals(dbi, key, vals), true);
  // assert.deepStrictEqual(dberVal.getIOValues(dbi, key), vals); // # preserved insertion order
  // assert.deepStrictEqual(dberVal.cntIoVals(dbi, key), 4);
  // assert.deepStrictEqual(dberVal.getIOValsLast(dbi, key), vals[vals.length - 1]);
  // assert.deepStrictEqual(dberVal.putIOVals(dbi, key, [Buffer.from('a', 'binary')]), false); // # duplicate this will work in one shot testing
  // assert.deepStrictEqual(dberVal.getIOValues(dbi, key), vals);
  // assert.deepStrictEqual(dberVal.addIOVal(dbi, key, [Buffer.from('a', 'binary')]), true);
  // assert.deepStrictEqual(dberVal.addIOVal(dbi, key, [Buffer.from('b', 'binary')]), false); // this will work in one shot testin
  // assert.deepStrictEqual(dberVal.getIOValues(dbi, key), vals);
  // assert.deepStrictEqual(dberVal.delIoVals(dbi, key), true);

  //  #     assert dber.delIoVals(db, key) == True

  // #     # Test getIoValsAllPreIter(self, db, pre)

  // sn = 0;
  // key = snKey(pre, sn);
  // assert.deepStrictEqual(dberVal.addIOVal(dbi, key, [Buffer.from('gamma', 'binary')]), true);
  // assert.deepStrictEqual(dberVal.addIOVal(dbi, key, [Buffer.from('beta', 'binary')]), true);

  // const vals1 = [Buffer.from('mary', 'binary'), Buffer.from('peter', 'binary'), Buffer.from('john', 'binary'), Buffer.from('paul', 'binary')];
  // sn += 1;
  // key = snKey(pre, sn);
  // assert.deepStrictEqual(dberVal.putIOVals(dbi, key, vals1), true);

  // sn += 1;
  // key = snKey(pre, sn);
  // assert.deepStrictEqual(dberVal.putIOVals(dbi, key, vals1), true);

  //   *********************** THIS IS PENDING ********************************************
  //    #     vals = [bytes(val) for val in dber.getIoValsAllPreIter(db, pre)]
  //    #     allvals = vals0 + vals1 + vals2
  //    #     assert vals == allvals
  //   *********************** THIS IS PENDING ********************************************

  // #     # Test getIoValsLastAllPreIter(self, db, pre)

  // pre = Buffer.from('B4ejWzwQPYGGwTmuupUhPx5_yZ-Wk1xEHHzq7K0gzhcc', 'binary');
  // sn = 0;
  // key = snKey(pre, sn);
  // assert.deepStrictEqual(dberVal.addIOVal(dbi, key, [Buffer.from('gamma', 'binary')]), true);

  // #     vals2 = [b'dog', b'cat', b'bird']
  // #     sn += 1
  // #     key = snKey(pre, sn)
  // #     assert dber.putIoVals(db, key, vals2) == True

  // #     vals = [bytes(val) for val in dber.getIoValsLastAllPreIter(db, pre)]
  // #     lastvals = [vals0[-1], vals1[-1], vals2[-1]]
  // #     assert vals == lastvals

  // #     # Test getIoValsAnyPreIter(self, db, pre)
  // #     pre = b'BQPYGGwTmuupUhPx5_yZ-Wk1x4ejWzwEHHzq7K0gzhcc'
  // #     vals0 = [b'gamma', b'beta']
  // #     sn = 1  # not start at zero
  // #     key = snKey(pre, sn)
  // #     assert dber.addIoVal(db, key, vals0[0]) == True
  // #     assert dber.addIoVal(db, key, vals0[1]) == True

  // #     vals1 = [b'mary', b'peter', b'john', b'paul']
  // #     sn += 1
  // #     key = snKey(pre, sn)
  // #     assert dber.putIoVals(db, key, vals1) == True

  // #     vals2 = [b'dog', b'cat', b'bird']
  // #     sn += 2  # gap
  // #     key = snKey(pre, sn)
  // #     assert dber.putIoVals(db, key, vals2) == True

  // #     vals = [bytes(val) for val in dber.getIoValsAnyPreIter(db, pre)]
  // #     allvals = vals0 + vals1 + vals2
  // #     assert vals == allvals

  //  # assert not os.path.exists(dber.path)
}

test_opendatabaser();
