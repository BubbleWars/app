# Bubblewars.io

## Dependencies

Nodejs, Docker, cartesi [cartesi Docs](https://docs.cartesi.io/guide/introduction/installing).

## Quick Start

### Setting up the Local Blockchain and Smart Contracts

After installing the necessary packages, run the following command to set up the local blockchain and smart contracts:

```bash
npm i
cartesi run --no-backend --block-time 1
```

### Starting the Node Backend

To get the node backend code up and running, use:

```bash
npm run dev
```

### Starting the Indexer

This is responsible for simulating and syncing all of the clients with game state. Using Colyseus, Websockets, Node.js, etc.

```bash
cd src/indexer
npm i
npm run dev
```

### Running the Front End

Navigate to the front end directory and start the development server:

```bash
cd src/front
npm i
npm run dev
```

### Running the Faucet Server

Navigate to the front end directory, install dependencies, specify your variables, and deploy the faucet server.(Use the private key of address 1 within the mock mnemonic).

```bash
pnpm install @latticexyz/faucet@next
export PORT=2001
export RPC_HTTP_URL=http://localhost:8545
export FAUCET_PRIVATE_KEY=<PRIVATE_KEY>
export DRIP_AMOUNT_ETHER=100
pnpm faucet-server
```

Please note that commands should be run in the terminal and might require administrative privileges depending on your system setup.

_This document was last edited on the date the screenshot was taken._
