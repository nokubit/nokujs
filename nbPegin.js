'use strict';

// Prove api blockchain
//const https = require('https');
//const fs = require('fs');
//
//const reqBlock = '0000000000000000002aacd7267062598134232647759b9dcb141dbc0afe34fa';
//const hexFormat = false;
//let opt = {
//	protocol: 'https:',
//	hostname: 'blockchain.info',
//	path: '/rawblock/' + reqBlock + (hexFormat ? '?format=hex' : ''),
//	method: 'GET',
//	timeout: 4000,
//	headers: {
//		accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//		//'accept-encoding': 'gzip, deflate, sdch, br',
//		'accept-language': 'en-US,en;q=0.8',
//		//'Content-Type': 'application/json; charset=UTF-8',
//		//'Content-Length': reqData.length,
//		'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.3'
//	}
//};
//
//let get_req2 = https.request(opt, function(res) {
//	//res.setEncoding('utf8');	
//	console.log(res.statusCode);
//	console.log(res.headers);
//	var outStream = fs.createWriteStream('BLOCK-' + reqBlock + (hexFormat ? '.hex' : '.json'));
//	res.on('data', function (chunk) {
//		outStream.write(chunk);
//	});
//	res.on('end', function() {
//		outStream.end();
//		console.log('GETted');
//	});
//});
//get_req2.on('error', function(e) {
//	console.log('CONN ERR:', e);
//});
//get_req2.end();
//console.log("Query page");
//
//
//return;


// Prove RPC nokubit

const http = require('http');
const crypto = require('crypto');
const info = require('./nkLib.js');

const netInfo = info.netInfo('nokubit');
const isMain = require.main === module;
//console.log('ISMAIN:', isMain);

/*************************************************************************
 *
 * Questa è la chiave privata della chiave pubbilca Noku inserita 
 * nel consensus del codice nokubit.
 *
 *   NATURALMENTE QUESTA E' UNA CHIAVE TEMPORANEA DA SOSTITUIRE
 *   CON LA VERA CHIAVE PRIVATA/PUBBLICA QUANDO IL SSTEMA VA IN
 *   TEST e/o PRODUZIONE
 *
 ************************************************************************/
const nkSkPem = 
//'-----BEGIN EC PRIVATE KEY-----\n\
//MHQCAQEEIKsnJh5rGg6t4S3sIMg8s0fPFimIhqf5sqNw6fVNcLfJoAcGBSuBBAAK\n\
//oUQDQgAEsyd4CeyRNxbiNfraO7FPC0VhGN8omui2WN9RyPUQBUg2hbcIT/+c37iw\n\
//fw0DrvtsTMMa11VhivXdrMq/2AguIA==\n\
//-----END EC PRIVATE KEY-----';
'-----BEGIN EC PRIVATE KEY-----\n\
MHQCAQEEIIAmCMfMeXEcJXJydkQmy1OHdCPGM5M2L9HFJRHcaYTXoAcGBSuBBAAK\n\
oUQDQgAEmLvcJzc6PJOD32siP7rQYvrEPOrix2o2i0sOIP+zav9jukKi8PHdI3Yu\n\
GoWTijtBWeAVHn9VBgQvp3ZTJ1x02g==\n\
-----END EC PRIVATE KEY-----';

// Devono corrispondere al file di configurazione
const rpcUser = 'nokubit';
const rpcPassword = 'dD0HaWmDb+5bRq3rSo23UzFTxmb7YmKzzM3bXNgpBjlDoFQJvftG/635suWEJNgk1ZeOAZRpDHUXFoBg';
const rpcHost = 'localhost';


//const destinationAddr = 'bc1qthpw5a2lrkhvh5x5af96pwdlxslwzr03j2ydc8';
const destinationAddr = 'bc1qzjj30758v2j7f9ga3d0aupvy7rh5s5dr7vqyj8';
const chainGenesis = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const blockHeight = Math.round(Math.random() * 10000 + 500000);
const txid = crypto.randomBytes(32).toString('hex');
const chainVOut = Math.round(Math.random() * 3);
const peginFee = '0.00002' 
let nValue = Math.round(Math.random() * 300 + 5);
if (Math.random() >= 0.5)
	nValue = (Math.random() * 500 + 5).toFixed(3);
