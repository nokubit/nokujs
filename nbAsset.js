'use strict';

// Prove RPC nokubit
//	Asset

const http = require('http');
const info = require('./nkLib.js');
const pegin = require('./nbPegin');
const send = require('./nkSendTx');

const netInfo = info.netInfo('nokubit');
const isMain = require.main === module;
//console.log('ISMAIN:', isMain);



/*************************************************************************
 *
 * Queste è la chiave privata che identifica il propretario dell'Asset
 *
 ************************************************************************/
const assetSkPem = 
// secp256k1-key2.pem
'-----BEGIN EC PRIVATE KEY-----\n\
MHQCAQEEIFUQz0V7DfXIS0hSJv9FD5EsASvkRN2C7neYCAOiMCBHoAcGBSuBBAAK\n\
oUQDQgAE2sGgalI1WmW6qFKZJPVosV8MIDnxBo7jEILeYrghuYnk5/l6wHdRN2iV\n\
5meKQRDroM27l9Zt711qjWhYvrxi3g==\n\
-----END EC PRIVATE KEY-----';

//const walletSkKey = crypto.randomBytes(32);
//console.log(walletSkKey.toString('hex'));
const walletUserSkKey = '96e0a8232ddfec812f02af261681b7fe7c7b1a11e61c69bf765e72a433b4802c';
const walletUserKey = new info.EcCrypto({sk: walletUserSkKey});
//console.log(walletUserKey.skPem);
//console.log(info.encodeBech32(info.Hash160(walletUserKey.publicKey).toString('hex')));
//console.log(walletUserKey.secretKey.toString('hex'));
//console.log(info.EncodeBase58Check(Buffer.concat([Buffer.from([128]), walletUserKey.secretKey, Buffer.from([1])]).toString('hex')));
//console.log('Prova chiavi User', walletUserKey.checkPk2Sk(walletUserKey.publicKey));

const walletAssetSkKey = '5285936a9ae0510283e4779d10e2a9daed070ed6db340ce3d1673812ea8956f8';
const walletAssetKey = new info.EcCrypto({sk: walletAssetSkKey});
//console.log(walletAssetKey.skPem);
//console.log(info.encodeBech32(info.Hash160(walletAssetKey.publicKey).toString('hex')));
//console.log(walletAssetKey.secretKey.toString('hex'));
//console.log(info.EncodeBase58Check(Buffer.concat([Buffer.from([128]), walletAssetKey.secretKey]).toString('hex')));
//console.log('Prova chiavi Asset', walletAssetKey.checkPk2Sk(walletAssetKey.publicKey));
//let res = walletAssetKey.signSha256('');
//console.log(res);
//return;
/*
// 02
// 	48 30 45 02 21 00aa48319e3c25ebd47c70765eb3a750ff0eb9b4cf20653784e5fc77e8bb2cc6ad02 20 0590323b517bf97dbddd9002a3eafd5f5aae95a3de1fc9c055a8fe6560f336f2 01
// 	21 035a2ee7e0259f7332b4398da8c67e780bb69e3c72a525a204b1256bb709a7c648
// bc1qrpgw669amxmdl9wvf9dk4k80rzqec576da2d9x
// 00141850ed68bdd9b6df95cc495b6ad8ef18819c53da
var pkey = Buffer.from('035a2ee7e0259f7332b4398da8c67e780bb69e3c72a525a204b1256bb709a7c648', 'hex');
var addr = info.decodeBech32('bc1qrpgw669amxmdl9wvf9dk4k80rzqec576da2d9x');
console.log(addr);
console.log(addr.type, addr.program.toString('hex'));
// 0301080e1a1a051d1b061b0d1f050e0c09050d161516070f0302001918141e1a
// 0 'e672d08a325dadf1539c3bc689bd7958c39a0393'

console.log(info.Hash160(pkey).toString('hex'));
console.log('-------------------------');
//pkey = Buffer.from('035a2ee7e0259f7332b4398da8c67e780bb69e3c72a525a204b1256bb709a7c648', 'hex');
addr = info.decodeBech32('bc1qx0dyf556dvg699zjf4ctkxwy2m7a35m2mnjd8w');
console.log(addr.type, addr.program.toString('hex'));
*/
/*
console.log('-------------------------');
console.log('-------------------------');
const testKey = new info.EcCrypto({sk: 'BB2AC60BC518C0E239D5AF9D8D051A6BDFD0D931268DCA70C59E5992'});
//console.log(testKey.secretKey.equals(Buffer.from('BB2AC60BC518C0E239D5AF9D8D051A6BDFD0D931268DCA70C59E5992', 'hex')));
//console.log(testKey.publicKey.equals(Buffer.from('039f53e45f8f18b8ed294378bda342eff69b2053debf27fbede7d2d6bd84be6235', 'hex')));
const bss = new info.BufferStream();
bss.writeScriptVector(testKey.publicKey);
bss.writeUInt8(0xAC);
const redeemScript = bss.getData();
console.log(redeemScript.toString('hex'));
const redeemScriptHash = bss.getRipemd();
console.log(redeemScriptHash.toString('hex'));

return;
*/

