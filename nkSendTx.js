'use strict';


// Prove RPC nokubit
//	Send Tx

const http = require('http');
const info = require('./nkLib.js');

const netInfo = info.netInfo('nokubit');
const isMain = require.main === module;
//console.log('ISMAIN:', isMain);

// Devono corrispondere al file di configurazione
const rpcUser = 'nokubit';
const rpcPassword = 'dD0HaWmDb+5bRq3rSo23UzFTxmb7YmKzzM3bXNgpBjlDoFQJvftG/635suWEJNgk1ZeOAZRpDHUXFoBg';
const rpcHost = 'localhost';


const baseParam = {
	tx: undefined,

	rpcUser: rpcUser,
	rpcPassword: rpcPassword,
	rpcHost: rpcHost,
	nRPCPort: netInfo.nRPCPort,
	callTimeout: 4000
};
if (isMain) {
	if (process.argv.length == 2) {
		console.log('ATTENZIONE MANCA LA TX (HEX STRING)\n\n');
		return;
	} else {
		baseParam.tx = process.argv[2];
	}

	sendTx();
} else {
	exports.sendTx = sendTx;
}

function sendTx(obj, cb) {
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

	let id = Math.round(Math.random() * 100000);
	//console.log('ID', id);
	let reqData = Buffer.from(JSON.stringify({
		jsonrpc: '1.0',
		id: id.toString(),
		method: 'sendrawtransaction',
		params: [
			param.tx,
			//allowhighfees: true
		]
	}));
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
				let txid = ans.result;
				ans.result = {
					txid: txid,
					tx: param.tx
				};
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
