'use strict';

// Prove RPC nokubit
//	Test

const crypto = require('crypto');
const info = require('./nkLib.js');

const netInfo = info.netInfo('nokubit');

let tmp = {comment: []};

const mapFlagNames = {
	NONE: info.Script.verifyFlags.SCRIPT_VERIFY_NONE,
	P2SH: info.Script.verifyFlags.SCRIPT_VERIFY_P2SH,
	STRICTENC: info.Script.verifyFlags.SCRIPT_VERIFY_STRICTENC,
	DERSIG: info.Script.verifyFlags.SCRIPT_VERIFY_DERSIG,
	LOW_S: info.Script.verifyFlags.SCRIPT_VERIFY_LOW_S,
	SIGPUSHONLY: info.Script.verifyFlags.SCRIPT_VERIFY_SIGPUSHONLY,
	MINIMALDATA: info.Script.verifyFlags.SCRIPT_VERIFY_MINIMALDATA,
	NULLDUMMY: info.Script.verifyFlags.SCRIPT_VERIFY_NULLDUMMY,
	DISCOURAGE_UPGRADABLE_NOPS: info.Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS,
	CLEANSTACK: info.Script.verifyFlags.SCRIPT_VERIFY_CLEANSTACK,
	MINIMALIF: info.Script.verifyFlags.SCRIPT_VERIFY_MINIMALIF,
	NULLFAIL: info.Script.verifyFlags.SCRIPT_VERIFY_NULLFAIL,
	CHECKLOCKTIMEVERIFY: info.Script.verifyFlags.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY,
	CHECKSEQUENCEVERIFY: info.Script.verifyFlags.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY,
	WITNESS: info.Script.verifyFlags.SCRIPT_VERIFY_WITNESS,
	DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM: info.Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM,
	WITNESS_PUBKEYTYPE: info.Script.verifyFlags.SCRIPT_VERIFY_WITNESS_PUBKEYTYPE,
	CONST_SCRIPTCODE: info.Script.verifyFlags.SCRIPT_VERIFY_CONST_SCRIPTCODE,
};

function typesToFlag(types) {
	if (!types)
		return 0;
	let flag = 0;
	types.split(',').forEach(function(type) {
		if (!(type in mapFlagNames))
			throw 'unknown verification flag ' + type;
		flag |= mapFlagNames[type];
	});
	return flag;
};

//const txsJson = require('../nokubit/src/test/data/tx_valid.json').map(function(e) {
const txsJson = require('./tx_valid.bitcoin.json').map(function(e) {
	if (e.length == 1 && typeof e[0] === 'string') {
		//console.log(e[0]);
		tmp.comment.push(e[0]);
		return undefined;
	}
	let x = tmp;
	tmp = {comment: []};
	if (e.length != 3) {
		console.log('ERROR', e.length);
	}
	x.tx = Buffer.from(e[1], 'hex');
	x.types = e[2];
	x.typev = typesToFlag(e[2]);
	let rValue = RegExp('^[-]{0,1}[0-9]+$');
	let rHex = RegExp('^0x([0-9a-fA-F][0-9a-fA-F])+$');
	x.prevout = e[0].map(function(inp) {
		let a = inp[2].split(/\s/);
		const bs = new info.BufferStream();
		a = a.map(function(b) {
			if (rValue.test(b)) {
				bs.writeBuffer(info.CScriptPushInt64(parseInt(b)));
			} else if (rHex.test(b)) {
				bs.writeBuffer(Buffer.from(b.slice(2), 'hex'));
			} else if (b[0] == "'" && b.length >= 2 && b[b.length - 1] == "'") {
				console.log(b.slice(1, -1));
				bs.writeString(b.slice(1, -1), 'ascii');
			} else if (b in info.opcodetype) {
				bs.writeUInt8(info.opcodetype[b]);
			} else if (('OP_' + b) in info.opcodetype) {
				bs.writeUInt8(info.opcodetype['OP_' + b]);
			} else {
				console.log(b);
				throw 'script parse error';
			}
		});
		let b = bs.getData();
		bs.reset();
		bs.writeBufferSized(b);
		let pout = {
			hash: Buffer.from(inp[0], 'hex').reverse().toString('hex'),
			index: inp[1],
			scriptPubKey: bs.getData()
		};
		if (inp.length > 3)
			pout.amount = inp[3];
		return pout;
	});
	return x;
}).filter(function(e) { return typeof e === 'object'; });

