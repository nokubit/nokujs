'use strict';

// Nokubit cmd
//  Start stop clear and generate random tx

const crypto = require('crypto');
const fs = require('fs-extra');
const cp = require('child_process');
const path = require('path');

const info = require('./nkLib');
const pegin = require('./nbPegin');
const state = require('./nbState');
const asset = require('./nbAsset');
const send = require('./nkSendTx');

// Devono corrispondere al file di configurazione
const rpcUser = 'nokubit';
const rpcPassword = 'dD0HaWmDb+5bRq3rSo23UzFTxmb7YmKzzM3bXNgpBjlDoFQJvftG/635suWEJNgk1ZeOAZRpDHUXFoBg';
var rpcHost = 'localhost';
const callTimeout = 4000;

//const walletSkKey = crypto.randomBytes(32);
const walletSkKey = 'a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5';
const walletKey = new info.EcCrypto({sk: walletSkKey});
const walletAddr = info.encodeBech32(info.Hash160(walletKey.publicKey).toString('hex'));
console.log('Asset Owner', info.Hash160(walletKey.publicKey).toString('hex'));
//console.log(walletKey.publicKey.toString('hex'));
const stateSkKey = '5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a';
const stateKey = new info.EcCrypto({sk: stateSkKey});
//const stateAddr = info.encodeBech32(info.Hash160(stateKey.publicKey).toString('hex'));
const stateAddr = info.encodeBech32(info.Hash160(stateKey.publicKey).toString('hex'));

//console.log(info.Hash160(Buffer.from('037962d45b38e8bcf82fa8efa8432a01f20c9a53e24c7d3f11df197cb8e70926da', 'hex')).toString('hex'));
//return;


const stateName = 'Granducato Di San Martino';
const stateDescription = 'Agriturismo San Martino';

const assetName = 'Spic&Span';
const assetDescription = 'Asset detergente che esiste ancora';
const stateAddress = (Math.random() >= 0.5 ? stateAddr : '');
const issuanceFlag = true;
var assetTx;
var assetFee = {};


const args = function(args) {
	const argv = {};
	const param = [];
	argv['-node'] = args.shift();
	argv['-cmd'] = args.shift();
	//const m = new RegExp(/^(?:-{1,2}|\/{1,2})([^-\/=\s][^=\s]+)(?:$|=(.*)+$)/);
	const m = new RegExp(/^(?:-{1,2}|\/{1,2})([^-\/=][^=]+)\s*(?:$|=\s*(.*)+$)/);
	let a;
	while (a = args.shift()) {
        if (a == '-?' || a == '--?') {
            argv.help = true;
            continue
        }
		let r = m.exec(a);
		//console.log(a, r);
		if (r == null)
			param.push(a);
		else {
			switch (r[1]) {
            case 'help': argv.help = true; break;
            case 'datadir': argv.datadir = r[2] || args.shift(); break;
			case 'conf': argv.conf = r[2] || args.shift(); break;
			case 'exe': argv.exe = r[2] || args.shift(); break;
			case 'rpcaddr': argv.rpcaddr = r[2] || args.shift(); break;
			default: argv[r[1]] = r[2]; break;
			}
		}
	}
	return {
		help: function() {
            console.log('Nokubit manager');
            console.log('\t-help, -?:\t');
            console.log('\t-datadir:\t');
            console.log('\t-conf:\t');
            console.log('\t-exe:\t');
            console.log('commands');
            console.log('\tstart\tneed -exe option');
            console.log('\tstop');
            console.log('\tclear [all]\tall also delete wallet');
            console.log('\tinit [number]');
        },
        option: argv,
		param: param
	};
}(process.argv);
//console.log(args);

const netInfo = info.netInfo(args.option.chain || 'nokubit');
const miner = require('./miner')(args.option.chain || 'nokubit');
if (args.option.rpcaddr)
    rpcHost = args.option.rpcaddr;

if (args.option.help) {
    args.help();
    return;
}

var datadir;
var maindatadir;
var conf;
var pidfile;
var exe;
var cmd;
var keys;
var created;
var running;
var errstring;

datadir = args.option.datadir;
if (!('datadir' in args.option)) {
    let home = process.env.HOME;
    if (home)
        datadir = path.join(home, '.bitcoin');
    else
        datadir = path.join('/', '.bitcoin');
}
//console.log(datadir);
if (!datadir) {
    console.log("Please nokubit configuration path arguments.");
    args.help();
    return;
}

