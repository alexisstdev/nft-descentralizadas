export interface NFTMetadata {
	name: string;
	description: string;
	image: string;
	attributes?: Array<{
		trait_type: string;
		value: string;
	}>;
}

export interface PinataResponse {
	IpfsHash: string;
}

export interface MintResult {
	hash: `0x${string}`;
	tokenId: number;
}

export interface EnvConfig {
	SEPOLIA_URL: string;
	SEPOLIA_PRIVATE_KEY: string;
	SEPOLIA_PUBLIC_KEY: string;
	PINATA_API_KEY: string;
	PINATA_API_SECRET: string;
	NFT_CONTRACT_ADDRESS: string;
}
