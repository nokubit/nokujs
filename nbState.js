'use strict';

// Prove RPC nokubit
//	Organization

const http = require('http');
const info = require('./nkLib');
const pegin = require('./nbPegin');
const send = require('./nkSendTx');

const netInfo = info.netInfo('nokubit');
const isMain = require.main === module;
//console.log('ISMAIN:', isMain);



/*************************************************************************
 *
 * Queste è la chiave privata che identifica lo stato o organizzazione
 *
 ************************************************************************/
const stateSkPem = 
'-----BEGIN EC PRIVATE KEY-----\n\
MHQCAQEEIKsnJh5rGg6t4S3sIMg8s0fPFimIhqf5sqNw6fVNcLfJoAcGBSuBBAAK\n\
oUQDQgAEsyd4CeyRNxbiNfraO7FPC0VhGN8omui2WN9RyPUQBUg2hbcIT/+c37iw\n\
fw0DrvtsTMMa11VhivXdrMq/2AguIA==\n\
-----END EC PRIVATE KEY-----';
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
'-----BEGIN EC PRIVATE KEY-----\n\
MHQCAQEEIIAmCMfMeXEcJXJydkQmy1OHdCPGM5M2L9HFJRHcaYTXoAcGBSuBBAAK\n\
oUQDQgAEmLvcJzc6PJOD32siP7rQYvrEPOrix2o2i0sOIP+zav9jukKi8PHdI3Yu\n\
GoWTijtBWeAVHn9VBgQvp3ZTJ1x02g==\n\
-----END EC PRIVATE KEY-----';

const walletSkKey = 'f454f8fe06122b07209addbc824fa84c0d1a112384b39c8913f20f2917f1e07e';
const walletKey = new info.EcCrypto({sk: walletSkKey});
//console.log(walletKey.skPem);
//console.log(info.encodeBech32(info.Hash160(walletKey.publicKey).toString('hex')));
//console.log('Prova chiavi 0', walletKey.checkPk2Sk(walletKey.publicKey));
//let res = walletKey.signSha256('');
//console.log(res);
//return;


const stateKey = new info.EcCrypto(stateSkPem);
const masterKey = new info.EcCrypto(nkSkPem);
const stateAddress = info.encodeBech32(info.Hash160(stateKey.publicKey).toString('hex'));

// Devono corrispondere al file di configurazione
const rpcUser = 'nokubit';
const rpcPassword = 'dD0HaWmDb+5bRq3rSo23UzFTxmb7YmKzzM3bXNgpBjlDoFQJvftG/635suWEJNgk1ZeOAZRpDHUXFoBg';
const rpcHost = 'localhost';


const destinationAddr = info.encodeBech32(info.Hash160(walletKey.publicKey).toString('hex'));
const stateName = 'Principato Di Monarco';
const stateDescription = 'B&B Principato Di Monarco';
const nFeeValue = ((Math.random() * 5 + 5) / 100000).toFixed(6);


const baseParam = {
	destinationAddr: destinationAddr,
	//chainGenesis: chainGenesis,
	//blockHeight: blockHeight,
	//txid: txid,
	//chainVOut: chainVOut,
	nFeeValue: nFeeValue,
	idFeeTx: undefined,

	walletKey: walletKey,

	stateName: stateName,
	stateDescription: stateDescription,
	stateAddress: stateAddress,
	issuanceFlag: true,


	rpcUser: rpcUser,
	rpcPassword: rpcPassword,
	rpcHost: rpcHost,
	nRPCPort: netInfo.nRPCPort,
	callTimeout: 4000
};
if (isMain) {
	if (process.argv.length == 2) {
		console.log('ATTENZIONE DEFAULT VALUE, il destinatario sarà ' + destinationAddr + '\n\n');
	} else if (process.argv.length == 3) {
		baseParam.destinationAddr = process.argv[2];
		console.log('Il destinatario sarà ' + baseParam.destinationAddr + '\n\n');
	} else {
		console.log("Manca il destinatario.\nE' richiesto l'indirizzo Bech32 del destinatario");
		return;
	}

	//masterKey.checkPk2Sk(masterKey.publicKey);
	//masterKey.checkPk2Sk(Buffer.from('0298bbdc27373a3c9383df6b223fbad062fac43ceae2c76a368b4b0e20ffb36aff', 'hex'));

	sendSignedState();
} else {
	exports.sendState = sendState;
	exports.sendSignedState = sendSignedState;
}


