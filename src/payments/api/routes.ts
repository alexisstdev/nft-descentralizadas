import { Router, type Request, type Response } from "express";
import { PaymentsContract } from "./controller.js";
import { loadConfig } from "../../utils/config.js";

const router = Router();
const config = loadConfig();

const paymentsContract = new PaymentsContract(
	config.SEPOLIA_PRIVATE_KEY,
	config.SEPOLIA_URL,
);

router.post("/deposit", async (req: Request, res: Response) => {
	try {
		const { amount } = req.body;

		if (!amount) {
			res.status(400).json({ error: "Amount is required" });
			return;
		}

		const hash = await paymentsContract.deposit(amount);
		res.json({ success: true, hash });
	} catch (error) {
		console.error("Deposit error:", error);
		res.status(500).json({ error: "Failed to deposit" });
	}
});

router.get("/balance", async (req: Request, res: Response) => {
	try {
		const balance = await paymentsContract.getBalance();
		const formattedBalance = Number(balance) / 1e18;

		res.json({
			success: true,
			balance: balance.toString(),
			balanceEth: formattedBalance,
		});
	} catch (error) {
		console.error("Get balance error:", error);
		res.status(500).json({ error: "Failed to get balance" });
	}
});

router.get("/account-balance/:address", async (req: Request, res: Response) => {
	try {
		const { address } = req.params;

		if (!address) {
			res.status(400).json({ error: "Address is required" });
			return;
		}

		const balance = await paymentsContract.getAccountBalance(address);
		const formattedBalance = Number(balance) / 1e18;

		res.json({
			success: true,
			address,
			balance: balance.toString(),
			balanceEth: formattedBalance,
		});
	} catch (error) {
		console.error("Get account balance error:", error);
		res.status(500).json({ error: "Failed to get account balance" });
	}
});

router.post("/release", async (req: Request, res: Response) => {
	try {
		const { account1, account2 } = req.body;

		if (!account1 || !account2) {
			res.status(400).json({ error: "account1 and account2 are required" });
			return;
		}

		const hash = await paymentsContract.release(account1, account2);
		res.json({ success: true, hash });
	} catch (error) {
		console.error("Release error:", error);
		res.status(500).json({ error: "Failed to release funds" });
	}
});

export default router;
