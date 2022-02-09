pragma solidity ^0.5.0;

contract Adoption {
    // index represents the petId
    address[16] public adopters;

    function adopt(uint petId) public returns (uint) {
        // make sure petId is in range of our adopters array
        require(petId >= 0 && petId <= 15);

        adopters[petId] = msg.sender;

        return petId;
    }

    // "view" keyword indicates a read-only function
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }
}