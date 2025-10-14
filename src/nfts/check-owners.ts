import { loadConfig } from "../utils/config.js";
import { NFTContract } from "./nft-contract.service.js";

const config = loadConfig();

const contract = new NFTContract(
	config.NFT_CONTRACT_ADDRESS as `0x${string}`,
	config.SEPOLIA_PRIVATE_KEY,
	config.SEPOLIA_URL,
);

// Direcciones de los equipos
const equipos = {
	"Equipo 1": "0x59427DE366B815334d95267cE7968846Aa5Aa200",
	"Equipo 2": "0x3bB94F092f247A37DA1832D802Ae2CC2cA8d4526",
	"Equipo 3": "0x045a046325ff2FCf8BE3f1B77DC87626348C5e89",
	"Equipo 4": "0xEbC61C48e516440272B076EdBd7671978F4dF210",
	"Equipo 5": "0xB32A8EBb8a5c0A77feA3f82186E6aaB48A93215B",
	"Equipo 6": "0x6ad244d1b6bbA6f2F4Ee1A8598e0c1BE6fdBcFA5",
	"Equipo 7": "0x2bc6e60CD93EeF266469273BDE09203f6565eFB3",
	"Equipo 8": "0x014A2e8E64d883Bb93A35f6e6E26c3d92c1e6e40",
	"Equipo 9": "0x0e3EDA76178363fcA64bD4129FDEF278ee2fa195",
};

// Invertir el mapeo para buscar por dirección
const direccionAEquipo = Object.fromEntries(
	Object.entries(equipos).map(([equipo, direccion]) => [
		direccion.toLowerCase(),
		equipo,
	]),
);

async function checkTokenOwners() {
	console.log("🔍 Consultando propietarios de tokens NFT (1-20)...\n");

	const resultados: { [equipo: string]: number[] } = {};
	const tokensNoAsignados: number[] = [];

	for (let tokenId = 1; tokenId <= 20; tokenId++) {
		try {
			const owner = await contract.ownerOf(tokenId);
			const ownerLower = owner.toLowerCase();

			const equipo = direccionAEquipo[ownerLower];

			if (equipo) {
				if (!resultados[equipo]) {
					resultados[equipo] = [];
				}
				resultados[equipo].push(tokenId);
				console.log(`✅ Token ${tokenId}: ${equipo} (${owner})`);
			} else {
				console.log(`❓ Token ${tokenId}: Dirección desconocida (${owner})`);
				tokensNoAsignados.push(tokenId);
			}
		} catch (error) {
			console.log(`❌ Token ${tokenId}: No existe o error al consultar`);
			tokensNoAsignados.push(tokenId);
		}
	}

	console.log(`\n${"=".repeat(50)}`);
	console.log("📊 RESUMEN POR EQUIPOS:");
	console.log("=".repeat(50));

	// Mostrar resultados por equipo
	for (const [equipo, direccion] of Object.entries(equipos)) {
		const tokens = resultados[equipo] || [];
		console.log(
			`${equipo}: ${tokens.length > 0 ? tokens.join(", ") : "Sin tokens"}`,
		);
		console.log(`   Dirección: ${direccion}`);
		console.log("");
	}

	if (tokensNoAsignados.length > 0) {
		console.log(
			`🔍 Tokens sin asignar o con error: ${tokensNoAsignados.join(", ")}`,
		);
	}

	console.log("\n📈 Total de tokens consultados: 20");
	console.log(
		`✅ Tokens asignados a equipos: ${20 - tokensNoAsignados.length}`,
	);
	console.log(`❓ Tokens no asignados: ${tokensNoAsignados.length}`);
}

checkTokenOwners().catch(console.error);
