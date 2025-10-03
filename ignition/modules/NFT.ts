import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTModule", (m) => {
	const nft = m.contract("NFT");

	// Remove the mint call since we'll do it manually after deployment
	// The mintNFT function requires an address parameter which should be set at runtime

	return { nft };
});