//	Pegin-1
//const blockHeight = 507651;
//const txid = 'ca1c244d2d3f6e3184095a2cc4d5158e2ec8059022b9fc83e11effe28c021a2e';
//const chainVOut = 2;
//let nValue = 437.717;
//	Pegin-2
//const blockHeight = 502324;
//const txid = 'fe1b7a90aa828bce060e7a299c10ea2f464c0ae4f74dd42c75efa0f9d41cd2df';
//const chainVOut = 2;
//let nValue = 190;
//
//

const baseParam = {
	destinationAddr: destinationAddr,
	chainGenesis: chainGenesis,
	blockHeight: blockHeight,
	txid: txid,
	chainVOut: chainVOut,
	nValue: nValue,
	peginFee: peginFee,

	rpcUser: rpcUser,
	rpcPassword: rpcPassword,
	rpcHost: rpcHost,
	nRPCPort: netInfo.nRPCPort,
	callTimeout: 4000
};
if (isMain) {
	// Malleability test
	// let code = 0xEE;
	// let skKey = Buffer.alloc(32, code);
	// console.log(skKey.toString('hex'));
	// let key = new info.EcCrypto({sk: skKey});
	// baseParam.destinationAddr = info.encodeBech32(info.Hash160(key.publicKey).toString('hex'));
	// console.log(Buffer.concat([Buffer.from([0, 20]), info.Hash160(key.publicKey)]).toString('hex'));

	// code = 0x11;
	// skKey = Buffer.alloc(32, code);
	// console.log(skKey.toString('hex'));
	// key = new info.EcCrypto({sk: skKey});
	// baseParam.destinationAddr = info.encodeBech32(info.Hash160(key.publicKey).toString('hex'));
	// console.log(Buffer.concat([Buffer.from([0, 20]), info.Hash160(key.publicKey)]).toString('hex'));

	if (process.argv.length == 2) {
		console.log('ATTENZIONE DEFAULT VALUE, il destinatario sarà ' + destinationAddr + '\n\n');
	} else if (process.argv.length == 3) {
		baseParam.destinationAddr = process.argv[2];
		console.log('Il destinatario sarà ' + baseParam.destinationAddr + '\n\n');
	} else {
		console.log("Manca il destinatario.\nE' richiesto l'indirizzo Bech32 del destinatario");
		return;
	}

	//const masterKey = info.EcCrypto(nkSkPem);

	//masterKey.checkPk2Sk(masterKey.publicKey);
	//masterKey.checkPk2Sk(Buffer.from('0298bbdc27373a3c9383df6b223fbad062fac43ceae2c76a368b4b0e20ffb36aff', 'hex'));

	sendPegin();
} else {
	exports.sendPegin = sendPegin;
}

