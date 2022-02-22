module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      from: "0xfd273512b777bf047fe7f94dc11b271f7bc346f3"
     }
  },

  compilers: {
    solc: {
      version: "0.8.9"
    }
  }
};
