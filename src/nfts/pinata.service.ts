import fs from "node:fs";
import path from "node:path";
import type { NFTMetadata, PinataResponse } from "./types.js";

export class PinataService {
	constructor(
		private readonly apiKey: string,
		private readonly secretKey: string,
	) {}

	async uploadImage(imagePath: string): Promise<string> {
		const buffer = fs.readFileSync(imagePath);
		const formData = new FormData();
		const blob = new Blob([buffer], { type: this.getMimeType(imagePath) });

		formData.append("file", blob, path.basename(imagePath));

		const response = await fetch(
			"https://api.pinata.cloud/pinning/pinFileToIPFS",
			{
				method: "POST",
				headers: {
					pinata_api_key: this.apiKey,
					pinata_secret_api_key: this.secretKey,
				},
				body: formData,
			},
		);

		if (!response.ok) {
			throw new Error(`Error subiendo imagen: ${response.status}`);
		}

		const data = (await response.json()) as PinataResponse;
		const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

		console.log("Imagen subida a IPFS");
		return imageUrl;
	}

	async uploadMetadata(metadata: NFTMetadata): Promise<string> {
		const response = await fetch(
			"https://api.pinata.cloud/pinning/pinJSONToIPFS",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					pinata_api_key: this.apiKey,
					pinata_secret_api_key: this.secretKey,
				},
				body: JSON.stringify({
					pinataContent: metadata,
					pinataMetadata: { name: `${metadata.name} Metadata` },
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Error subiendo metadata: ${response.status}`);
		}

		const data = (await response.json()) as PinataResponse;
		const metadataUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

		console.log("Metadata subida a IPFS");
		return metadataUrl;
	}

	private getMimeType(filePath: string): string {
		const ext = path.extname(filePath).toLowerCase();
		const mimeTypes: Record<string, string> = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".svg": "image/svg+xml",
			".webp": "image/webp",
		};
		return mimeTypes[ext] || "image/jpeg";
	}
}
