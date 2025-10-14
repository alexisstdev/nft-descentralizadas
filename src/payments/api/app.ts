import express, { type Express } from "express";
import paymentsRoutes from "./routes.js";

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", paymentsRoutes);

// health
app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
