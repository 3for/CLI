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
const pointTokenContract = require('./pointToken.json');
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
let awardAchievement = (address, awardId, amount, checkIfEarned) => {
	let event = pointTokenContractInstanceWeb3.Award({ _to: address }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	let achievements = [];
	eth.getLogs(event.options).then(result => {
		achievements = result.map(r => {
			return new BN(util.stripHexPrefix(r.topics[3])).toNumber();
		});
		if (achievements.find(a => a == awardId) != undefined && checkIfEarned === "true") {
			console.log("already earned that achievement");
		}
		else {
			pointTokenContractInstance.awardAchievement(address, awardId, amount, { from: config.ownerAddress, gas: config.gas })
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
let getAchievements = (address) => {
	//using web3 to format the options correctly
	let event = pointTokenContractInstanceWeb3.Award({ _to: address }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		result.map(r => {
			console.log(r);
			console.log(new BN(util.stripHexPrefix(r.topics[3])).toNumber());
		});
	});
};
let replayAchievementsByAwarder = () => {
	//using web3 to format the options correctly
	let event = pointTokenContractInstanceWeb3.Award({ _from: config.ownerAddress }, { fromBlock: config.blockFrom, toBlock: 'latest' });
	eth.getLogs(event.options).then(result => {
		result.map(r => {
			//console.log(r);
			let awardId = new BN(util.stripHexPrefix(r.topics[3])).toNumber();
			let address = r.topics[2].replace("000000000000000000000000","");
			let amount = web3.toDecimal(r.data.slice(2,66));
			console.log("Awarding " + awardId + " to " + address + " for " + amount + "POINT tokens.");
			
			//pointTokenContractInstance.awardAchievement(address, awardId, amount, { from: config.ownerAddress, gas: config.gas })
			//.then(r => console.log(r))
			//.catch(e => console.log(e))
			console.log("--------------");
		});
	});
};
let getAwarders = () => {
	//using web3 to format the options correctly
	let event = pointTokenContractInstanceWeb3.AwarderAdded({  }, { fromBlock: config.blockFrom, toBlock: 'latest' });
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
		result.map(r => {
			let temp = r.data.slice(67,r.data.length);
			let awardId = new BN(temp.slice(temp - 32,temp.length)).toNumber();;
			console.log(awardId);
			//pointTokenContractInstanceReplay.addAward(awardId, { from: config.ownerAddress, gas: config.gas })
			//.then(r => console.log(r))
			//.catch(e => console.log(e.message));
				
		});
	});
};

let replay = () => {

	console.log("To replay all awards on a different blockchain, first run addAwardReplay."); 
	console.log("After you are sure that all the transactions have been mined from the addAwardReplay, you can call replayAchievementsByAwarder."); 
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
	.command('getAchievements <address>')
	.action(getAchievements);
program
	.command('balanceOf <address>')
	.action(balanceOf);
program
	.command('awardAchievement <address> <awardId> <amount> <checkIfEarned>')
	.action(awardAchievement);
program
	.command('gas')
	.action(gas);
program
	.command('replayAchievementsByAwarder')
	.action(replayAchievementsByAwarder);
program
	.command('addAwardReplay')
	.action(addAwardReplay);
	
program.parse(process.argv);
if (program.args.length === 0) program.help();
