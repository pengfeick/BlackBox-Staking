// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {FHESafeMath} from "@openzeppelin/confidential-contracts/utils/FHESafeMath.sol";

contract METHStaking is SepoliaConfig {
    IERC7984 public immutable methToken;

    mapping(address staker => euint64) private _stakedBalances;
    euint64 private _totalStaked;

    event Staked(address indexed staker, euint64 amount, euint64 balanceAfter);
    event Unstaked(address indexed staker, euint64 amount, euint64 balanceAfter);

    error InvalidTokenAddress();
    error UnauthorizedEncryptedAmount(address caller);

    constructor(address tokenAddress) {
        if (tokenAddress == address(0)) {
            revert InvalidTokenAddress();
        }
        methToken = IERC7984(tokenAddress);
    }

    function token() external view returns (address) {
        return address(methToken);
    }

    function stakedBalanceOf(address account) external view returns (euint64) {
        return _stakedBalances[account];
    }

    function confidentialTotalStaked() external view returns (euint64) {
        return _totalStaked;
    }

    function stake(externalEuint64 encryptedAmount, bytes calldata inputProof) external returns (euint64) {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        return _stake(msg.sender, amount);
    }

    function stake(euint64 amount) external returns (euint64) {
        if (!FHE.isAllowed(amount, msg.sender)) {
            revert UnauthorizedEncryptedAmount(msg.sender);
        }
        return _stake(msg.sender, amount);
    }

    function unstake(externalEuint64 encryptedAmount, bytes calldata inputProof) external returns (euint64) {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        return _unstake(msg.sender, amount);
    }

    function unstake(euint64 amount) external returns (euint64) {
        if (!FHE.isAllowed(amount, msg.sender)) {
            revert UnauthorizedEncryptedAmount(msg.sender);
        }
        return _unstake(msg.sender, amount);
    }

    function _stake(address staker, euint64 amount) internal returns (euint64 transferred) {
        if (FHE.isInitialized(amount)) {
            FHE.allowTransient(amount, address(methToken));
        }
        transferred = methToken.confidentialTransferFrom(staker, address(this), amount);
        return _applyIncrease(staker, transferred);
    }

    function _unstake(address staker, euint64 amount) internal returns (euint64 transferred) {
        euint64 currentStake = _stakedBalances[staker];
        (ebool canDecrease, euint64 updatedStake) = FHESafeMath.tryDecrease(currentStake, amount);
        euint64 appliedAmount = FHE.select(canDecrease, amount, FHE.asEuint64(0));

        FHE.allowThis(updatedStake);
        FHE.allow(updatedStake, staker);
        _stakedBalances[staker] = updatedStake;

        _decreaseTotal(appliedAmount, staker);

        if (FHE.isInitialized(appliedAmount)) {
            FHE.allowTransient(appliedAmount, address(methToken));
        }
        transferred = methToken.confidentialTransfer(staker, appliedAmount);

        emit Unstaked(staker, transferred, updatedStake);
    }

    function _applyIncrease(address staker, euint64 amount) internal returns (euint64) {
        if (!FHE.isInitialized(amount)) {
            return amount;
        }

        euint64 currentStake = _stakedBalances[staker];
        (, euint64 updatedStake) = FHESafeMath.tryIncrease(currentStake, amount);
        FHE.allowThis(updatedStake);
        FHE.allow(updatedStake, staker);
        _stakedBalances[staker] = updatedStake;

        _increaseTotal(amount, staker);

        emit Staked(staker, amount, updatedStake);
        return amount;
    }

    function _increaseTotal(euint64 amount, address actor) internal {
        (, euint64 updatedTotal) = FHESafeMath.tryIncrease(_totalStaked, amount);
        FHE.allowThis(updatedTotal);
        if (actor != address(0)) {
            FHE.allow(updatedTotal, actor);
        }
        _totalStaked = updatedTotal;
    }

    function _decreaseTotal(euint64 amount, address actor) internal {
        (, euint64 updatedTotal) = FHESafeMath.tryDecrease(_totalStaked, amount);
        FHE.allowThis(updatedTotal);
        if (actor != address(0)) {
            FHE.allow(updatedTotal, actor);
        }
        _totalStaked = updatedTotal;
    }
}
