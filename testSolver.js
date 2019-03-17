'use strict';

// Test nkLib nokubit
//	Solver

const crypto = require('crypto');
const info = require('./nkLib.js');

const netInfo = info.netInfo('nokubit');

const testKeys = [
    new info.EcCrypto(),
    new info.EcCrypto(),
    new info.EcCrypto(),
];
const keyhash = info.Hash160(testKeys[0].publicKey);
const b = new info.BufferStream();
b.writeUInt8(info.opcodetype.OP_DUP);
b.writeUInt8(info.opcodetype.OP_HASH160);
b.writeScriptVector(keyhash);
b.writeUInt8(info.opcodetype.OP_EQUALVERIFY);
b.writeUInt8(info.opcodetype.OP_CHECKSIG);
const reedemScript = b.getData();
b.reset();


function test(name, b, ref) {
    console.log('test: ' + name);
    const script = new info.Script().fromBuffer(b.getData());
    //console.log(script.toBuffer());
    let sol = {};
    if (script.Solver(sol)) {
        if (sol.type == ref.type) {
            ref.solutions.forEach(function(r, idx) {
                let s = sol.solutions.shift();
                if (typeof s !== 'undefined') {
                    if (Buffer.isBuffer(r) && r.equals(s))
                        return;
                    else if (r == s[0])
                        return;
                }
                console.log('Error on Solution ' + (idx + 1), r, 'FOUND', s);
            });
            if (sol.solutions.length > 0)
                console.log('Error on Solution ', sol.solutions);
        } else
            console.log('Error must be', ref.type, 'FOUND', sol.type);
    } else if (ref.solutions.length > 0 || ref.type != 'nonstandard')
        console.log('Cannot solve', sol);
};

// TX_SCRIPTHASH
let sol = [Buffer.alloc(20)];
b.reset();
b.writeUInt8(info.opcodetype.OP_HASH160);
b.writeScriptVector(sol[0]);
b.writeUInt8(info.opcodetype.OP_EQUAL);
test('TX_SCRIPTHASH BLANK', b, {
    solutions: sol,
    type: 'scripthash'
});

// TX_SCRIPTHASH
sol = [keyhash];
b.reset();
b.writeUInt8(info.opcodetype.OP_HASH160);
b.writeScriptVector(keyhash);
b.writeUInt8(info.opcodetype.OP_EQUAL);
test('TX_SCRIPTHASH PUBKEY', b, {
    solutions: sol,
    type: 'scripthash'
});

// TX_PUBKEY
sol = [testKeys[0].publicKey];
b.reset();
b.writeScriptVector(sol[0]);
b.writeUInt8(info.opcodetype.OP_CHECKSIG);
test('TX_PUBKEY PUBKEY', b, {
    solutions: sol,
    type: 'pubkey'
});

// TX_PUBKEYHASH
sol = [keyhash];
b.reset();
b.writeUInt8(info.opcodetype.OP_DUP);
b.writeUInt8(info.opcodetype.OP_HASH160);
b.writeScriptVector(keyhash);
b.writeUInt8(info.opcodetype.OP_EQUALVERIFY);
b.writeUInt8(info.opcodetype.OP_CHECKSIG);
test('TX_PUBKEYHASH', b, {
    solutions: sol,
    type: 'pubkeyhash'
});

// TX_SCRIPTHASH
sol = [info.Hash160(reedemScript)];
b.reset();
b.writeUInt8(info.opcodetype.OP_HASH160);
b.writeScriptVector(sol[0]);
b.writeUInt8(info.opcodetype.OP_EQUAL);
test('TX_SCRIPTHASH', b, {
    solutions: sol,
    type: 'scripthash'
});

// TX_MULTISIG
sol = [1, testKeys[0].publicKey, testKeys[1].publicKey, 2];
b.reset();
b.writeUInt8(info.opcodetype.OP_1);
b.writeScriptVector(testKeys[0].publicKey);
b.writeScriptVector(testKeys[1].publicKey);
b.writeUInt8(info.opcodetype.OP_2);
b.writeUInt8(info.opcodetype.OP_CHECKMULTISIG);
test('TX_MULTISIG 1/2', b, {
    solutions: sol,
    type: 'multisig'
});

// TX_MULTISIG
sol = [2, testKeys[0].publicKey, testKeys[1].publicKey, testKeys[2].publicKey, 3];
b.reset();
b.writeUInt8(info.opcodetype.OP_2);
b.writeScriptVector(testKeys[0].publicKey);
b.writeScriptVector(testKeys[1].publicKey);
b.writeScriptVector(testKeys[2].publicKey);
b.writeUInt8(info.opcodetype.OP_3);
b.writeUInt8(info.opcodetype.OP_CHECKMULTISIG);
test('TX_MULTISIG 2/3', b, {
    solutions: sol,
    type: 'multisig'
});

// TX_NULL_DATA
sol = [];
b.reset();
b.writeUInt8(info.opcodetype.OP_RETURN);
b.writeScriptVector('00', 'hex');
b.writeScriptVector('4b', 'hex');
b.writeScriptVector('ff', 'hex');
test('TX_NULL_DATA', b, {
    solutions: sol,
    type: 'nulldata'
});

// TX_WITNESS_V0_KEYHASH
sol = [keyhash];
b.reset();
b.writeUInt8(info.opcodetype.OP_0);
b.writeScriptVector(keyhash);
test('TX_WITNESS_V0_KEYHASH', b, {
    solutions: sol,
    type: 'witness_v0_keyhash'
});

// TX_WITNESS_V0_SCRIPTHASH
sol = [info.Hash256(reedemScript)];
b.reset();
b.writeUInt8(info.opcodetype.OP_0);
b.writeScriptVector(sol[0]);
test('TX_WITNESS_V0_SCRIPTHASH', b, {
    solutions: sol,
    type: 'witness_v0_scripthash'
});

// TX_WITNESS_NONSTANDARD
sol = [9, info.Hash256(reedemScript)];
b.reset();
b.writeUInt8(info.opcodetype.OP_9);
b.writeScriptVector(sol[1]);
test('TX_WITNESS_NONSTANDARD', b, {
    solutions: sol,
    type: 'witness_unknown'
});

// TX_NONSTANDARD
sol = [];
b.reset();
b.writeUInt8(info.opcodetype.OP_9);
b.writeUInt8(info.opcodetype.OP_ADD);
b.writeUInt8(info.opcodetype.OP_11);
b.writeUInt8(info.opcodetype.OP_EQUAL);
test('TX_NONSTANDARD', b, {
    solutions: sol,
    type: 'nonstandard'
});

