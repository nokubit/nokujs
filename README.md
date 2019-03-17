Premessa:
---------

Gran parte del codice e' stato scritto per verificare/capire pezzi del codice bitcoin.
Spesso lo stesso file contiene prove successive su funzionalità distinte: la nuova prova precede la vecchia non più eseguita.

Elenco file:

1) btAddrs.js
	* (new) prove firma EC via libreria interna NodeJs, conversione chiavi DER/RAW, con test su dati bitcoin
	* indirizzi bech32, codifica e decodifica + test presi dall BIP corrispondente.
	* indirizzi base58, codifica e decodifica tradotte dal codice Bitcoin + test con i  vettori che stanno nel sorgente bitcoin.
	* prove di prefisso su indirizze BIP32 (da non confondere con i Bech32)
	* prove (non completate) di uso della libreria Node crypto per la ECDSA. (in alternativa lib npm 'elliptic')

1a) nbPegin.js
	* test funzionalità API blockchain.info
	* test accesso RPC/API nokubit (incompleto)

2) bthash.js
	* Prime prove su uso hash in Bitcoin
	* simulazione sminamento di un blocco.

3) convert.js
	* prova uso api (libere) coinbase

4) explorer.js
	* decodifica file blocchi bitcoin. Vuole come parametro la directory dei blocchi
	-dir=path_blocchi &nbsp;&nbsp;&nbsp; default = **./.bitcoin/regtest/blocks**

Sviluppo
--------

Lo scopo di questo progetto è la creazione *in divenire* di uno strumento in grado di estrarre le informazioni dai blocchi creati in fase di pre-test dal progetto Nokubit.
Una possibile evoluzione di questo progetto potrà essere un vero *explorer* o un *wallet* per la catena Nokubit.

In questa fase questo strumento dovrà girare in ambiente server Linux, a linea di comando ed, in funzione degli argomenti passati, estrarre dalla catena dei blocchi i dati richiesti *in forma leggibile*, per esempio in una sola schermata della console.

I dati richiesti saranno p.es.:
* dettaglio di un blocco
* dettaglio di una transazione
* dettaglio di un *Asset*
* tracciatura di una transazione
* tracciatura di un Asset
* eccetera

Naturalmente lo strumento dovrà seguire l'evoluzione della catena Nokubit, p.es. le funzioni sugli Asset, dipendono da come e quando verranno implementi nella catena.

Un secondo aspetto dello sviluppo, da far partire a breve e poi mantenere in parallelo alle evoluzioni del primo, sarà la ripetizione degli stessi comandi utilizzando le RPC (API) della catena. Eventualmente, ma è ancora da verificarne la necessità, la realizzazione di comandi per la creazione di transazioni, con particolare riferimento agli Asset.
