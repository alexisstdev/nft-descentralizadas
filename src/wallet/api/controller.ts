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

const walletContractAddress = config.WALLET_CONTRACT_ADDRESS as `0x${string}`;

interface FormattedTransaction {
	id: number;
	to: string;
	amount: string;
	approvalCount: string;
	executed: boolean;
	amountEth: number;
}

export class WalletContract {
	private readonly abi: Abi;
	private readonly walletClient: WalletClient<Transport, Chain, Account>;
	private readonly publicClient: PublicClient<Transport, Chain>;

	constructor(
		private readonly privateKey: string,
		private readonly rpcUrl: string,
	) {
		const contractArtifact = JSON.parse(
			fs.readFileSync(
				"./artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json",
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

	async deposit({ amount }: { amount: string }): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "deposit",
			value: parseEther(amount),
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Deposited ${amount} ETH to wallet contract`);
		return hash;
	}

	async submitTransaction({
		to,
		amount,
	}: { to: string; amount: string }): Promise<string> {
		const parsedAmount = parseEther(amount);

		const hash = await this.walletClient.writeContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "submitTransaction",
			args: [to as `0x${string}`, parsedAmount],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Transaction submitted: ${amount} ETH to ${to}`);
		return hash;
	}

	async approveTransaction({
		transactionId,
	}: { transactionId: number }): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "approveTransaction",
			args: [BigInt(transactionId)],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Transaction ${transactionId} approved`);
		return hash;
	}

	async executeTransaction({
		transactionId,
	}: { transactionId: number }): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "executeTransaction",
			args: [BigInt(transactionId)],
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log(`Transaction ${transactionId} executed`);
		return hash;
	}

	async releasePayments(): Promise<string> {
		const hash = await this.walletClient.writeContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "releasePayments",
			chain: sepolia,
		});

		await this.publicClient.waitForTransactionReceipt({ hash });
		console.log("Payments released to all payees");
		return hash;
	}

	async getTransactions(): Promise<FormattedTransaction[]> {
		const transactions = await this.publicClient.readContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "getTransactions",
		});

		console.log("Retrieved transactions:", transactions);

		const formattedTransactions = (transactions as unknown[]).map(
			(tx: any, index) => ({
				id: index,
				to: tx.to,
				amount: tx.amount.toString(),
				approvalCount: tx.approvalCount.toString(),
				executed: tx.executed,
				amountEth: Number(tx.amount) / 1e18,
			}),
		);

		return formattedTransactions;
	}

	async getTransactionApprovers(transactionId: number): Promise<any[]> {
		const approvers = await this.publicClient.readContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "getTransactionApprovers",
			args: [BigInt(transactionId)],
		});

		console.log(
			`Retrieved approvers for transaction ${transactionId}:`,
			approvers,
		);

		const formattedApprovers = (approvers as unknown[]).map(
			(approval: any) => ({
				approver: approval.approver,
				timestamp: approval.timestamp.toString(),
				date: new Date(Number(approval.timestamp) * 1000).toISOString(),
			}),
		);

		return formattedApprovers;
	}

	async getBalance(): Promise<bigint> {
		const balance = await this.publicClient.readContract({
			address: walletContractAddress,
			abi: this.abi,
			functionName: "getBalance",
		});

		const formattedEther = Number(balance) / 1e18;
		console.log("Wallet Contract Balance:", formattedEther, "ETH");

		return balance as bigint;
	}
}