const masterKey = info.EcCrypto(assetSkPem);


// Devono corrispondere al file di configurazione
let rpcUser = 'nokubit';
let rpcPassword = 'dD0HaWmDb+5bRq3rSo23UzFTxmb7YmKzzM3bXNgpBjlDoFQJvftG/635suWEJNgk1ZeOAZRpDHUXFoBg';
const rpcHost = 'localhost';


var destinationAddr = info.encodeBech32(info.Hash160(walletUserKey.publicKey).toString('hex'));
var dstAssetAddr = info.encodeBech32(info.Hash160(walletAssetKey.publicKey).toString('hex'));
const assetName = 'NokuPenny';
const assetDescription = 'Asset Noku di prova';
const stateAddress = '';
let nValue = Math.round(Math.random() * 300 + 5);
if (Math.random() >= 0.5)
	nValue = (Math.random() * 500 + 5).toFixed(3);
const nFeeValue = (nValue / 5000).toFixed(8);


const baseParam = {
	destinationAddr: destinationAddr,
	//chainGenesis: chainGenesis,
	//blockHeight: blockHeight,
	//txid: txid,
	//chainVOut: chainVOut,
	nFeeValue: nFeeValue,
	idFeeTx: undefined,

	walletAssetKey: walletAssetKey,
	dstAssetAddr: dstAssetAddr,

	assetName: assetName,
	assetDescription: assetDescription,
	assetAddress: masterKey.publicKey.toString('hex'),
	//assetAddress: masterKey.ecdh.getPublicKey('hex', 'uncompressed'),
	stateAddress: stateAddress,
	nValue: nValue,
	nAssetToken: 34500000,
	issuanceFlag: true,


	rpcUser: rpcUser,
	rpcPassword: rpcPassword,
	rpcHost: rpcHost,
	nRPCPort: netInfo.nRPCPort,
	callTimeout: 4000
};
if (isMain) {
	if (process.argv.length == 2) {
		console.log('ATTENZIONE DEFAULT VALUE, il destinatario sarà ' + baseParam.destinationAddr + '\n\n');
	} else if (process.argv.length == 3) {
		baseParam.destinationAddr = process.argv[2];
		console.log('Il destinatario sarà ' + baseParam.destinationAddr + '\n\n');
	} else {
		console.log("Manca il destinatario.\nE' richiesto l'indirizzo Bech32 del destinatario");
		return;
	}

	//masterKey.checkPk2Sk(masterKey.publicKey);
	//masterKey.checkPk2Sk(Buffer.from('04dac1a06a52355a65baa8529924f568b15f0c2039f1068ee31082de62b821b989e4e7f97ac07751376895e6678a4110eba0cdbb97d66def5d6a8d6858bebc62de', 'hex'));
	//masterKey.checkPk2Sk(Buffer.from('02dac1a06a52355a65baa8529924f568b15f0c2039f1068ee31082de62b821b989', 'hex'));
	console.log('Current PK', masterKey.publicKey.toString('hex'));

	sendSignedAsset();
} else {
	exports.sendAsset = sendAsset;
	exports.sendSignedAsset = sendSignedAsset;
}