function sendState(obj, cb) {
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


	let intNFee = Math.round(parseFloat(param.nFeeValue) * 100000000);
	//console.log(param.nFeeValue, intNFee);

	if (!param.idFeeTx) {
		let peginOpt = {
			destinationAddr: param.destinationAddr,
			//chainGenesis: param.chainGenesis,
			//blockHeight: param.blockHeight,
			//txid: param.txid,
			//chainVOut: param.chainVOut,
			nValue: ((intNFee * 2) / 100000000).toFixed(6),

			rpcUser: param.rpcUser,
			rpcPassword: param.rpcPassword,
			rpcHost: param.rpcHost,
			callTimeout: param.callTimeout
		};
		param.nChangeFee = +peginOpt.nValue - param.nFeeValue;
		console.log('Change:', param.nChangeFee);
		pegin.sendPegin(peginOpt, function(e, r) {
			if (e) {
				if (isMain) console.log('Error in sendPegin');
				if (isMain) console.dir(e, {showHidden: true, depth: 99, colors: true});
				return;
			}
			if (!r.result || !r.result.tx) {
				if (isMain) console.log('tx not found in sendPegin');
				if (isMain) console.dir(r, {showHidden: true, depth: 99, colors: true});
				return;
			}
			param.feeTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
			param.idFeeTx = {
				hash: Buffer.from(param.feeTx.getHash()).reverse().toString('hex'),
				vout: 0
			};
			sendState(param, cb);
			//console.log('PEGIN TX', r.result.tx);
			//console.log('PEGIN HASH', param.idFeeTx);
		});
		return;
	}

	const bs = new info.BufferStream();
	bs.writeString('nkbo', 'binary');
	bs.setHashMark();
	bs.writeBufferSized(param.stateName, 'utf8');
	bs.writeBufferSized(param.stateDescription, 'utf8');
	bs.writeBuffer(info.decodeBech32(param.stateAddress).program);
	bs.writeUInt8(param.issuanceFlag);
	let signature = bs.getSignature(nkSkPem);
	//console.log(bs.getHash().reverse().toString('hex'));
	//console.log();

	bs.writeBufferSized(signature);
	signature = signature.toString('hex');
	//console.log('Signature', signature);
	//console.log();

	let buflog = bs.getData();
	//console.log(buflog.toString('hex'));
	//console.log();


	let id = Math.round(Math.random() * 100000);
	//console.log('ID', id);
	let changeObj = {};
	if (param.nChangeFee)
		changeObj[param.destinationAddr] = param.nChangeFee;

	let reqData = Buffer.from(JSON.stringify({
		jsonrpc: '1.0',
		id: id.toString(),
		method: 'createrawstate',
		params: [
			{
				name: param.stateName,
				description: param.stateDescription,
				stateAddress: param.stateAddress,
				signature: signature
			},
			[{
				txid: param.idFeeTx.hash,
				vout: param.idFeeTx.vout
			}],
			(param.issuanceFlag ? 'enable' : 'disable'),
			changeObj
		]
	}));
	//console.log('sendState param', reqData.toString());

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
				// Per test
				let stateData = Buffer.from(ans.result.hex, 'hex');
				//console.log(stateData.toString('hex'));
				if (isMain) console.log('sendState Response ' + (buflog.equals(stateData.slice(0, buflog.length)) ? 'MATCH' : 'DIFFER'));
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

function sendSignedState(obj, cb) {
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

	if (!param.stateTx) {
		//param.idFeeTx = Buffer.from('edd952682e5e3e1da70cb77a9f36d8a7b0be399d4de8cd0658872c1243a46b70', 'hex').reverse().toString('hex');
		//param.feeTx = Buffer.from('020000000001016638bbf96684d6b3054618034660e71b107969fb5a7c4508f3e7ea79a06defc50000008000ffffffff01006829000000000000160014eced9c59f5606e8e4fa406a987dd48746fbd647f029d6e6b62706fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000eeae0700cd07b3e67cc26ac602b3c879b14f0f1c2bf85dbfb0de46395664a7c5e6a02a7800000000502d000000000000483046022100aecca77f74f1ecab4f81273c9f0537f6e4439ad3c3dfca5b04b2276b57c12266022100bc28dc8495bc07c9dd8a06cd84ed2a8c8d710e681367808dec6c7a3f067d4bd917a914e563b67b7c60171a7f1ca7c6d949f7ffe1896b618700000000', 'hex');

		sendState(param, function(e, st) {
			if (e) {
				if (isMain) console.log('Error in sendState');
				if (isMain) console.dir(e, {showHidden: true, depth: 99, colors: true});
				return cb(e);
			}
			if (!st.result || !st.result.tx) {
				if (isMain) console.log('tx not found in sendState');
				if (isMain) console.dir(st, {showHidden: true, depth: 99, colors: true});
				return cb('tx not found in sendState');
			}
			//let tx = new info.Transaction(Buffer.from(st.result.tx, 'hex'));
			let ret = info.signNbTx(Buffer.from(st.result.tx, 'hex'), [undefined, {
				tx: st.param.feeTx,
				hashType: 1,
				sk:	param.walletKey.secretKey,
				pk: param.walletKey.publicKey
			}]);
			//console.dir(ret, {showHidden: true, depth: 99, colors: true});
			param.stateTx = ret;
			sendSignedState(param, cb);
		});
		return;
	}

	if (Buffer.isBuffer(param.stateTx))
		param.tx = param.stateTx.toString('hex');
	else
		param.tx = param.stateTx;
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
		if (isMain) console.dir(r, {showHidden: true, depth: 99, colors: true});
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

*/
