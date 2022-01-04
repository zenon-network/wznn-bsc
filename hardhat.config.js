require("@nomiclabs/hardhat-waffle");

module.exports = {
    networks: {
        hardhat: {
            loggingEnabled: false
        }
    },
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                }
            },
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            }
        ]

    },
};
