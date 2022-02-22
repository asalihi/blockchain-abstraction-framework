const KVStore = artifacts.require("KVStore");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(KVStore);
};