// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HospitalManagement
 * @dev Smart contract for managing hospital beds and blood units on blockchain
 */
contract HospitalManagement {
    address public owner;
    
    // Blood Unit Structure
    struct BloodUnit {
        string bloodUnitId;
        string bloodGroup;
        uint256 quantity;
        string hospitalId;
        uint256 timestamp;
        bool exists;
    }
    
    // Bed Status Structure
    struct BedStatus {
        string bedId;
        string hospitalId;
        bool isAvailable;
        uint256 timestamp;
        bool exists;
    }
    
    // Transaction Record
    struct TransactionRecord {
        string entityId;
        string entityType; // "blood" or "bed"
        string action;
        uint256 timestamp;
        string dataHash;
    }
    
    // Mappings
    mapping(string => BloodUnit) public bloodUnits;
    mapping(string => BedStatus) public bedStatuses;
    mapping(string => TransactionRecord[]) public entityHistory;
    
    // Arrays to track all entities
    string[] public allBloodUnitIds;
    string[] public allBedIds;
    
    // Events
    event BloodUnitRecorded(
        string indexed bloodUnitId,
        string bloodGroup,
        uint256 quantity,
        string hospitalId,
        uint256 timestamp
    );
    
    event BedStatusUpdated(
        string indexed bedId,
        string hospitalId,
        bool isAvailable,
        uint256 timestamp
    );
    
    event TransactionLogged(
        string indexed entityId,
        string entityType,
        string action,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Record a new blood unit or update existing
     */
    function recordBloodUnit(
        string memory _bloodUnitId,
        string memory _bloodGroup,
        uint256 _quantity,
        string memory _hospitalId
    ) public returns (bool) {
        BloodUnit storage unit = bloodUnits[_bloodUnitId];
        
        string memory action = unit.exists ? "updated" : "added";
        
        if (!unit.exists) {
            allBloodUnitIds.push(_bloodUnitId);
        }
        
        unit.bloodUnitId = _bloodUnitId;
        unit.bloodGroup = _bloodGroup;
        unit.quantity = _quantity;
        unit.hospitalId = _hospitalId;
        unit.timestamp = block.timestamp;
        unit.exists = true;
        
        // Record transaction
        string memory dataHash = generateHash(_bloodUnitId, _bloodGroup, _quantity);
        entityHistory[_bloodUnitId].push(TransactionRecord({
            entityId: _bloodUnitId,
            entityType: "blood",
            action: action,
            timestamp: block.timestamp,
            dataHash: dataHash
        }));
        
        emit BloodUnitRecorded(_bloodUnitId, _bloodGroup, _quantity, _hospitalId, block.timestamp);
        emit TransactionLogged(_bloodUnitId, "blood", action, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Update bed status
     */
    function updateBedStatus(
        string memory _bedId,
        string memory _hospitalId,
        bool _isAvailable
    ) public returns (bool) {
        BedStatus storage bed = bedStatuses[_bedId];
        
        string memory action = bed.exists ? "updated" : "created";
        
        if (!bed.exists) {
            allBedIds.push(_bedId);
        }
        
        bed.bedId = _bedId;
        bed.hospitalId = _hospitalId;
        bed.isAvailable = _isAvailable;
        bed.timestamp = block.timestamp;
        bed.exists = true;
        
        // Record transaction
        string memory availableStr = _isAvailable ? "available" : "occupied";
        entityHistory[_bedId].push(TransactionRecord({
            entityId: _bedId,
            entityType: "bed",
            action: availableStr,
            timestamp: block.timestamp,
            dataHash: availableStr
        }));
        
        emit BedStatusUpdated(_bedId, _hospitalId, _isAvailable, block.timestamp);
        emit TransactionLogged(_bedId, "bed", action, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Get blood unit details
     */
    function getBloodUnit(string memory _bloodUnitId) public view returns (
        string memory bloodGroup,
        uint256 quantity,
        string memory hospitalId,
        uint256 timestamp,
        bool exists
    ) {
        BloodUnit memory unit = bloodUnits[_bloodUnitId];
        return (
            unit.bloodGroup,
            unit.quantity,
            unit.hospitalId,
            unit.timestamp,
            unit.exists
        );
    }
    
    /**
     * @dev Get bed status details
     */
    function getBedStatus(string memory _bedId) public view returns (
        string memory hospitalId,
        bool isAvailable,
        uint256 timestamp,
        bool exists
    ) {
        BedStatus memory bed = bedStatuses[_bedId];
        return (
            bed.hospitalId,
            bed.isAvailable,
            bed.timestamp,
            bed.exists
        );
    }
    
    /**
     * @dev Get transaction history for an entity
     */
    function getEntityHistoryCount(string memory _entityId) public view returns (uint256) {
        return entityHistory[_entityId].length;
    }
    
    /**
     * @dev Get specific transaction from history
     */
    function getEntityTransaction(string memory _entityId, uint256 _index) public view returns (
        string memory entityType,
        string memory action,
        uint256 timestamp,
        string memory dataHash
    ) {
        require(_index < entityHistory[_entityId].length, "Index out of bounds");
        TransactionRecord memory record = entityHistory[_entityId][_index];
        return (
            record.entityType,
            record.action,
            record.timestamp,
            record.dataHash
        );
    }
    
    /**
     * @dev Get all blood unit IDs
     */
    function getAllBloodUnitIds() public view returns (string[] memory) {
        return allBloodUnitIds;
    }
    
    /**
     * @dev Get all bed IDs
     */
    function getAllBedIds() public view returns (string[] memory) {
        return allBedIds;
    }
    
    /**
     * @dev Get total counts
     */
    function getCounts() public view returns (uint256 bloodUnitsCount, uint256 bedsCount) {
        return (allBloodUnitIds.length, allBedIds.length);
    }
    
    /**
     * @dev Generate a simple hash (for demo purposes)
     */
    function generateHash(
        string memory _id,
        string memory _group,
        uint256 _quantity
    ) internal pure returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_id, _group, _quantity));
        return toHexString(hash);
    }
    
    /**
     * @dev Convert bytes32 to hex string
     */
    function toHexString(bytes32 _bytes) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i*2] = hexChars[uint8(_bytes[i] >> 4)];
            str[i*2+1] = hexChars[uint8(_bytes[i] & 0x0f)];
        }
        return string(str);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
