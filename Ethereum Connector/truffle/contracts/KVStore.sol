pragma solidity ^0.8.9;

contract KVStore {
    address private _owner;
    uint constant private MAX_STRING_LENGTH = 10000;
    mapping(string => string) private store;

    event EntryRegistered(string key, string value);

    modifier owner() {
        require(_owner == msg.sender, "Function is restricted to owner of the contract");
        _;
    }

    constructor() {
        _owner = msg.sender;
    }

    function get(string memory _key) public view returns(string memory) {
        return store[_key];
    }

    function set(string memory _key, string memory _value) public owner {
        require(bytes(_key).length <= MAX_STRING_LENGTH && bytes(_value).length <= MAX_STRING_LENGTH);
        store[_key] = _value;
        emit EntryRegistered(_key, _value);
    }
}
