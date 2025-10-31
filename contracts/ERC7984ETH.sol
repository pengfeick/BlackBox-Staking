// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract ERC7984ETH is ERC7984, SepoliaConfig {
    constructor() ERC7984("mETH", "mETH", "") {}

    function mintFree() public {
        euint64 encryptedAmount = FHE.asEuint64(1*1000000);
        _mint(msg.sender, encryptedAmount);
    }
}