function sendPegin(obj, cb) {
	if (!cb && typeof obj === 'function') {
		cb = obj;
		obj = undefined;
	}
	if (typeof cb !== 'function') {
		cb = function() {};
	}
	let param = Object.assign({}, baseParam);
	if (typeof obj === 'object') {
		param = Object.assign(param, obj);
	}

	let intNValue = Math.round(parseFloat(param.nValue) * 100000000);
	if (!Number.isSafeInteger(intNValue)) {
		if (isMain) console.log('Number too big', intNValue.toString(16), intNValue, param.nValue);
		throw('Number too big' + intNValue.toString(16));
	}


	const bs = new info.BufferStream();
	bs.writeString('nkbp', 'binary');
	bs.setHashMark();
	bs.writeStringReverse(param.chainGenesis, 'hex');
	bs.writeUInt32LE(param.blockHeight);
	bs.writeStringReverse(param.txid, 'hex');
	bs.writeUInt32LE(param.chainVOut);
	// Modifica Pegin malleabilty
	bs.writeBuffer(info.decodeBech32(param.destinationAddr).program);
	bs.writeUInt64LE(intNValue);
	let signature = bs.getSignature(nkSkPem);
	if (isMain) console.log(bs.getHash().reverse().toString('hex'));
	if (isMain) console.log();

	bs.writeBufferSized(signature);
	signature = signature.toString('hex');
	if (isMain) console.log('Signature', signature);
	if (isMain) console.log();

	let buflog = bs.getData();
	if (isMain) console.log(buflog.toString('hex'));
	if (isMain) console.log();


	let id = Math.round(Math.random() * 100000);
	//console.log('ID', id);
	let jsonData = {
		jsonrpc: '1.0',
		id: id.toString(),
		method: 'createrawpegin',
		params: [
			{
				chainGenesis: param.chainGenesis,
				chainHeight: param.blockHeight,
				chainTxId: param.txid,
				chainVOut: param.chainVOut,
				signature: signature,
				nValue: param.nValue
			},
			// from bitcoin
			//'1PSSGeFHDnKNxiEyFrD1wcEaHr9hrQDDWc'
			// from wallet
			//'16H1gwpXtu4sgBNZ6mJMjSnFdbtHEibfgi'
			//'3LctqD27ct312JY28V2DR1w6saytnqXhnk'
			//'bc1qk3quswdv6vk96cv9h75d08elvt9tsg2mqmmyn3'
			//'bc1qthpw5a2lrkhvh5x5af96pwdlxslwzr03j2ydc8'
			//'bc1qankeck04vphgunayq65c0h2gw3hm6erl7z7ner'
			param.destinationAddr
		]
	};
	if (param.peginFee && param.peginFee > 0) {
		jsonData.params.push(param.peginFee);
	}
	let reqData = Buffer.from(JSON.stringify(jsonData));
	//console.log('param', reqData.toString());

	const options = {
		hostname: param.rpcHost,
		port: param.nRPCPort,
		method: 'POST',
		auth: param.rpcUser + ':' + param.rpcPassword,
		timeout: param.callTimeout,
		headers: {
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			//'accept-encoding': 'gzip, deflate, sdch, br',
			'accept-language': 'en-US,en;q=0.8',
			'Content-Type': 'application/json; charset=UTF-8',
			'Content-Length': reqData.length,
			'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.3'
		}
	};

	let get_req = http.request(options, function(res) {
		//res.setEncoding('utf8');	
		if (isMain) console.log(res.statusCode);
		//if (isMain) console.log(res.headers);
		let chunks = [];
		res.on('data', function (chunk) {
			chunks.push(chunk);
		});
		res.on('end', function() {
			let ans = {};
			try {
				ans = JSON.parse(chunks.join(''));
			} catch (e) {
				ans.error = e;
				ans.rawData = chunks.join('');
			}
			//console.log(ans);
			if (ans.error) {
				if (isMain) console.log('ERROR:', ans.error);
				cb(ans);
			} else if (res.statusCode != 200) {
				ans.error = 'http response';
				ans.code = res.statusCode;
				cb(ans);
			} else {
				if (isMain) console.dir(ans.result, {showHidden: true, depth: 99, colors: true});
				let peginData = Buffer.from(ans.result.hex, 'hex');
				//console.log(peginData.toString('hex'));
				if (isMain) console.log('Response ' + (buflog.equals(peginData.slice(0, buflog.length)) ? 'MATCH' : 'DIFFER'));
				//console.log(buflog.length, peginData.length);
				//console.log('Response ' + (buflog.slice(0, 100).equals(peginData.slice(0, 100)) ? 'MATCH' : 'DIFFER'));
				cb(undefined, ans);
			}
		});
	});
	get_req.on('error', function(e) {
		console.log('CONN ERR:', e);
	});
	get_req.end(reqData);
	//console.log("Query page");
};

