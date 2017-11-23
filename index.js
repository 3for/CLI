'use strict';
let config = require('./config');
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs');
const format = require('ethjs-format');

if (!config.ownerAddress || !config.ownerPrivateKey) {
	config.ownerAddress = process.env.OWNER_ADDRESS;
	config.ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
}

const provider = new SignerProvider(config.ethNode, {
	signTransaction: (rawTx, cb) => cb(null, sign(rawTx, config.ownerPrivateKey)),
	accounts: (cb) => cb(null, [config.ownerAddress]),
});
const eth = new Eth(provider);
//different objects that target replay node
const providerReplay = new SignerProvider(config.replayNode, {
	signTransaction: (rawTx, cb) => cb(null, sign(rawTx, config.ownerPrivateKey)),
	accounts: (cb) => cb(null, [config.ownerAddress]),
});
const ethReplay = new Eth(providerReplay);
const pointTokenContract = require('./PointTokenv2.json');
const pointTokenContractInstance = eth.contract(pointTokenContract.abi).at(config.contractAddress);
const util = require('ethjs-util');
const BN = require('bn.js');

const pointTokenContractInstanceReplay = ethReplay.contract(pointTokenContract.abi).at(config.contractAddressReplay);

//using web3 for querying logs
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(config.ethNode));
const pointTokenContractInstanceWeb3 = web3.eth.contract(pointTokenContract.abi).at(config.contractAddress);


const program = require('commander');
let addAward = (awardId) => {
	pointTokenContractInstance.addAward(awardId, { from: config.ownerAddress, gas: config.gas })
		.then(r => console.log(r))
		.catch(e => console.log(e.message));
};
let getAward = (awardId) => {
	pointTokenContractInstance.getAward(awardId)
		.then(r => console.log(r))
		.catch(e => console.log(e.message))
};
let isAwarder = (address) => {
	pointTokenContractInstance.isAwarder(address)
		.then(r => console.log(r))
		.catch(e => console.log(e.message))
};
let giveAward = (address, awardId, amount, checkIfEarned) => {
	let event = pointTokenContractInstanceWeb3.AwardGiven({ _to: address }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	let awards = [];
	eth.getLogs(event.options).then(result => {
		awards = result.map(r => {
			return new BN(util.stripHexPrefix(r.topics[3])).toNumber();
		});
		if (awards.find(a => a == awardId) != undefined && checkIfEarned === "true") {
			console.log("already earned that award");
		}
		else {
			pointTokenContractInstance.giveAward(address, awardId, amount,0, { from: config.ownerAddress, gas: config.gas })
				.then(r => console.log(r))
				.catch(e => console.log(e))

		}

	});


};
let balanceOf = (address) => {
	pointTokenContractInstance.balanceOf(address)
		.then(r => console.log(r[0].toString(10)))
		.catch(e => console.log(e.message))
};
let gas = () => {
	eth.gasPrice().then(r => console.log(r.toString(10)));
}
let getAwards = (address) => {
	let event = pointTokenContractInstanceWeb3.AwardGiven({ _to: address }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		result.map(r => {
			console.log(r);
			//console.log(new BN(util.stripHexPrefix(r.topics[3])).toNumber());
		});
	});
};
let giveAwardReplay = () => {
	let event = pointTokenContractInstanceWeb3.AwardGiven({ _from: config.ownerAddress }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		for (let i = 0; i < result.length; i++) {
			setTimeout(() => {
				let awardId = new BN(util.stripHexPrefix(result[i].topics[3])).toNumber();
				let address = result[i].topics[2].replace("000000000000000000000000", "");
				let amount = web3.toDecimal(result[i].data.slice(2, 66));

				pointTokenContractInstanceReplay.giveAward(address, awardId, amount, 0, { from: config.ownerAddress, gas: config.gas })
					.then(r => console.log("Awarded " + awardId + " to " + address + " for " + amount + " POINT tokens."  ))
					.catch(e => console.log(e))
				console.log("--------------");
			}, i * config.setTimeoutMilliseconds);
		}
	});
};
let getAwarders = () => {
	//using web3 to format the options correctly
	let event = pointTokenContractInstanceWeb3.AwarderAdded({}, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		result.map(r => {
			console.log(r);
			//console.log(new BN(util.stripHexPrefix(r.topics[3])).toNumber());
		});
	});
};
let addAwardReplay = () => {
	//using web3 to format the options correctly
	let event = pointTokenContractInstanceWeb3.AwardAdded({ _from: config.ownerAddress }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		//ethereum seems happier if we don't flood 
		//it with transactions and push one trasaction per block
		//there must be a better way but this works for now
		//with a timer that waits 1 minute before sending another transaction
		for (let i = 0; i < result.length; i++) {
			setTimeout(() => {
				let temp = "0x" + result[i].data.slice(67, result[i].data.length);
				let awardId = web3.toDecimal(temp);
				pointTokenContractInstanceReplay.addAward(awardId, { from: config.ownerAddress, gas: config.gas })
					.then(r => console.log("Added award " + awardId))
					.catch(e => console.log(e.message));
			}, i * config.setTimeoutMilliseconds);

		}
	});
};

let replay = () => {

	console.log("To replay all awards on a different blockchain, first run addAwardReplay.");
	console.log("After you are sure that all the transactions have been mined from the addAwardReplay, you can call giveAwardReplay.");
	console.log("Oh, and make sure you have enough gas to run the replay!");
};

program
	.command('replay')
	.action(replay);
program
	.command('getAwarders')
	.action(getAwarders);

program
	.command('addAward <awardId>')
	.action(addAward);
program
	.command('getAward <awardId>')
	.action(getAward);
program
	.command('isAwarder <address>')
	.action(isAwarder);
program
	.command('getAwards <address>')
	.action(getAwards);
program
	.command('balanceOf <address>')
	.action(balanceOf);
program
	.command('giveAward <address> <awardId> <amount> <checkIfEarned>')
	.action(giveAward);
program
	.command('gas')
	.action(gas);
program
	.command('giveAwardReplay')
	.action(giveAwardReplay);
program
	.command('addAwardReplay')
	.action(addAwardReplay);

program.parse(process.argv);
if (program.args.length === 0) program.help();
