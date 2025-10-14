import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaymentsModule", (m) => {
	const payments = m.contract("Payments");

	return { payments };
});