maindatadir = path.join(datadir, netInfo.strDataDir);
pidfile = path.join(maindatadir, 'bitcoind.pid');

if (!('conf' in args.option)) {
    conf = path.join(datadir, 'bitcoin.conf');
} else if (!path.isAbsolute(args.option.conf)) {
    conf = path.join(datadir, args.option.conf);
} else
    conf = args.option.conf;
console.log('Config:', conf);

exe = args.option.exe;
if (!exe) {
    exe = 'bitcoind';
}

cmd = args.param.shift();
if (!cmd) cmd = 'stst';

//console.log(`Current directory: ${process.cwd()}`);

function cmdstart() {
    // if (running) {
    //     console.log('Already running');
    //     return Promise.resolve(1);
    // }
    console.log('starting ...');
    return new Promise(function(resolve, reject) {
        cp.exec(exe + ' -daemon -listenonion=false -debug=asset', function(error, stdout, stderr) {
            if (error) {
                errstring = 'Exec error:';
                reject(error);
            }
            if (stderr)
                console.log('2', stderr);
            console.log(stdout);
            resolve(0);
        });
    });
};

function cmdstop() {
    if (!running) {
        console.log('Already stopped');
        return Promise.resolve(1);
    }
    console.log('stopping ...');
    return new Promise(function(resolve, reject) {
        try {
            process.kill(running);
        } catch (e) {
            if (e.errno != 'ESRCH')
                reject(e);
            console.log('Not running');
            fs.remove(pidfile, function() {});
            return resolve(1);
        }
        console.log('stopped');
        resolve(0);
    });
};

function cmdclear() {
    let p;
    if (running)
        p = cmdstop();
    else
        p = Promise.resolve();
    if (created) {
        if (args.param.shift() == 'all') {
            console.log('Cleaning all...');
            errstring = 'remove ' + maindatadir;
            p = p.then(function() {
                return fs.remove(maindatadir);
            });
        } else {
            console.log('Cleaning except wallet...');
            p = p.then(function() {
                let f = path.join(maindatadir, 'banlist.dat');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'debug.log');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'fee_estimates.dat');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, '.lock');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'mempool.dat');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'peers.dat');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'blocks');
                errstring = 'remove ' + f;
                return fs.remove(f);
            }).then(function() {
                let f = path.join(maindatadir, 'chainstate');
                errstring = 'remove ' + f;
                return fs.remove(f);
            });
        }
    } else
        console.log('Already clean');
    return p;
};

