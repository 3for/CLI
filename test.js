//set up
const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider('https://rinkeby.infura.io'));
const BN = require('bn.js');
const util = require('ethjs-util');

const address = "0x9936e2e1ef9e50cb88a9fe7a69d2d16d6cafb551";
const address2 = "0xA5268Dd58FedFA5CB81F9B76EF0BA0a6f1DD4f60";
const contractAddress = "0x1547d3c12b088361c521ae96a51a96b563c26cf9";
const pointTokenContract = require('./pointToken.json');
const pointTokenContractInstance = eth.contract(pointTokenContract.abi).at(contractAddress);

//using web3 for querying logs
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));
const pointTokenContractInstanceWeb3 = web3.eth.contract(pointTokenContract.abi).at(contractAddress);


let event = pointTokenContractInstance.Award({ _to: address2 }, { fromBlock: 686929, toBlock: 'latest' });
let event2 = pointTokenContractInstanceWeb3.Award({ _to: address2 }, { fromBlock: 686929, toBlock: 'latest' });
console.log("Here is the event serialized from ethjs");
console.log(event.options);
console.log("--------------------------");
console.log("Here is the event serialized from web3");
console.log(event2.options);
console.log("this call works but of course if you passed event.options it would fail");
eth.getLogs(event2.options).then(result => {
    result.map(r => {
        //console.log(r);
        console.log(new BN(util.stripHexPrefix(r.topics[3])).toNumber());
    });
})
.catch(e => console.log(e.message));

