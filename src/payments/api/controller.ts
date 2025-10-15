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

const paymentsContractAddress =
	config.PAYMENT_CONTRACT_ADDRESS as `0x${string}`;

export class PaymentsContract {
	private readonly abi: Abi;
	private readonly walletClient: WalletClient<Transport, Chain, Account>;
	private readonly publicClient: PublicClient<Transport, Chain>;

	constructor(
		private readonly privateKey: string,
		private readonly rpcUrl: string,
	) {
		const contractArtifact = JSON.parse(
			fs.readFileSync(
				"./artifacts/contracts/Payments.sol/Payments.json",
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

	async deposit(amount: string): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: paymentsContractAddress,
			abi: this.abi,
			functionName: "deposit",
			value: parseEther(amount),
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		return hash;
	}

	async getBalance(): Promise<bigint> {
		const balance = await this.publicClient.readContract({
			address: paymentsContractAddress,
			abi: this.abi,
			functionName: "getBalance",
		});

		const formatedEther = Number(balance) / 1e18;

		console.log("Contract Balance:", formatedEther, "ETH");

		return balance as bigint;
	}

	async getAccountBalance(address: string): Promise<bigint> {
		const balance = await this.publicClient.getBalance({
			address: address as `0x${string}`,
		});

		const formattedEther = Number(balance) / 1e18;
		console.log(`Account ${address} balance:`, formattedEther, "ETH");

		return balance;
	}

	async release(account1: string, account2: string): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: paymentsContractAddress,
			abi: this.abi,
			functionName: "release",
			args: [account1 as `0x${string}`, account2 as `0x${string}`],
			chain: sepolia,
		});

		console.log("Release tx hash:", hash);

		console.log("Release tx details:", {
			account1: "Account 1 80%",
			account2: "Account 2 20%",
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		return hash;
	}
}
