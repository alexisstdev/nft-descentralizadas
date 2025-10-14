import fs from "node:fs";
import type { PinataService } from "./pinata.service.js";
import type { NFTContract } from "./nft-contract.service.js";
import type { NFTMetadata, MintResult } from "./types.js";

export class NFTService {
	constructor(
		private readonly pinata: PinataService,
		private readonly contract: NFTContract,
		private readonly recipientAddress: string,
	) {}

	async createNFT(
		imagePath: string,
		metadata: Omit<NFTMetadata, "image">,
	): Promise<MintResult> {
		if (!fs.existsSync(imagePath)) {
			throw new Error(`Imagen no encontrada: ${imagePath}`);
		}

		console.log("Iniciando creación del NFT...");

		const imageUrl = await this.pinata.uploadImage(imagePath);

		const fullMetadata: NFTMetadata = { ...metadata, image: imageUrl };
		const metadataUrl = await this.pinata.uploadMetadata(fullMetadata);

		const result = await this.contract.mint(this.recipientAddress, metadataUrl);

		console.log("NFT creado");
		console.log(`Hash: ${result.hash}`);
		console.log(`Token ID: ${result.tokenId}`);

		return result;
	}
}
