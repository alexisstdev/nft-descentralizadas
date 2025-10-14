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
