'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const info = require('./nkLib.js');

const fVoid = function() {};
const ev = new EventEmitter();
//ev.on('error', 

var args = function(args) {
	const argv = {};
	const param = [];
	argv.node = args.shift();
	argv.cmd = args.shift();
	let m = new RegExp(/^(?:-{1,2}|\/{1,2})([^-\/=\s][^=\s]+)(?:$|=(.*)+$)/);
	let a;
	while (a = args.shift()) {
		let r = m.exec(a);
		//console.log(a, r);
		if (r == null)
			param.push(a);
		else{
			switch (r[1]) {
			case 'dir': argv.dir = r[2] || args.shift(); break;
			case 'chain': argv.chain = r[2] || args.shift(); break;
			default: argv[r[1]] = r[2]; break;
			}
		}
	}
	return {
		argv: argv,
		param: param
	};
}(process.argv);
console.log(args);

const netInfo = info.netInfo(args.argv.chain || 'nokubit');

const txMode = netInfo.txMode || false;
const block_file = function(dir) {
	const baseName = 'blk{0}.dat';
	var idxName = 0;
	if (typeof dir === 'undefined')
		dir = '../.bitcoin/' + (netInfo.strNetworkID || 'regtest') + '/blocks';

	const next = function() {
		let r;
		if (path.isAbsolute(dir))
			r = path.join(dir, baseName.replace(/\{0\}/, ('00000' + (idxName++).toString()).slice(-5)));
		else
			r = path.join(__dirname, dir, baseName.replace(/\{0\}/, ('00000' + (idxName++).toString()).slice(-5)));
		//console.log(r);
		return r;
	};

	return {
		resetStream: function(id) { idxName = id || 0; },
		nextStream: function() { return fs.createReadStream(next()); }
		//nextFile: function(cb) { fs.open(next(), 'r', cb || fVoid); }
	};
}(args.argv.dir);


var blocks = [];
const nextBlockFile = function nextBlockFile(flag) {
	let chunks = [];
	let ended = false;

	if (flag)
		block_file.resetStream();
	const bStream = block_file.nextStream();
	bStream.on('error', function(err) {
//console.log('error', err);
		if (!ended){
			ended = true;
			if ('code' in err && err.code == 'ENOENT')
				console.log('No more file');
			else
				console.log('error', err);
			ev.emit('end_files');
		}
	});
	bStream.on('close', function(id) {
		//console.log('close', arguments);
		if (!ended)
			ev.emit('next_file');
	});
	bStream.on('data', function(chunk) {
//console.log('data', arguments);
		if (chunks > 0){
			chunks(chunk);
			chunk = Buffer.concat(chunks);
			chunks = [];
console.log("_onData: Concatenate");
		}
		// Check message
		while (chunk.length > 0){
//console.log('_onData while0', chunk.length);
			while(chunk.length >= 8) {
				let h = chunk.slice(0, 4);
				let n = chunk.readUInt32LE(4);
//console.log("_onData Chunk: ", n, h);
				
				if (n === 0 && netInfo.pchMessageZero.equals(h)){
					bStream.close();
					console.log('no more message');
					return;
				}
				if (!netInfo.pchMessageStart.equals(h)){
					ended = true;
					bStream.close();
					console.log('Invalid file', chunk);
					return;
				}
				let msg = chunk.slice(8);
				if (n <= msg.length) {
					if (n < msg.length) {
						chunk = msg.slice(n);
						msg = msg.slice(0, n);
					}else
						chunk = null;
					ev.emit('raw_block', msg);
					if (chunk == null)
						return;
				} else {
	console.log("_onData wait: " + (n - msg.length));
					chunks.push(chunk);
					return;
				}
			}
			if (chunk.length < 8){
	console.log("_onData residual: " + chunk.length);
				chunks.push(data);
				return;
			}
		}
	});
};

ev.on('next_file', function(data) {
//	console.log('next_file', arguments);
	nextBlockFile();
});
ev.on('raw_block', function(data) {
//	console.log('rawBlock', arguments);
	blocks.push(new info.Block(data, txMode));
});

ev.on('end_files', function() {
	console.log('END', blocks.length);
	if (blocks.length == 0) {
		console.log('NO BLOCK FOUND');
		return;
	}
	if (!netInfo.consensusHashGenesisBlock.equals(blocks[0].hash))
		console.log('END INVALID GENESIS');
	if (!netInfo.genesisHashMerkleRoot.equals(blocks[0].hashMerkleRoot))
		console.log('END INVALID GENESIS MERKLE');
	let hash = Buffer.alloc(32);
	blocks.forEach(function(b, i) {
		if (!hash.equals(b.hashPrevBlock))
			console.log('END INVALID HASH PREV', i, b.hashPrevBlock, hash);
		hash = b.hash;
		if (!b.merkleChecked)
			console.log('END INVALID HASH MERKLE', i);
		if (b.vtx.length > 1) {
			console.log('BLOCK', b.hash.toString('hex', 24).split().reverse().join(), 'nTX', b.vtx.length);
			b.vtx.forEach(function(tx) {
				console.log(tx);

			});
		}
	});
});
nextBlockFile(true);

/* Formato firma 
48 304502206e21798a42fae0e854281abd38bacd1aeed3ee3738d9e1446618c4571d1090db022100e2ac980643b0b82c0e88ffdfec6b64e3e6ba35e7ba5fdd7d5d6cc8d25c6b241501

ScriptSig
8B                                                - script is 139 bytes long
48 
	30 45 02
		21 00F3581E1972AE8AC7C7367A7A253BC1135223ADB9A468BB3A59233F45BC578380
	02 
		20 59AF01CA17D00E41837A1D58E97AA31BAE584EDEC28D35BD96923690913BAE9A
	01
41 049C02BFC97EF236CE6D8FE5D94013C721E915982ACD2B12B65D9B7D59E20A842005F8FC4E02532E873D37B96F09D6D4511ADA8F14042F46614A4C70C0F14BEFF5
*/