// https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki#Restrictions_on_public_key_type
txsJson.unshift({
	comment: ['Native P2WPKH'],
	txUnsigned: Buffer.from('0100000002fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f0000000000eeffffffef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff02202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac11000000', 'hex'),
	tx: Buffer.from('01000000000102fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f00000000494830450221008b9d1dc26ba6a9cb62127b02742fa9d754cd3bebf337f7a55d114c8e5cdd30be022040529b194ba3f9281a99f2b1c0a19c0489bc22ede944ccf4ecbab4cc618ef3ed01eeffffffef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff02202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac000247304402203609e17b84f6a7d30c80bfa610b5b4542f32a8a0d5447a12fb1366d7f01cc44a0220573a954c4518331561406f90300e8f3358f51928d43c212a8caed02de67eebee0121025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee635711000000', 'hex'),
	types: 'WITNESS',
	typev: info.Script.verifyFlags.STANDARD_SCRIPT_VERIFY_FLAGS,	// SCRIPT_VERIFY_WITNESS,
	prevout: [{
		hash: 'fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f',
		index: 0,
		scriptPubKey: new info.Script().fromBuffer('2103c9f4836b9a4f77fc0d81f7bcb01b7f1b35916864b9476c241ce9fc198bd25432ac').toBuffer(),
		amount: 625000000,
		hashType: info.SIGHASH_ALL,
		sk:  Buffer.from('bbc27228ddcb9209d7fd6f36b02f7dfa6252af40bb2f1cbc7a557da8027ff866', 'hex'),
	},{
		hash: 'ef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a',
		index: 1,
		scriptPubKey: new info.Script().fromBuffer('00141d0f172a0ecb48aee1be1f2687d2963ae33f71a1').toBuffer(),
		amount: 600000000,
		hashType: info.SIGHASH_ALL,
		sk:  Buffer.from('619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9', 'hex'),
		pk:  Buffer.from('025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee6357', 'hex'),
	}]
});
//txsJson.unshift({
//	comment: ['P2SH-P2WPKH'],
//	txUnsigned: Buffer.from('0100000001db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a54770100000000feffffff02b8b4eb0b000000001976a914a457b684d7f0d539a46a45bbc043f35b59d0d96388ac0008af2f000000001976a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6d77c88ac92040000', 'hex'),
//	tx: Buffer.from('01000000000102fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f00000000494830450221008b9d1dc26ba6a9cb62127b02742fa9d754cd3bebf337f7a55d114c8e5cdd30be022040529b194ba3f9281a99f2b1c0a19c0489bc22ede944ccf4ecbab4cc618ef3ed01eeffffffef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff02202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac000247304402203609e17b84f6a7d30c80bfa610b5b4542f32a8a0d5447a12fb1366d7f01cc44a0220573a954c4518331561406f90300e8f3358f51928d43c212a8caed02de67eebee0121025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee635711000000', 'hex'),
//	types: 'WITNESS',
//  typev: info.Script.verifyFlags.SCRIPT_VERIFY_WITNESS,
//	prevout: [{
//		hash: '0000000000000000000000000000000000000000000000000000000000000100',
//		index: 0,
//		scriptPubKey: new info.Script().fromBuffer('a9144733f37cf4db86fbc2efed2500b4f4e49f31202387').toBuffer(),
//		reedemScript: new info.Script().fromBuffer('001479091972186c449eb1ded22b78e40d009bdf0089').toBuffer(),
//		amount: 1000000000,
//		hashType: info.SIGHASH_ALL,
//		sk:  Buffer.from('eb696a065ef48a2192da5b28b694f87544b30fae8327c4510137a922f32c6dcf', 'hex'),
//		pk:  Buffer.from('03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873', 'hex'),
//	}]
//});



//console.dir(txsJson, {depth: 4, colors: true, showHidden: false});

txsJson.forEach(function(e, idx) {
	//var t = new info.PrecomputedTransactionData(tx);
//	let e = txsJson[0];
	//let e = txsJson[85];
	//let e = txsJson[89];
	//let e = txsJson[90];
	//let e = txsJson[91];
	//let e = txsJson[92];
	//let e = txsJson[93];
	//let e = txsJson[94];
	//let e = txsJson[95];
	//let e = txsJson[96];
	//let e = txsJson[97];
	//let e = txsJson[98];
	//let e = txsJson[99];
	//let e = txsJson[102];
	//let e = txsJson[109];
	//let e = txsJson[110];
	// if (idx < 40)	// Da verificare 10, 11, 40, 41
	// 	return;
	// console.log(e.comment);
	// e.prevout.forEach(function(d, idx) {
	// 	console.log(idx, d.scriptPubKey.toString('hex'));
	// });
//	let sign = info.DecodeBase58Check('L5AQtV2HDm4xGsseLokK2VAT2EtYKcTm3c7HwqnJBFt9LdaQULsM');
//	e.prevout.forEach(function(po) { po.sk = sign; });
	//console.log(e.prevout);
	//var t = info.signBcTx(e.tx, e.prevout);
	var t = info.checkBcTx(e.tx, e.prevout, e.typev);
	//console.dir('Checked:', idx);
	e.prevout.forEach(function(txin, n) {
		if (txin.signed == 'OK') {
			if (txin.warning)
				console.log('WARNING:', n, txin.warning);
			return;
		}
		console.log(e.comment);
		e.prevout.forEach(function(d, idx) {
			console.log(idx, d.scriptPubKey.toString('hex'));
		});
		console.dir('Checked:', idx);
		if (txin.failed)
			console.log('FAIL:', n, txin.failed);
		else if (txin.warning)
			console.log('WARNING:', n, txin.warning);
		else
			console.log('ERROR UNKNOWN:', n);
	});
});
