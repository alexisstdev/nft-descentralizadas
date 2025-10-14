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

	async getBalance(address: string): Promise<bigint> {
		const balance = await this.publicClient.readContract({
			address: paymentsContractAddress,
			abi: this.abi,
			functionName: "getBalance",
			args: [address],
		});

		const formatedEther = Number(balance) / 1e18;

		console.log("Balance:", formatedEther);

		return balance as bigint;
	}

	async release(to: string, amount: string): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: paymentsContractAddress,
			abi: this.abi,
			functionName: "release",
			args: [to, parseEther(amount)],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		return hash;
	}
}
