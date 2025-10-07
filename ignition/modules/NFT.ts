import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTModule", (m) => {
	const nft = m.contract("NFT");

	return { nft };
});