function cmdinit() {
    keys = {};
    errstring = '';
    let n = parseInt(args.param.shift());
    if (!(n > 0))   // for NaN
        n = 100;
    // Pegin per creatore asset
    let p = new Promise(function(resolve, reject) {
        let peginParam = {
            destinationAddr: walletAddr,
            //chainGenesis: param.chainGenesis,
            //blockHeight: param.blockHeight,
            txid: crypto.randomBytes(32).toString('hex'),
            //chainVOut: param.chainVOut,
            nValue: '100.00016',

            rpcUser: rpcUser,
            rpcPassword: rpcPassword,
            rpcHost: rpcHost,
            nRPCPort: netInfo.nRPCPort,
            callTimeout: callTimeout
        };
        pegin.sendPegin(peginParam, function(e, r) {
            if (e) {
                console.log('Error in sendPegin');
                console.dir(e, {showHidden: true, depth: 99, colors: true});
                return reject(e);
            }
            if (!r.result || !r.result.tx) {
                console.log('tx not found in sendPegin');
                console.dir(r, {showHidden: true, depth: 99, colors: true});
                return reject('tx not found from sendPegin');
            }
            assetTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
            assetFee.hash = Buffer.from(assetTx.getHash()).reverse().toString('hex');
            assetFee.vout = 0;
            assetFee.value = assetTx.vout[0].nValue;
            //console.log('Fee Pegin Value:', assetFee);
            resolve();
        });
    });
    p = p.then(function() {
        return new Promise(function(resolve, reject) {
            let stateParam = {
                destinationAddr: walletAddr,

                walletKey: walletKey,
                nFeeValue: (10000 / 100000000).toFixed(6),
                idFeeTx: {
                    hash: assetFee.hash,
                    vout: assetFee.vout
                },
                nChangeFee: (assetFee.value - 10000) / 100000000,
                feeTx: assetTx,

                stateName: stateName,
                stateDescription: stateDescription,
                stateAddress: stateAddr,
                issuanceFlag: true,

                rpcUser: rpcUser,
                rpcPassword: rpcPassword,
                rpcHost: rpcHost,
                nRPCPort: netInfo.nRPCPort,
                callTimeout: callTimeout
            };
            //console.log('Send State from', info.decodeBech32(walletAddr).program.toString('hex'));
            state.sendSignedState(stateParam, function(e, r) {
                if (e) {
                    console.log('Error in sendSignedState');
                    console.dir(e, {showHidden: true, depth: 99, colors: true});
                    return reject(e);
                }
                if (!r.result || !r.result.tx) {
                    console.log('tx not found in sendSignedState');
                    console.dir(r, {showHidden: true, depth: 99, colors: true});
                    return reject('tx not found from sendSignedState');
                }
                assetTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
                assetFee.hash = Buffer.from(assetTx.getHash()).reverse().toString('hex');
                assetFee.vout = 1;
                assetFee.value = assetTx.vout[1].nValue;

                //console.log('PEGIN TX', r.result.tx);
                //console.log('PEGIN HASH', param.idFeeTx);
                //console.log('Pegin Value:', o.assetTx);
                resolve();
            });
        });
    });

    // creazione 15 address [sk: 111.., 222..., ...]
    // assegnati n coin per ogni address
    for (let i=1; i<15; i++) {
        let code = i | (i << 4);
        let skKey = Buffer.alloc(32, code);
        //console.log(skKey.toString('hex'));
        let key = new info.EcCrypto({sk: skKey});
        let o = {key: key};
        o.pkBech = info.encodeBech32(info.Hash160(key.publicKey).toString('hex'));
        //o.sk = info.EncodeBase58Check(Buffer.concat([Buffer.from([128]), key.secretKey, Buffer.from([1])]).toString('hex'));
        //o.p2pkh = info.EncodeBase58Check(Buffer.concat([Buffer.from([0]), key.publicKey]).toString('hex'));
        //o.p2sh = info.EncodeBase58Check(Buffer.concat([Buffer.from([5]), key.publicKey]).toString('hex'));
        //o.pem = key.skPem;
        o.wScript = Buffer.concat([Buffer.from([0, 20]), info.Hash160(key.publicKey)]);
        console.log('User ' + i, info.Hash160(key.publicKey).toString('hex'));
        console.log(key.publicKey.toString('hex'));
        o.utxo = [];
        if (!key.checkPk2Sk(key.publicKey))
            console.log('Error for key', skKey.toString('hex'));
        keys[i] = o;

        p = p.then(function(nnn) {
            if (!nnn)
                nnn = 0;
            return new Promise(function(resolve, reject) {
                let peginParam = {
                    destinationAddr: o.pkBech,
                    //chainGenesis: param.chainGenesis,
                    //blockHeight: param.blockHeight,
                    txid: crypto.randomBytes(32).toString('hex'),
                    //chainVOut: param.chainVOut,
                    nValue: (i*111 + 0.5).toFixed(2),

                    rpcUser: rpcUser,
                    rpcPassword: rpcPassword,
                    rpcHost: rpcHost,
                    nRPCPort: netInfo.nRPCPort,
                    callTimeout: callTimeout
                };
                //console.log('Send Pegin to', nnn, info.decodeBech32(o.pkBech).program.toString('hex'));
                pegin.sendPegin(peginParam, function(e, r) {
                    if (e) {
                        console.log('Error in sendPegin');
                        console.dir(e, {showHidden: true, depth: 99, colors: true});
                        return reject(e);
                    }
                    if (!r.result || !r.result.tx) {
                        console.log('tx not found in sendPegin');
                        console.dir(r, {showHidden: true, depth: 99, colors: true});
                        return reject('tx not found from sendPegin');
                    }
                    let utxo = {};
                    utxo.tx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
                    utxo.hash = Buffer.from(utxo.tx.getHash()).reverse().toString('hex');
                    utxo.vout = 0;
                    utxo.value = {name: utxo.tx.vout[0].name, amount: utxo.tx.vout[0].nValue};
                    //console.log('Pegin', nnn, 'for', o.key.secretKey.toString('hex'));
                    o.utxo.push(utxo);
                    //console.log('PEGIN TX', r.result.tx);
                    //console.log('PEGIN HASH', param.idFeeTx);
                    //console.log('Pegin Value:', peginParam.nValue);
                    resolve(nnn + 1);
                });
            });
        });
    }

    // creazione di asset n token per ogni address
    // TODO prevedere più asset?
    for (let i=1; i<15; i++) {
        let o = keys[i];
        //console.log(o);

        p = p.then(function(nnn) {
            if (!nnn || nnn == 14)
                nnn = 0;
            return new Promise(function(resolve, reject) {
                let assetParam = {
                    destinationAddr: o.pkBech,
                    dstAssetAddr: walletAddr,

                    walletAssetKey: walletKey,
                    nValue: (15 - i).toFixed(2),
                    nFeeValue: (10000 / 100000000).toFixed(6),
                    idFeeTx: {
                        hash: assetFee.hash,
                        vout: assetFee.vout
                    },
                    nChangeFee: (assetFee.value - 10000) / 100000000,
                    feeTx: assetTx,

                    assetName: assetName,
                    assetDescription: assetDescription,
                    //assetAddress: masterKey.publicKey.toString('hex'),
                    stateAddress: stateAddress,
                    nAssetToken: (15 - i) * 1111100000,
                    issuanceFlag: issuanceFlag,

                    rpcUser: rpcUser,
                    rpcPassword: rpcPassword,
                    rpcHost: rpcHost,
                    nRPCPort: netInfo.nRPCPort,
                    callTimeout: callTimeout
                };
                //console.log('Send Asset to', nnn, info.decodeBech32(o.pkBech).program.toString('hex'));
                asset.sendSignedAsset(assetParam, function(e, r) {
                    if (e) {
                        console.log('Error in sendSignedAsset');
                        console.dir(e, {showHidden: true, depth: 99, colors: true});
                        return reject(e);
                    }
                    if (!r.result || !r.result.tx) {
                        console.log('tx not found in sendSignedAsset');
                        console.dir(r, {showHidden: true, depth: 99, colors: true});
                        return reject('tx not found from sendSignedAsset');
                    }
                    assetTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
                    assetFee.hash = Buffer.from(assetTx.getHash()).reverse().toString('hex');
                    assetFee.vout = 1;
                    assetFee.value = assetTx.vout[1].nValue;

                    let utxo = {};
                    utxo.tx = assetTx;
                    utxo.hash = assetFee.hash;
                    utxo.vout = 0;
                    utxo.value = {name: assetTx.vout[0].name, amount: assetTx.vout[0].nValue};
                    //console.log('Asset', nnn, 'for', o.key.secretKey.toString('hex'));
                    o.utxo.push(utxo);

                    //console.log('PEGIN TX', r.result.tx);
                    //console.log('PEGIN HASH', param.idFeeTx);
                    //console.log('Pegin Value:', o.assetTx);
                    resolve(nnn+1);
                });
            });
        });
    }
    p = p.then(function() {
        return new Promise(function(resolve, reject) {
            let genParam = {
                rpcUser: rpcUser,
                rpcPassword: rpcPassword,
                rpcHost: rpcHost,
                nRPCPort: netInfo.nRPCPort,
                callTimeout: callTimeout,

                walletAddress: info.Hash160(walletKey.publicKey),
                minerSign: 'Mined by mbert NK'
            };
            miner.getBlockTemplate(genParam, function(e, d) {
                if (e) {
                    console.log('Error in miner');
                    console.dir(e, {showHidden: true, depth: 99, colors: true});
                    return reject(e);
                }
                console.log('Block tx', d.blockData.transactions.length);
                // if (d.blockData.transactions.length == 0) {
                // 	console.log('No pending tx');
                // 	return;
                // }
                miner.generateBlock(d, function(e, res) {
                    if (e) {
                        console.log('Error in miner');
                        console.dir(e, {showHidden: true, depth: 99, colors: true});
                        return reject(e);
                    }
                    if (res != 'SUCCESS') {
                        console.log('block not found in miner');
                        console.dir(res, {showHidden: true, depth: 99, colors: true});
                        return reject('block not found from miner');
                    }
                    resolve();
                });
            });
        });
    });
    let count = 0;
    while (n--) {
        count++;
        if (count == 21) {
            count = 0;
            p = p.then(function() {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        let genParam = {
                            rpcUser: rpcUser,
                            rpcPassword: rpcPassword,
                            rpcHost: rpcHost,
                            nRPCPort: netInfo.nRPCPort,
                            callTimeout: callTimeout,
            
                            walletAddress: info.Hash160(walletKey.publicKey),
                            minerSign: 'Mined by mbert NK'
                        };
                        miner.getBlockTemplate(genParam, function(e, d) {
                            if (e) {
                                console.log('Error in miner');
                                console.dir(e, {showHidden: true, depth: 99, colors: true});
                                return reject(e);
                            }
                            console.log('Block tx', d.blockData.transactions.length);
                            // if (d.blockData.transactions.length == 0) {
                            // 	console.log('No pending tx');
                            // 	return;
                            // }
                            miner.generateBlock(d, function(e, res) {
                                if (e) {
                                    console.log('Error in miner');
                                    console.dir(e, {showHidden: true, depth: 99, colors: true});
                                    return reject(e);
                                }
                                if (res != 'SUCCESS') {
                                    console.log('block not found in miner');
                                    console.dir(res, {showHidden: true, depth: 99, colors: true});
                                    return reject('block not found from miner');
                                }
                                resolve();
                            });
                        });
                    }, 5000);
                });
            });
        }
        p = p.then(function(nnn) {
            if (!nnn)
                nnn = 0;
            console.log('Step', nnn);
            return new Promise(function(resolve, reject) {
                let rin = Math.floor(Math.random() * 14) + 1;
                if (rin < 1 || rin > 14)
                    console.log('+-+-+-+-+-+-+-+- rin out range', rin);
                let inWallet = keys[rin];
                let vin = [];
                let refTx = [];
                let invalues = {};
                let utxo;
                while (utxo = inWallet.utxo.shift()) {
                    let txin = new info.TxIn();
                    txin.prevout = new info.OutPoint();
                    txin.prevout.hash = Buffer.from(utxo.hash, 'hex').reverse();
                    txin.prevout.n = utxo.vout;
                    if (!(utxo.value.name in invalues))
                        invalues[utxo.value.name] = utxo.value.amount;
                    else
                        invalues[utxo.value.name] += utxo.value.amount;
                    txin.scriptSig = new info.Script(Buffer.from([0]));
                    vin.push(txin);
                    refTx.push({
                        tx: utxo.tx,
                        hashType: 1,
                        sk:	Buffer.from(inWallet.key.secretKey),
                        pk: Buffer.from(inWallet.key.publicKey)
                    });
                }

                let ro = Math.random() * 18;
                let nout = ro < 9 ? 1 : ro < 15 ? 2 : 3;
                let uout = [];
                while (uout.length < nout) {
                    let rout = Math.floor(Math.random() * 13) + 1;
                    if (rout >= rin)
                        rout++;
                    if (rout < 1 || rout > 14)
                        console.log('-+-+-+-+-+-+-+-+-+ rout out of range', rout, rin);
                    if (!uout.includes(rout))
                        uout.push(rout);
                }
                uout = uout.map(function(e) {
                    let v = [];
                    Object.keys(invalues).forEach(function(n) {
                        let m = invalues[n];
                        let a = Math.floor(m * Math.random() / 2);
                        invalues[n] -= a;
                        v.push({
                            name: n,
                            amount: a
                        });
                    });
                    return {
                        id: e,
                        v: v
                    }
                });

                let vout = [];
                uout.forEach(function(e) {
                    let script = keys[e.id].wScript;
                    e.v.forEach(function(m) {
                        let txout = new info.TxOut();
                        txout.scriptPubKey = new info.Script().fromBuffer(script);
                        txout.name = m.name;
                        txout.nValue = m.amount;
                        vout.push(txout);
                    });
                });

                // Resto
                let retScript = inWallet.wScript;
                Object.keys(invalues).forEach(function(n) {
                    if (!n) {
                        let fee = 3000;
                        invalues[n] -= fee;
                    }
                    let txout = new info.TxOut();
                    txout.scriptPubKey = new info.Script().fromBuffer(retScript);
                    txout.name = n;
                    txout.nValue = invalues[n];
                    vout.push(txout);
                });
                console.log('FROM', rin);

// 4a28188cbfa131c211c9565f85b517aa8ef23a7f750dc67a8e667a787c4d8078
// 76d194beb6b139b1da2f27c978781413bda2d92d329d96afdf050af8e19ac9bc
                let tx = new info.Transaction();
                tx.nVersion = 2;
                tx.vin = vin;
                tx.vout = vout;
                tx.nLockTime = 0;
                //console.dir(refTx, {depth: 99, colors: true});
                let ret = info.signNbTx(tx.toBuffer(), refTx);
                //console.log(ret.toString('hex'));
                let sendParam = {
                    tx: ret.toString('hex'),
                    rpcUser: rpcUser,
                    rpcPassword: rpcPassword,
                    rpcHost: rpcHost,
                    nRPCPort: netInfo.nRPCPort,
                    callTimeout: callTimeout
                };
		        setTimeout(function() {
                    send.sendTx(sendParam, function(e, r) {
                        if (e) {
                            console.log('Error in sendTx');
                            console.dir(e, {showHidden: true, depth: 99, colors: true});
                            return reject(e);
                        }
                        if (!r.result || !r.result.tx) {
                            console.log('tx not found in sendTx');
                            console.dir(r, {showHidden: true, depth: 99, colors: true});
                            return reject('tx not found in sendTx');
                        }
                        //console.dir(r, {showHidden: true, depth: 99, colors: true});

                        let userTx = new info.Transaction(Buffer.from(r.result.tx, 'hex'));
                        let hash = Buffer.from(userTx.getHash()).reverse().toString('hex');
                        let idx = 0;
                        uout.forEach(function(e) {
                            let utxos = keys[e.id].utxo;
                            e.v.forEach(function(m) {
                                let txout = userTx.vout[idx];
                                let utxo = {};
                                utxo.tx = userTx;
                                utxo.hash = hash;
                                utxo.vout = idx++;
                                utxo.value = {name: txout.name, amount: txout.nValue};
                                utxos.push(utxo);
                            });
                        });
                        for (; idx<userTx.vout.length; idx++) {
                            let txout = userTx.vout[idx];
                            let utxo = {};
                            utxo.tx = userTx;
                            utxo.hash = hash;
                            utxo.vout = idx;
                            utxo.value = {name: txout.name, amount: txout.nValue};
                            //console.log('Asset', nnn, 'for', o.key.secretKey.toString('hex'));
                            inWallet.utxo.push(utxo);
                        }
        
                        resolve(nnn+1);
                    });
                }, 500);
            });
        });
    }
    return p;
};

