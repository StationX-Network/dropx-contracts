// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./ClaimHelper.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @title StationXFactory Emitter Contract
/// @dev Contract Emits events for Factory and Proxy
contract ClaimEmitter is AccessControl, Initializable {
    address private _factoryAddress;
    bytes32 public constant EMITTER = keccak256("EMITTER");

    //FACTORY EVENTS
    event ClaimContractDeployed(
        ClaimSettings claimSettings,
        uint256 totalWallets,
        uint256 blockNumber,
        string whitelistNetwork,
        bytes networkId,
        address claimContract
    );

    //Claim contract events

    event AirdropClaimed(
        address claimContract,
        address user,
        address token,
        uint256 claimedAmount,
        uint256 airdropAmount
    );

    event RollbackTokens(
        address claimContract,
        address rollbackAddress,
        uint256 amount
    );

    event ToggleClaim(address claimContract, bool status);

    event DepositTokens(
        address depositor,
        address claimContract,
        uint256 amount
    );

    event ChangeRoot(address claimContract, bytes32 newRoot);

    event ChangeStartAndEndTime(
        address claimContract,
        uint256 newStartTime,
        uint256 newEndTime
    );

    event ChangeRollbackAddress(address claimContract, address newAddress);

    event ChangeCooldownTime(address claimContract, uint256 coolDownTime);

    event ChangeMaxClaimAmount(
        address claimContract,
        uint256 newMaxClaimAmount
    );

    event DisburseNative(address[] recipients, uint256[] values);

    event DisburseERC20(address token, address[] recipients, uint256[] values);

    modifier onlyFactory() {
        require(msg.sender == _factoryAddress);
        _;
    }

    function initialize(
        address _factory,
        address _disburse
    ) external initializer {
        _factoryAddress = _factory;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMITTER, _disburse);
    }

    function claimContractDeployed(
        ClaimSettings memory _claimSettings,
        uint256 _totalWallets,
        uint256 _blockNumber,
        string calldata _whitelistNetwork,
        bytes calldata _networkId,
        address _claimContract
    ) external onlyFactory {
        _grantRole(EMITTER, _claimContract);
        emit ClaimContractDeployed(
            _claimSettings,
            _totalWallets,
            _blockNumber,
            _whitelistNetwork,
            _networkId,
            _claimContract
        );
    }

    function airdropClaimed(
        address _claimContract,
        address _user,
        address _token,
        uint256 _claimableAmount,
        uint256 _airdropAmount
    ) external onlyRole(EMITTER) {
        emit AirdropClaimed(
            _claimContract,
            _user,
            _token,
            _claimableAmount,
            _airdropAmount
        );
    }

    function rollbackTokens(
        address _claimContract,
        address _rollbackAddress,
        uint256 _amount
    ) external onlyRole(EMITTER) {
        emit RollbackTokens(_claimContract, _rollbackAddress, _amount);
    }

    function depositTokens(
        address _depositor,
        address _claimContract,
        uint256 _amount
    ) external onlyRole(EMITTER) {
        emit DepositTokens(_depositor, _claimContract, _amount);
    }

    function changeRoot(
        address _claimContract,
        bytes32 _newRoot
    ) external onlyRole(EMITTER) {
        emit ChangeRoot(_claimContract, _newRoot);
    }

    function changeStartAndEndTime(
        address _claimContract,
        uint256 _newStartTime,
        uint256 _newEndTime
    ) external onlyRole(EMITTER) {
        emit ChangeStartAndEndTime(_claimContract, _newStartTime, _newEndTime);
    }

    function changeRollbackAddress(
        address _claimContract,
        address _newAddress
    ) external onlyRole(EMITTER) {
        emit ChangeRollbackAddress(_claimContract, _newAddress);
    }

    function changeCooldownTime(
        address _claimContract,
        uint256 _coolDownTime
    ) external onlyRole(EMITTER) {
        emit ChangeCooldownTime(_claimContract, _coolDownTime);
    }

    function toggleClaim(
        address _claimContract,
        bool _status
    ) external onlyRole(EMITTER) {
        emit ToggleClaim(_claimContract, _status);
    }

    function changeMaxClaimAmount(
        address _claimContract,
        uint256 _newMaxClaimAmount
    ) external onlyRole(EMITTER) {
        emit ChangeMaxClaimAmount(_claimContract, _newMaxClaimAmount);
    }

    function disburseNative(
        address[] calldata recipients,
        uint256[] calldata values
    ) external onlyRole(EMITTER) {
        emit DisburseNative(recipients, values);
    }

    function disburseERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata values
    ) external onlyRole(EMITTER) {
        emit DisburseERC20(token, recipients, values);
    }
}
