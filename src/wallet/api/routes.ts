import { Router, type Request, type Response } from "express";
import { WalletContract } from "./controller.js";
import { loadConfig } from "../../utils/config.js";
import { parseEther } from "viem";

const router = Router();
const config = loadConfig();

const walletContract = new WalletContract(
	config.SEPOLIA_PRIVATE_KEY,
	config.SEPOLIA_URL,
);

router.post("/deposit", async (req: Request, res: Response) => {
	try {
		const { amount } = req.body;
		console.log(req.body);

		if (!amount) {
			res.status(400).json({ success: false, message: "Amount is required" });
			return;
		}

		const hash = await walletContract.deposit({ amount });
		res.json({ success: true, message: "Deposit successful", hash });
	} catch (error) {
		console.error("Deposit error:", error);
		res.status(500).json({
			success: false,
			message: error instanceof Error ? error.message : "Failed to deposit",
		});
	}
});

router.post("/submit", async (req: Request, res: Response) => {
	try {
		const { to, amount } = req.body;

		if (!to || !amount) {
			res.status(400).json({
				success: false,
				message: "to and amount are required",
			});
			return;
		}

		const hash = await walletContract.submitTransaction({ to, amount });
		res.json({ success: true, message: "Transaction submitted", hash });
	} catch (error) {
		console.error("Submit error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to submit transaction",
		});
	}
});

router.post("/approve", async (req: Request, res: Response) => {
	try {
		const { transactionId } = req.body;

		if (transactionId === undefined) {
			res.status(400).json({
				success: false,
				message: "transactionId is required",
			});
			return;
		}

		const hash = await walletContract.approveTransaction({ transactionId });
		res.json({ success: true, message: "Transaction approved", hash });
	} catch (error) {
		console.error("Approve error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to approve transaction",
		});
	}
});

router.post("/execute", async (req: Request, res: Response) => {
	try {
		const { transactionId } = req.body;

		if (transactionId === undefined) {
			res.status(400).json({
				success: false,
				message: "transactionId is required",
			});
			return;
		}

		const hash = await walletContract.executeTransaction({ transactionId });
		res.json({ success: true, message: "Transaction executed", hash });
	} catch (error) {
		console.error("Execute error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to execute transaction",
		});
	}
});

router.post("/release", async (req: Request, res: Response) => {
	try {
		const hash = await walletContract.releasePayments();

		res.json({
			success: true,
			message: "Payments released to all payees",
			hash,
		});
	} catch (error) {
		console.error("Release error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to release payments",
		});
	}
});

router.get("/transactions", async (req: Request, res: Response) => {
	try {
		const transactions = await walletContract.getTransactions();
		res.json({ success: true, transactions });
	} catch (error) {
		console.error("Get transactions error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to get transactions",
		});
	}
});

router.get("/balance", async (req: Request, res: Response) => {
	try {
		const balance = await walletContract.getBalance();
		const formattedBalance = Number(balance) / 1e18;

		res.json({
			success: true,
			balance: balance.toString(),
			balanceEth: formattedBalance,
		});
	} catch (error) {
		console.error("Get balance error:", error);
		res.status(500).json({
			success: false,
			message: error instanceof Error ? error.message : "Failed to get balance",
		});
	}
});

router.get(
	"/transactions/:txId/approvers",
	async (req: Request, res: Response) => {
		try {
			const { txId } = req.params;
			const transactionId = Number.parseInt(txId, 10);

			if (Number.isNaN(transactionId)) {
				res.status(400).json({
					success: false,
					message: "Invalid transaction ID",
				});
				return;
			}

			const approvers =
				await walletContract.getTransactionApprovers(transactionId);
			res.json({
				txId: txId,
				totalApprovals: approvers.length,
				approvals: approvers,
			});
		} catch (error) {
			console.error("Get approvers error:", error);
			res.status(500).json({
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to get approvers",
			});
		}
	},
);

export default router;
