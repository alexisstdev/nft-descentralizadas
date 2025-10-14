import fs from "node:fs";
import { PinataService } from "./pinata.service.js";
import { NFTContract } from "./nft-contract.service.js";
import { loadConfig } from "../utils/config.js";

const config = loadConfig();

const pinata = new PinataService(
	config.PINATA_API_KEY,
	config.PINATA_API_SECRET,
);
const contract = new NFTContract(
	config.NFT_CONTRACT_ADDRESS as `0x${string}`,
	config.SEPOLIA_PRIVATE_KEY,
	config.SEPOLIA_URL,
);

const imagePath = "./assets/4.png";

if (!fs.existsSync(imagePath)) {
	throw new Error(`Imagen no encontrada: ${imagePath}`);
}

const imageUrl = await pinata.uploadImage(imagePath);

const metadata = {
	name: "Mapaches",
	description: "NFTs de mapaches",
	image: imageUrl,
	attributes: [],
};

const metadataUrl = await pinata.uploadMetadata(metadata);

const result = await contract.mint(
	"0xEbC61C48e516440272B076EdBd7671978F4dF210",
	metadataUrl,
);

console.log(`Hash: ${result.hash}`);
console.log(`Token ID: ${result.tokenId}`);
