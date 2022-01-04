// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Bridge is Context, Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    event Redeemed(address indexed to, uint256 amount, uint256 nonce);
    event Swapped(address indexed from, string to, uint256 amount);

    IERC20 private wZNN;
    mapping(uint256 => bool) private usedNonce;

    constructor(address tokenAddress) {
        wZNN = IERC20(tokenAddress);
    }

    function redeem(address to, uint256 amount, uint256 nonce, bytes memory signature) external {
        require(usedNonce[nonce] == false, "redeem: Nonce already used");
        usedNonce[nonce] = true;

        bytes32 messageHash = keccak256(abi.encode(to, amount, nonce, block.chainid));
        messageHash = messageHash.toEthSignedMessageHash();
        address signer = messageHash.recover(signature);
        require(signer == owner(), "redeem: Wrong signature");

        wZNN.safeTransfer(to, amount);
        emit Redeemed(to, amount, nonce);
    }

    function swap(uint256 amount, string memory to) external {
        require(amount > 0, "swap: Amount cannot be 0");
        
        wZNN.safeTransferFrom(_msgSender(), address(this), amount);
    
        bytes memory payload = abi.encodeWithSignature("burn(uint256)", amount);
        (bool success, ) = address(wZNN).call(payload);
        require(success, "swap: Burn call failed");
        
        emit Swapped(_msgSender(), to, amount);
    }
}