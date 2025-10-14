import fs from "node:fs";
import {
	createWalletClient,
	createPublicClient,
	http,
	type Abi,
	type Log,
	type WalletClient,
	type PublicClient,
	type Chain,
	type Transport,
	type Account,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { MintResult } from "./types.js";

export class NFTContract {
	private readonly abi: Abi;
	private readonly walletClient: WalletClient<Transport, Chain, Account>;
	private readonly publicClient: PublicClient<Transport, Chain>;

	constructor(
		private readonly contractAddress: `0x${string}`,
		private readonly privateKey: string,
		private readonly rpcUrl: string,
	) {
		const contractArtifact = JSON.parse(
			fs.readFileSync("./artifacts/contracts/NFT.sol/NFT.json", "utf8"),
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

	async mint(to: string, tokenUri: string): Promise<MintResult> {
		const hash = await this.walletClient.writeContract({
			address: this.contractAddress,
			abi: this.abi,
			functionName: "mintNFT",
			args: [to, tokenUri],
			chain: sepolia,
		});

		console.log("Transacción enviada");

		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

		const transferLog = receipt.logs.find(
			(log: Log) =>
				log.topics[0] ===
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		);

		const tokenId = transferLog
			? Number.parseInt(transferLog.topics[3] || "0", 16)
			: 0;

		console.log(`NFT creado con Token ID: ${tokenId}`);
		return { hash, tokenId };
	}

	async ownerOf(tokenId: number): Promise<string> {
		try {
			const owner = await this.publicClient.readContract({
				address: this.contractAddress,
				abi: this.abi,
				functionName: "ownerOf",
				args: [BigInt(tokenId)],
			});
			return owner as string;
		} catch (error) {
			throw new Error(
				`Error al consultar el propietario del token ${tokenId}: ${error}`,
			);
		}
	}
}
