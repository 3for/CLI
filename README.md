# Point Token Command Line Interface (CLI) 
This repo contains a Node-based  command line interface for interacting with the POINT Token System. The POINT Token System is a multi-tenant, decentralized loyalty and rewards system that runs on the Ethereum Blockchain.

To learn more about the POINT Token System, go to  [http://www.pointtoken.io](http://www.pointtoken.io). The website has a white paper which thoroughly outlines how the system works. 
## Installation
Clone the repo. Install the dependencies as follows:
```bash
npm install
``` 
## Configuration
All configuration properties can be found and set in **config.js**. This includes which Ethereum network you are connecting to and what address you are sending transactions as. If you want to use the CLI to write to the Ethereum blockchain, you will need to specify an address and a private key. Write-able transactions do require gas. If you only want to query the blockchain, you don't have to provide an address or private key.
## Usage

All commands can be called as follows:
```bash
node index.js [command] [arguments]
```
The following commands are supported:

```bash
addAward <awardId>
```
If you have been provisioned as an AWARDER, you can use this command to add an AWARD to the system. AWARDS are unsigned integers. Once you have claimed that integer, it is owned by the address that claimed it forever.

Returns a transaction ID. Requires gas.

```bash
getAward <awardId>
```
You can use this command to determine the address that owns an AWARD. Useful when adding awards so that you don't burn gas trying to claim an AWARD id that is already in use.

Returns the address that owns the AWARD. Does not require gas.

```bash
isAwarder <address>
```
Pass an Ethereum address. Returns a boolean indicating if that address has the privilege to issue AWARDS in the system. Does not require gas.

```bash
getAchievements <address>
```
Pass an Ethereum address to determine which AWARDS an address has earned. Returns the AWARD ID of each achievement earned. Does not require gas.

```bash
balanceOf <address>
```
Pass an Ethereum address to determine the number of POINT tokens earned by this address. Does not require gas.
```bash
awardAchievement <address> <awardId> <amount> <checkIfEarned>
```
Use this command to award an achievement. This can only be issued by an address that has been provisioned as an AWARDER. If the AWARDER also wants to issue POINT tokens, they can be issued by passing the <amount> parameter. If you want to issue an AWARD without issuing any POINTS, pass zero. If you want the command to fail if the person has already earned the achievement, pass **true** for the <checkIfEarned> command. Returns a transaction ID. Requires gas.

 