/*
bitcoind -daemon -listenonion=false -debug=1
bitcoin-cli stop

bitcoin-cli help
bitcoin-cli generate 1 20000000
bitcoin-cli getnewaddress "" bech32
bitcoin-cli getrawmempool
bitcoin-cli getrawmempool true
bitcoin-cli listtransactions
bitcoin-cli listunspent
bitcoin-cli listunspent 0
bitcoin-cli getbalance
bitcoin-cli sendtoaddress <bech32 address> <value>

bitcoin-cli sendtoaddress bc1q00c2sh6spnft553hlyssxnysgm3uaf47xfgtrs 37.716
-> 2a7a15063c46aa2ea41553160c860992d364dfa118e05693b0d56aa5f0a3b292

Pegin 1
Peg-In 4ab31750f5352cae0e2deb051b0b5d0c95e50557e0a8a0add7fc6bc5de10d6e6
Main-ref f3ea62d622c8cbce7f9beb9e8275fc91ebb7fe17a920c774781c96d099fd6675

{ tx: '020000000001017566fd99d0961c7874c720a917feb7eb91fc75829eeb9b7fcecbc822d662eaf30000008000ffffffff0100f8e688e60100000016001414a517fa8762a5e4951d8b5fde0584f0ef4851a3029b6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000efa207001fb453f26a0abb336e08791c29b1bf7e0955c2f9bf475c3d08529abc5e0053e401000000e0ea88e60100000046304402205a6d3450cd98b4d8c5ff3f5a24cf21ecd758fd4b9aa12bfb220db4b35a536cf502205406da5457e41243446f2e2e1e9c1757833ddf154fa186321954971cccbeaaee17a914c4eff9844289a34c9655d4e811f5a35323aedf878700000000',
  hex: '6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000efa207001fb453f26a0abb336e08791c29b1bf7e0955c2f9bf475c3d08529abc5e0053e401000000e0ea88e60100000046304402205a6d3450cd98b4d8c5ff3f5a24cf21ecd758fd4b9aa12bfb220db4b35a536cf502205406da5457e41243446f2e2e1e9c1757833ddf154fa186321954971cccbeaaee',
  txj: 
   { txid: '4ab31750f5352cae0e2deb051b0b5d0c95e50557e0a8a0add7fc6bc5de10d6e6',
     hash: '5d09980a173ffbf1ea34c85c2cd5240d650aca8cd19445be4e7a3e614ddd7e0c',
     version: 2,
     size: 266,
     vsize: 129,
     locktime: 0,
     vin: 
      [ { txid: 'f3ea62d622c8cbce7f9beb9e8275fc91ebb7fe17a920c774781c96d099fd6675',
          vout: 0,
          scriptSig: { asm: '', hex: '' },
          txinwitness: 
           [ '6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000efa207001fb453f26a0abb336e08791c29b1bf7e0955c2f9bf475c3d08529abc5e0053e401000000e0ea88e60100000046304402205a6d3450cd98b4d8c5ff3f5a24cf21ecd758fd4b9aa12bfb220db4b35a536cf502205406da5457e41243446f2e2e1e9c1757833ddf154fa186321954971cccbeaaee',
             'a914c4eff9844289a34c9655d4e811f5a35323aedf8787',
             [length]: 2 ],
          sequence: 4294967295 },
        [length]: 1 ],
     vout: 
      [ { value: { value: 81.62699 },
          n: 0,
          scriptPubKey: 
           { asm: '0 14a517fa8762a5e4951d8b5fde0584f0ef4851a3',
             hex: '001414a517fa8762a5e4951d8b5fde0584f0ef4851a3',
             reqSigs: 1,
             type: 'witness_v0_keyhash',
             addresses: [ 'bc1qzjj30758v2j7f9ga3d0aupvy7rh5s5dr7vqyj8', [length]: 1 ] } },
        [length]: 1 ],
     hex: '020000000001017566fd99d0961c7874c720a917feb7eb91fc75829eeb9b7fcecbc822d662eaf30000008000ffffffff0100f8e688e60100000016001414a517fa8762a5e4951d8b5fde0584f0ef4851a3029b6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000efa207001fb453f26a0abb336e08791c29b1bf7e0955c2f9bf475c3d08529abc5e0053e401000000e0ea88e60100000046304402205a6d3450cd98b4d8c5ff3f5a24cf21ecd758fd4b9aa12bfb220db4b35a536cf502205406da5457e41243446f2e2e1e9c1757833ddf154fa186321954971cccbeaaee17a914c4eff9844289a34c9655d4e811f5a35323aedf878700000000' } }
Response MATCH


Pegin 2
Peg-In b00bb2b30d3ccd74671e4a9e8fe376da11ce81b0d007f9f228a63a3683921706
Main-ref 95ae8d1bcf8320b1df4c5a85b3caf21b5e9ba111ca05ad08a0a8f6f0eba89c62

{ tx: '02000000000101629ca8ebf0f6a8a008ad05ca11a19b5e1bf2cab3855a4cdfb12083cf1b8dae950000008000ffffffff0100b85d7e010b00000016001414a517fa8762a5e4951d8b5fde0584f0ef4851a3029b6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000010af07002c42a524c240e90395be68322786186c3626cbda1187273da751e94a91c8b48800000000a0617e010b000000463044022073b5f1b4c87e62fd498d2f2f331f3b1ea02ebdd893c09b2d6f4124aee7d1f7cc022066e7c42a4f56082e7ce30c9745209e95fccde80a53c1b5882b8f28f1418d935b17a914f2df85de37c16fba1e8bafb182acfbf06429cdec8700000000',
  hex: '6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000010af07002c42a524c240e90395be68322786186c3626cbda1187273da751e94a91c8b48800000000a0617e010b000000463044022073b5f1b4c87e62fd498d2f2f331f3b1ea02ebdd893c09b2d6f4124aee7d1f7cc022066e7c42a4f56082e7ce30c9745209e95fccde80a53c1b5882b8f28f1418d935b',
  txj: 
   { txid: 'b00bb2b30d3ccd74671e4a9e8fe376da11ce81b0d007f9f228a63a3683921706',
     hash: 'dbefeb53c7d6e06c2daf347f6aac92262eabbce3cac8fc56f0c39172bebee30b',
     version: 2,
     size: 266,
     vsize: 129,
     locktime: 0,
     vin: 
      [ { txid: '95ae8d1bcf8320b1df4c5a85b3caf21b5e9ba111ca05ad08a0a8f6f0eba89c62',
          vout: 0,
          scriptSig: { asm: '', hex: '' },
          txinwitness: 
           [ '6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000010af07002c42a524c240e90395be68322786186c3626cbda1187273da751e94a91c8b48800000000a0617e010b000000463044022073b5f1b4c87e62fd498d2f2f331f3b1ea02ebdd893c09b2d6f4124aee7d1f7cc022066e7c42a4f56082e7ce30c9745209e95fccde80a53c1b5882b8f28f1418d935b',
             'a914f2df85de37c16fba1e8bafb182acfbf06429cdec87',
             [length]: 2 ],
          sequence: 4294967295 },
        [length]: 1 ],
     vout: 
      [ { value: { value: 472.69699 },
          n: 0,
          scriptPubKey: 
           { asm: '0 14a517fa8762a5e4951d8b5fde0584f0ef4851a3',
             hex: '001414a517fa8762a5e4951d8b5fde0584f0ef4851a3',
             reqSigs: 1,
             type: 'witness_v0_keyhash',
             addresses: [ 'bc1qzjj30758v2j7f9ga3d0aupvy7rh5s5dr7vqyj8', [length]: 1 ] } },
        [length]: 1 ],
     hex: '02000000000101629ca8ebf0f6a8a008ad05ca11a19b5e1bf2cab3855a4cdfb12083cf1b8dae950000008000ffffffff0100b85d7e010b00000016001414a517fa8762a5e4951d8b5fde0584f0ef4851a3029b6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000010af07002c42a524c240e90395be68322786186c3626cbda1187273da751e94a91c8b48800000000a0617e010b000000463044022073b5f1b4c87e62fd498d2f2f331f3b1ea02ebdd893c09b2d6f4124aee7d1f7cc022066e7c42a4f56082e7ce30c9745209e95fccde80a53c1b5882b8f28f1418d935b17a914f2df85de37c16fba1e8bafb182acfbf06429cdec8700000000' } }
Response MATCH


Data 6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000003bf07002e1a028ce2ff1ee183fcb9229005c82e8e15d5c42c5a0984316e3f2d4d241cca020000002023ff300a000000
Hash fd56f236c0db3ee957365e1022bce398fa30fb6ce41e7e64cad09b4ee94167d0
Signature 3046022100a641a9cfe99b85b8b4841a96f56057b5a90b0e69134f6e1f8e973579a4994651022100f63ef93d39d1f3c430c9e4c4495eb815d80d5673e92a4be5e4c53e4f9a731edf
6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000003bf07002e1a028ce2ff1ee183fcb9229005c82e8e15d5c42c5a0984316e3f2d4d241cca020000002023ff300a000000
483046022100a641a9cfe99b85b8b4841a96f56057b5a90b0e69134f6e1f8e973579a4994651022100f63ef93d39d1f3c430c9e4c4495eb815d80d5673e92a4be5e4c53e4f9a731edf

PeginScript::ValidateSign: VERIFY b6addf67da981086da112a3d20075d032aabc14a7644ca6e5dbf8e162685f942 - 3046022100a641a9cfe99b85b8b4841a96f56057b5a90b0e69134f6e1f8e973579a4994651022100f63ef93d39d1f3c430c9e4c4495eb815d80d5673e92a4be5e4c53e4f9a731edf

Data 0 84 6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d619000000000003bf07002e1a028ce2ff1ee183fcb9229005c82e8e15d5c42c5a0984316e3f2d4d241cca020000002023ff300a000000

*/