function sendAsset(obj, cb) {
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
		console.log('Number too big', intNValue.toString(16), intNValue, param.nValue);
		throw('Number too big' + intNValue.toString(16));
	}
	let intNFeeValue = Math.round(parseFloat(param.nFeeValue) * 100000000);
	if (isMain) console.log(param.nValue, intNValue, param.nFeeValue, intNFeeValue);

	if (!param.idFeeTx) {
		let peginOpt = {
			destinationAddr: param.dstAssetAddr,
			//chainGenesis: param.chainGenesis,
			//blockHeight: param.blockHeight,
			//txid: param.txid,
			//chainVOut: param.chainVOut,
			nValue: ((intNFeeValue * 10) / 100000000).toFixed(6),

			rpcUser: param.rpcUser,
			rpcPassword: param.rpcPassword,
			rpcHost: param.rpcHost,
			callTimeout: param.callTimeout
		};
		param.nChangeFee = +peginOpt.nValue - param.nFeeValue;
		pegin.sendPegin(peginOpt, function(e, r) {
			if (e) {
				if (isMain) console.log('Error in sendPegin');
				if (isMain) console.dir(e, {showHidden: true, depth: 99, colors: true});
				return cb(e);
			}
			if (!r.result || !r.result.tx) {
				if (isMain) console.log('tx not found in sendPegin');
				if (isMain) console.dir(r, {showHidden: true, depth: 99, colors: true});
				return cb('tx not found in sendPegin');
			}
			param.feeTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
			param.idFeeTx = {
				hash: Buffer.from(param.feeTx.getHash()).reverse().toString('hex'),
				vout: 0
			};
			//console.log('PEGIN TX', r.result.tx);
			//console.log('PEGIN HASH', param.idFeeTx);
			console.log('Pegin Value:', peginOpt.nValue, 'Change:', param.nChangeFee);
			sendAsset(param, cb);
		});
		return;
	}

	const bs = new info.BufferStream();
	bs.writeString('nkbm', 'binary');
	bs.setHashMark();
	bs.writeBufferSized(param.assetName, 'utf8');
	bs.writeBufferSized(param.assetDescription, 'utf8');
	bs.writeBufferSized(param.assetAddress, 'hex');
	if (param.stateAddress)
		bs.writeBuffer(info.decodeBech32(param.stateAddress).program);
	else
		bs.writeBuffer(Buffer.alloc(20));
	// Modifica Asset malleabilty
	bs.writeBuffer(info.decodeBech32(param.destinationAddr).program);

//	bs.writeUInt64LE(intNValue);
	bs.writeUInt64LE(param.nAssetToken);
