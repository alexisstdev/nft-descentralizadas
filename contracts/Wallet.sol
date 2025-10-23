//SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract MultiSignPaymentWallet {
    address[] public owners;
    uint public requiredApprovals;
    mapping(address => bool) public isOwner;

    struct Transaction {
        address to;
        uint amount;
        uint approvalCount;
        bool executed;
    }

    struct Approval {
        address approver;
        uint256 timestamp;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approvals;
    mapping(uint => Approval[]) public transactionApprovals;
    mapping(uint => mapping(address => uint256)) public approvalTimestamps;
    //ContratoPagos
    address[] public payees;
    mapping(address => uint) public shares;
    uint256 public totalShares;
    //---------------
    uint256 private _status;

    modifier nonReentrant() {
        require(_status != 2, "Reentrancy Guard:Reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    event Deposit(address indexed sender, uint amount);

    event TransactionSubmitted(
        uint indexed txId,
        address indexed to,
        uint amount
    );

    event TransactionRevoked(uint indexed txId, address owner);

    event TransactionApproved(uint indexed txId, address owner);

    event TransactionExecuted(
        uint indexed txId,
        address indexed to,
        uint amount
    );

    event PaymentReleased(address indexed payee, uint amount);

    modifier onlyOwner() {
        require(isOwner[msg.sender]);
        _;
    }

    constructor(
        address[] memory _owners,
        uint _requiredApprovals,
        address[] memory _payees,
        uint256[] memory _shares
    ) {
        _status = 1;
        require(_owners.length > 0, "Must have owners");
        require(
            _requiredApprovals > 0 && _requiredApprovals <= _owners.length,
            "Invalid Approvals"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid Address");
            require(!isOwner[owner], "Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredApprovals = _requiredApprovals;

        //ContratoPagos
        require(_payees.length == _shares.length, "Length mismatch");
        require(_payees.length > 0, "No payees");
        for (uint i = 0; i < _payees.length; i++) {
            require(_payees[i] != address(0), "invalid address");
            require(_shares[i] > 0, "shares must be>0");
            payees.push(_payees[i]);
            shares[_payees[i]] = _shares[i];
            totalShares += _shares[i];
        }
    }

    function deposit() public payable {
        require(msg.value > 0, "Debes mandar ether");
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address _to, uint amount) external onlyOwner {
        require(_to != address(0), "Invalid Address");
        require(amount > 0, "Invalid Amount");
        require(amount <= address(this).balance, "Insufficient balance");
        transactions.push(
            Transaction({
                to: _to,
                amount: amount,
                approvalCount: 0,
                executed: false
            })
        );
        emit TransactionSubmitted(transactions.length - 1, _to, amount);
    }

    function approveTransaction(uint txId) external onlyOwner {
        require(txId < transactions.length, "Invalid transaction ID");
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "Tx already executed");
        require(!approvals[txId][msg.sender], "Tx already approved by caller");

        approvals[txId][msg.sender] = true;
        transaction.approvalCount += 1;

        // Track approval with timestamp
        transactionApprovals[txId].push(
            Approval({approver: msg.sender, timestamp: block.timestamp})
        );
        approvalTimestamps[txId][msg.sender] = block.timestamp;

        emit TransactionApproved(txId, msg.sender);
    }

    function revokeApproval(uint txId) external onlyOwner {
        require(txId < transactions.length, "Invalid transaction ID");
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "Tx already executed");
        require(approvals[txId][msg.sender], "Tx not approved by caller");

        approvals[txId][msg.sender] = false;
        transaction.approvalCount -= 1;
        emit TransactionRevoked(txId, msg.sender);
    }

    function executeTransaction(uint txId) external onlyOwner nonReentrant {
        require(txId < transactions.length, "Invalid transaction ID");
        Transaction storage transaction = transactions[txId];
        require(
            transaction.approvalCount >= requiredApprovals,
            "Not enough approvals"
        );
        require(!transaction.executed, "Tx already executed");
        require(
            transaction.amount <= address(this).balance,
            "Insufficient balance"
        );
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.amount}("");
        require(success, "Tx failed");
        emit TransactionExecuted(txId, transaction.to, transaction.amount);
    }

    function releasePayments() external nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to release");
        for (uint256 i = 0; i < payees.length; i++) {
            address payee = payees[i];
            uint256 payment = (contractBalance * shares[payee]) / totalShares;

            if (payment > 0) {
                (bool success, ) = payee.call{value: payment}("");
                require(success, "Payment failed");
                emit PaymentReleased(payee, payment);
            }
        }
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }

    function getTransactionApprovers(
        uint txId
    ) external view returns (Approval[] memory) {
        require(txId < transactions.length, "Invalid transaction ID");
        return transactionApprovals[txId];
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