errstring = 'Path not found ' + datadir;

return fs.stat(datadir).then(function(stats) {
    if (!stats.isDirectory()) {
        console.log('Path is not a directory', datadir);
        throw 'Path is not a directory', datadir;
    }

    errstring = 'Config file not found ' + conf;
    return fs.stat(conf);
}).then(function(stats) {
    if (!stats.isFile())
        throw 'Config is not a file ' + conf;

    return new Promise(function(resolve, reject) {
        fs.stat(maindatadir, function(err, stats) {
            if (err)
                created = false;
            else if (!stats.isDirectory())
                return reject('Cain Path is not a directory ' + maindatadir);
            else
                created = true;
            return resolve(created);
        });
    });
}).then(function(test) {
    if (!test) {
        running = false;
        return false;
    }
    return new Promise(function(resolve, reject) {
        fs.stat(pidfile, function(err, stats) {
            if (err) {
                running = false;
                return resolve(running);
            }
            if (!stats.isFile())
                return reject('Pid is not a file ' + pidfile);
            fs.readFile(pidfile, function(err, data) {
                if (err)
                    return reject('Cannot read Pid ' + pidfile);
                running = parseInt(data.toString());
                return resolve(running);
            });
        });
    });
}).then(function(test) {
    if (test) {
        try {
            process.kill(test, 0);
        } catch (e) {
            if (e.errno == 'ESRCH')
                test = false;
        }
        if (test)
            return false;
    }
    return new Promise(function(resolve, reject) {
        fs.stat(exe, function(err, stats) {
            if (err)
                return resolve(false);
            if (!stats.isFile()) {
                console.log('Program is not a file', exe);
                return resolve(false);
            }
            let exmode = stats.mode & 0x168;    // 0550 => 0x168
            if ((exmode & 0x140) != 0x140 && (exmode & 0x028) != 0x028)
                return resolve(false);
            return resolve(true);
        });
    });
}).then(function(test) {
    if (cmd == 'stst') {
        if (!running)
            cmd = 'start';
        else
            cmd = 'stop';
    }
    errstring = 'param error';
    switch (cmd) {
    case 'start':
        if (!test)
            throw 'exe option not found';
        return cmdstart();
    case 'stop':
        return cmdstop();
    case 'clearall':
        args.param.unshift('all');
    case 'clear':
        return cmdclear();
    case 'init':
        return cmdinit();
    default:
        console.log('Unknown command', cmd);
        break;
    }
}).catch(function(e) {
    if (errstring)
        console.log(errstring);
    console.dir(e);
});

