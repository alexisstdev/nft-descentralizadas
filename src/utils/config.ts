import * as dotenv from "dotenv";
import type { EnvConfig } from "../types.js";

dotenv.config();

export function loadConfig(): EnvConfig {
	const config = {
		SEPOLIA_URL: process.env.SEPOLIA_URL,
		SEPOLIA_PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY,
		SEPOLIA_PUBLIC_KEY: process.env.SEPOLIA_PUBLIC_KEY,
		PINATA_API_KEY: process.env.PINATA_API_KEY,
		PINATA_API_SECRET: process.env.PINATA_API_SECRET,
		NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS,
		PUBLIC_KEYS: process.env.PUBLIC_KEYS,
		PRIVATE_KEYS: process.env.PRIVATE_KEYS,
		PAYMENT_CONTRACT_ADDRESS: process.env.PAYMENT_CONTRACT_ADDRESS,
	};

	// Validate required environment variables
	for (const [key, value] of Object.entries(config)) {
		if (!value) {
			throw new Error(`Variable de entorno requerida: ${key}`);
		}
	}

	return config as EnvConfig;
}