//	bs.writeUInt64LE(intNFeeValue);
	bs.writeUInt8(param.issuanceFlag);
	bs.writeUInt8(0);

	let signature = bs.getSignature(masterKey.skPem);
	//console.log(bs.getHash().reverse().toString('hex'));
	//console.log();

	bs.writeBufferSized(signature);
	signature = signature.toString('hex');
	//console.log('Signature', signature);
	//console.log();

	let buflog = bs.getData();
	//console.log(buflog.toString('hex'));
	//console.log();


	let retChange = {};
	retChange[param.dstAssetAddr] = param.nChangeFee.toFixed(6);
	let id = Math.round(Math.random() * 100000);
	//console.log('ID', id);
	let reqData = Buffer.from(JSON.stringify({
		jsonrpc: '1.0',
		id: id.toString(),
		method: 'createrawasset',
		params: [
			{
				assetName: param.assetName,
				assetDescription: param.assetDescription,
				assetAddress: param.assetAddress,
				stateAddress: param.stateAddress,
				signature: signature,
				//peggedValue: param.nValue,
				//assetFee: param.nFeeValue,
				issuanceFlag: param.issuanceFlag
			},
			[{
				txid: param.idFeeTx.hash,
				vout: param.idFeeTx.vout
			}],
			// from bitcoin
			//'1PSSGeFHDnKNxiEyFrD1wcEaHr9hrQDDWc'
			// from wallet
			//'16H1gwpXtu4sgBNZ6mJMjSnFdbtHEibfgi'
			//'3LctqD27ct312JY28V2DR1w6saytnqXhnk'
			//'bc1qk3quswdv6vk96cv9h75d08elvt9tsg2mqmmyn3'
			//'bc1qjpkf56n7vdjre589khgjzx528792sznau6fmdy'
			param.destinationAddr,
			param.nAssetToken,
			retChange
		]
	}));
	if (isMain) console.log('sendAsset param', reqData.toString());
	//console.log('RPC Asset to', info.decodeBech32(param.destinationAddr).program.toString('hex'));

	let options = {
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
				let assetData = Buffer.from(ans.result.hex, 'hex');
				//console.log(assetData.toString('hex'));
				if (isMain) console.log('sendAsset Response ' + (buflog.equals(assetData.slice(0, buflog.length)) ? 'MATCH' : 'DIFFER'));
				//console.log(buflog.length, ans.length);
				//console.log('Response ' + (buflog.slice(0, 100).equals(ans.slice(0, 100)) ? 'MATCH' : 'DIFFER'));
				if (!('param' in ans))
					ans.param = {};
				ans.param.feeTx = param.feeTx;
				ans.param.idFeeTx = param.idFeeTx;
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

function sendSignedAsset(obj, cb) {
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

	if (!param.assetTx) {
//		param.idFeeTx = {
//			hash: Buffer.from('949528c9f2451020b7fcedf4479763562a87c6aa2ad784496ea2bf502230187b', 'hex').reverse().toString('hex')
//			vout: 0
//		};
//		param.feeTx = Buffer.from('02000000000101bdf216d78a0b4d39d9a81ac4f4e43ce94c84faaec25068e1de2f5944ddd86c470000008000ffffffff010070f6241a00000000160014ce93c82cce5f8b5b6e337efe19127c8d39402702029b6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000bfac07005e5b294ccd0cb54aa91b590fd2953f39db71f28b604dcc4b03f0f0a0e3a695780200000058fa241a0000000046304402206449b22848ee9e2655dd7b542981765132e79325c579badf7b808e7bdeb8888e02204c1b6a48d6fe6edfdc542fd7d20f2a5363c87b21ea0fa5b8f960abf52de504b017a91427e5464a384ba1106b6c9081786a17577a434f1f8700000000', 'hex');

		sendAsset(param, function(e, ast) {
			if (e) {
				if (isMain) console.log('Error in sendAsset');
				if (isMain) console.dir(e, {showHidden: true, depth: 99, colors: true});
				return cb(e);
			}
			if (!ast.result || !ast.result.tx) {
				if (isMain) console.log('tx not found in sendAsset');
				if (isMain) console.dir(ast, {showHidden: true, depth: 99, colors: true});
				return cb('tx not found in sendAsset');
			}
			//let tx = new info.Transaction(Buffer.from(st.result.tx, 'hex'));
			let ret = info.signNbTx(Buffer.from(ast.result.tx, 'hex'), [undefined, {
				tx: ast.param.feeTx,
				hashType: 1,
				sk:	param.walletAssetKey.secretKey,
				pk: param.walletAssetKey.publicKey
			}]);
			//console.dir(ret, {showHidden: true, depth: 99, colors: true});
			param.assetTx = ret;
			sendSignedAsset(param, cb);
		});
		return;
	}

	if (Buffer.isBuffer(param.assetTx))
		param.tx = param.assetTx.toString('hex');
	else
		param.tx = param.assetTx;
	send.sendTx(param, function(e, r) {
		if (e) {
			if (isMain) console.log('Error in sendTx');
			if (isMain) console.dir(e, {showHidden: true, depth: 99, colors: true});
			return cb(e);
		}
		if (!r.result) {
			if (isMain) console.log('tx not found in sendTx');
			if (isMain) console.dir(r, {showHidden: true, depth: 99, colors: true});
			return cb('tx not found in sendTx');
		}
		//console.dir(r, {showHidden: true, depth: 99, colors: true});
		cb(null, r);
	});
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

{ transaction: '02000000000102fb23c7eeab096c562a0d0c2f957dfed8c8e024b0c7fd853cde9f278211f147550000008000ffffffff968c214853a7e50dc28f34ef4ab813ee67a39c1ee4b3a78bf7a0e0fbacc866260000000000ffffffff0100ffffffffffffffff0002a76e6b626d044e6f6b75002102dac1a06a52355a65baa8529924f568b15f0c2039f1068ee31082de62b821b9890000000000000000000000000000000000000000000000000000000000000000009d966b0100000020145d0000000000000048304602210091dcb0b50e26333f929bf85e0c3c37ac3347d5efbef054dd5b0554799aba254b022100bf87eb00e596c06405430cf0323cd29bdc224368b42461620726547221a7e97a17a914b7f4a8ed68bcef562c2b85b05241d26896ab33b487010000000000',
  txid: '33c1c8c76264672d203c7d2f467114f95808f4fbd376282224366dd3c5db7ac9',
  vin: 0 }

02000000
0001
02
  fb23c7eeab096c562a0d0c2f957dfed8c8e024b0c7fd853cde9f278211f14755 00000080 00 ffffffff
  968c214853a7e50dc28f34ef4ab813ee67a39c1ee4b3a78bf7a0e0fbacc86626 00000000 00 ffffffff
01
  00 ffffffffffffffff 00
02
  a7 6e6b626d044e6f6b75002102dac1a06a52355a65baa8529924f568b15f0c2039f1068ee31082de62b821b9890000000000000000000000000000000000000000000000000000000000000000009d966b0100000020145d0000000000000048304602210091dcb0b50e26333f929bf85e0c3c37ac3347d5efbef054dd5b0554799aba254b022100bf87eb00e596c06405430cf0323cd29bdc224368b42461620726547221a7e97a
  17 a914b7f4a8ed68bcef562c2b85b05241d26896ab33b487
01
  00
00000000

*/
