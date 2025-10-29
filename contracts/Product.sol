pragma solidity ^0.8.0;

contract ProductContract {
    address[] public owners;
    mapping(address => bool) public isOwner;

    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool active;
    }

    uint public nextProductId;
    mapping(uint => Product) public products;
    mapping(address => uint[]) public purchases;

    address[] public payees;
    mapping(address => uint) public shares;
    uint256 public totalShares;

    uint256 private _status;

    modifier nonReentrant() {
        require(_status != 2, "Reentrancy Guard:Reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    event Deposit(address indexed sender, uint amount);
    event PaymentReleased(address indexed payee, uint amount);
    event ProductAdded(uint id, string name, uint price, address seller);
    event ProductPurchased(uint id, address buyer, uint price);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    constructor(
        address[] memory _owners,
        address[] memory _payees,
        uint256[] memory _shares
    ) {
        _status = 1;
        require(_owners.length > 0, "Must have owners");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid Address");
            require(!isOwner[owner], "Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }

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

    function addProduct(string memory _name, uint _price) external onlyOwner {
        require(_price > 0, "El precio debe ser mayor a 0");
        uint productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            name: _name,
            price: _price,
            seller: msg.sender,
            active: true
        });
        emit ProductAdded(productId, _name, _price, msg.sender);
    }

    function buyProduct(uint _productId) external payable nonReentrant {
        Product storage product = products[_productId];
        require(product.active, "Producto no disponible");
        require(msg.value == product.price, "Monto incorrecto");

        emit Deposit(msg.sender, msg.value);

        purchases[msg.sender].push(_productId);
        emit ProductPurchased(_productId, msg.sender, product.price);
    }

    function editProduct(
        uint _productId,
        string memory _name,
        uint _price,
        bool _active
    ) external onlyOwner {
        require(_productId < nextProductId, "Producto no existe");
        require(_price > 0, "El precio debe ser mayor a 0");

        Product storage product = products[_productId];
        product.name = _name;
        product.price = _price;
        product.active = _active;

        emit ProductAdded(_productId, _name, _price, msg.sender);
    }

    function releasePayments(
        uint256[] memory _percentages
    ) external nonReentrant {
        require(
            _percentages.length == payees.length,
            "Percentages length mismatch"
        );

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");

        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to release");

        for (uint256 i = 0; i < payees.length; i++) {
            address payee = payees[i];
            uint256 payment = (contractBalance * _percentages[i]) / 100;

            if (payment > 0) {
                (bool success, ) = payee.call{value: payment}("");
                require(success, "Payment failed");
                emit PaymentReleased(payee, payment);
            }
        }
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](nextProductId);
        for (uint i = 0; i < nextProductId; i++) {
            all[i] = products[i];
        }
        return all;
    }

    function getUserPurchases(
        address _user
    ) external view returns (uint[] memory) {
        return purchases[_user];
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
