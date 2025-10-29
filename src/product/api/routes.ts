import { Router, type Request, type Response } from "express";
import { ProductContract } from "./controller.js";
import { loadConfig } from "../../utils/config.js";

const router = Router();
const config = loadConfig();

const productContract = new ProductContract(
	config.SEPOLIA_PRIVATE_KEY,
	config.SEPOLIA_URL,
);

router.post("/products", async (req: Request, res: Response) => {
	try {
		const { name, price } = req.body;

		if (!name || !price) {
			res.status(400).json({
				success: false,
				message: "name and price are required",
			});
			return;
		}

		const hash = await productContract.addProduct({ name, price });
		res.json({ success: true, message: "Product added successfully", hash });
	} catch (error) {
		console.error("Add product error:", error);
		res.status(500).json({
			success: false,
			message: error instanceof Error ? error.message : "Failed to add product",
		});
	}
});

router.post("/products/:productId/buy", async (req: Request, res: Response) => {
	try {
		const { productId } = req.params;
		const { price } = req.body;
		const id = Number.parseInt(productId, 10);

		if (Number.isNaN(id)) {
			res.status(400).json({
				success: false,
				message: "Invalid product ID",
			});
			return;
		}

		if (!price) {
			res.status(400).json({
				success: false,
				message: "price is required",
			});
			return;
		}

		const hash = await productContract.buyProduct({ productId: id, price });
		res.json({
			success: true,
			message: "Product purchased successfully",
			hash,
		});
	} catch (error) {
		console.error("Buy product error:", error);
		res.status(500).json({
			success: false,
			message: error instanceof Error ? error.message : "Failed to buy product",
		});
	}
});

router.patch("/products/:productId", async (req: Request, res: Response) => {
	try {
		const { productId } = req.params;
		const { name, price, active } = req.body;
		const id = Number.parseInt(productId, 10);

		if (Number.isNaN(id)) {
			res.status(400).json({
				success: false,
				message: "Invalid product ID",
			});
			return;
		}

		if (!name || !price || active === undefined) {
			res.status(400).json({
				success: false,
				message: "name, price, and active are required",
			});
			return;
		}

		const hash = await productContract.editProduct({
			productId: id,
			name,
			price,
			active,
		});
		res.json({
			success: true,
			message: "Product updated successfully",
			hash,
		});
	} catch (error) {
		console.error("Edit product error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to edit product",
		});
	}
});

router.get("/products", async (req: Request, res: Response) => {
	try {
		const products = await productContract.getAllProducts();
		res.json({ success: true, products });
	} catch (error) {
		console.error("Get products error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to get products",
		});
	}
});

router.get("/purchases/:userAddress", async (req: Request, res: Response) => {
	try {
		const { userAddress } = req.params;

		if (!userAddress) {
			res.status(400).json({
				success: false,
				message: "User address is required",
			});
			return;
		}

		const purchases = await productContract.getUserPurchases(userAddress);
		res.json({ success: true, purchases });
	} catch (error) {
		console.error("Get purchases error:", error);
		res.status(500).json({
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to get purchases",
		});
	}
});

router.get("/balance", async (req: Request, res: Response) => {
	try {
		const balance = await productContract.getBalance();
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

router.post("/release", async (req: Request, res: Response) => {
	try {
		const { percentages } = req.body;

		if (!percentages || !Array.isArray(percentages)) {
			res.status(400).json({
				success: false,
				message: "percentages array is required",
			});
			return;
		}

		const total = percentages.reduce((sum, p) => sum + p, 0);
		if (total !== 100) {
			res.status(400).json({
				success: false,
				message: "Percentages must sum to 100",
			});
			return;
		}

		const hash = await productContract.releasePayments({ percentages });

		res.json({
			success: true,
			message: `Payments released with custom split: ${percentages.join("%, ")}%`,
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

export default router;
