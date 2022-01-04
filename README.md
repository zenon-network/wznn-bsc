# BEP-20 Wrapped ZNN

BEP-20 wZNN and two-way bridge between Alphanet - Network of Momentum Phase 0 and Binance Smart Chain.

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/zenon-network/wznn-bsc.git
cd wznn-bsc
npm install
```

Now you need to compile the contracts:

```sh
npx hardhat compile
```

Next, run Hardhat's testing network:

```sh
npx hardhat node
```

Then, on a new terminal, go to the repository's root folder and run this to deploy the contracts:

```sh
npx hardhat run scripts/deploy.js --network localhost
```

To run the tests, use:

```sh
npx hardhat test
```

## Contributing
Please check CONTRIBUTING for more details.

## License
The MIT License (MIT). Please check LICENSE for more information.
