import { loadConfig } from "../../utils/config.js";
import fs from "node:fs";
import {
	createWalletClient,
	createPublicClient,
	http,
	type Abi,
	type WalletClient,
	type PublicClient,
	type Chain,
	type Transport,
	type Account,
	parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const config = loadConfig();

const productContractAddress = config.PRODUCT_CONTRACT_ADDRESS as `0x${string}`;

interface FormattedProduct {
	id: number;
	name: string;
	price: string;
	seller: string;
	active: boolean;
	priceEth: number;
}

export class ProductContract {
	private readonly abi: Abi;
	private readonly walletClient: WalletClient<Transport, Chain, Account>;
	private readonly publicClient: PublicClient<Transport, Chain>;

	constructor(
		private readonly privateKey: string,
		private readonly rpcUrl: string,
	) {
		const contractArtifact = JSON.parse(
			fs.readFileSync(
				"./artifacts/contracts/Product.sol/ProductContract.json",
				"utf8",
			),
		);
		this.abi = contractArtifact.abi;

		const account = privateKeyToAccount(`0x${privateKey}`);

		this.walletClient = createWalletClient({
			account,
			chain: sepolia,
			transport: http(rpcUrl),
		});

		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http(rpcUrl),
		});
	}

	async addProduct({
		name,
		price,
	}: { name: string; price: string }): Promise<string> {
		const parsedPrice = parseEther(price);

		const hash = await this.walletClient.writeContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "addProduct",
			args: [name, parsedPrice],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Product "${name}" added with price ${price} ETH`);
		return hash;
	}

	async buyProduct({
		productId,
		price,
	}: {
		productId: number;
		price: string;
	}): Promise<string> {
		const parsedPrice = parseEther(price);

		const hash = await this.walletClient.writeContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "buyProduct",
			args: [BigInt(productId)],
			value: parsedPrice,
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Product ${productId} purchased for ${price} ETH`);
		return hash;
	}

	async disableProduct({ productId }: { productId: number }): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "disableProduct",
			args: [BigInt(productId)],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Product ${productId} disabled`);
		return hash;
	}

	async getAllProducts(): Promise<FormattedProduct[]> {
		const products = await this.publicClient.readContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "getAllProducts",
		});

		console.log("Retrieved products:", products);

		const formattedProducts = (products as unknown[]).map(
			(product: {
				id: bigint;
				name: string;
				price: bigint;
				seller: string;
				active: boolean;
			}) => ({
				id: Number(product.id),
				name: product.name,
				price: product.price.toString(),
				seller: product.seller,
				active: product.active,
				priceEth: Number(product.price) / 1e18,
			}),
		);

		return formattedProducts;
	}

	async getUserPurchases(userAddress: string): Promise<number[]> {
		const purchases = await this.publicClient.readContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "getUserPurchases",
			args: [userAddress as `0x${string}`],
		});

		console.log(`Retrieved purchases for ${userAddress}:`, purchases);

		return (purchases as bigint[]).map((id) => Number(id));
	}

	async getBalance(): Promise<bigint> {
		const balance = await this.publicClient.readContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "getBalance",
		});

		const formattedEther = Number(balance) / 1e18;
		console.log("Product Contract Balance:", formattedEther, "ETH");

		return balance as bigint;
	}

	async releasePayments(): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: productContractAddress,
			abi: this.abi,
			functionName: "releasePayments",
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log("Payments released to all payees");
		return hash;
	}
}
