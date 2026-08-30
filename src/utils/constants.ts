import { type ProviderInterface, RpcProvider } from "starknet";

// ─── Example config — swap these for your own token / pool / helper ─────────

// DEMO VALUE: the ERC-20 this starter shields. Replace with the token your app
// moves privately (STRK on Starknet here).
export const addrSTRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export type GhostModeNetwork = "sepolia" | "mainnet";

// Sepolia is the safe default. Mainnet can only be selected by an explicit env
// change and still remains disabled until its own gate and seller are configured.
export const GhostModeTargetNetwork: GhostModeNetwork =
    process.env.NEXT_PUBLIC_GHOSTMODE_NETWORK === "mainnet" ? "mainnet" : "sepolia";
export const GhostModeGateSepolia =
  process.env.NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA ??
  "0x047eecea2ea640de0c583a501fd001d639cd9bce5f0dc5cee7be6c95f048d71c";
export const GhostModeSellerSepolia = process.env.NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA ?? "0x0";
export const GhostModeGateMainnet = process.env.NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET ?? "0x0";
export const GhostModeSellerMainnet = process.env.NEXT_PUBLIC_GHOSTMODE_SELLER_MAINNET ?? "0x0";

export const GhostModeGate = GhostModeTargetNetwork === "mainnet"
    ? GhostModeGateMainnet
    : GhostModeGateSepolia;
export const GhostModeSeller = GhostModeTargetNetwork === "mainnet"
    ? GhostModeSellerMainnet
    : GhostModeSellerSepolia;
export const GhostModeChainId = GhostModeTargetNetwork === "mainnet" ? "SN_MAIN" : "SN_SEPOLIA";
export const GhostModeProviderIndex = GhostModeTargetNetwork === "mainnet" ? 0 : 2;
export const GhostModeExplorerBaseUrl = GhostModeTargetNetwork === "mainnet"
    ? "https://voyager.online"
    : "https://sepolia.voyager.online";
export const GhostModePoolAddress = process.env.NEXT_PUBLIC_PRIVACY_POOL_ADDRESS ?? (GhostModeTargetNetwork === "mainnet"
    ? "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a"
    : "0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91");

// Frontend RPC providers, indexed. The STRK20 privacy pool lives on Mainnet (0)
// and Sepolia (2); index 1 is a spare public testnet endpoint. NEXT_PUBLIC_ALCHEMY_KEY
// is your Alchemy key (see .env.example).
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
const mainnetRpcUrl = process.env.NEXT_PUBLIC_STARKNET_MAINNET_RPC_URL
    ?? (alchemyKey ? `https://starknet-mainnet.g.alchemy.com/v2/${alchemyKey}` : "https://api.cartridge.gg/x/starknet/mainnet");
const sepoliaRpcUrl = process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC_URL
    ?? (alchemyKey ? `https://starknet-sepolia.g.alchemy.com/v2/${alchemyKey}` : "https://api.cartridge.gg/x/starknet/sepolia");

export const myFrontendProviders: ProviderInterface[] = [
    new RpcProvider({ nodeUrl: mainnetRpcUrl }),
    new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_7" }),
    new RpcProvider({ nodeUrl: sepoliaRpcUrl })];

// ─── Example anonymizer (echo helper) ───────────────────────────────────────
// DEMO CONTRACT: StrkInvokeHelper (cairo/src/lib.cairo) just round-trips STRK
// through an open note to exercise the privacy_invoke flow end to end. Replace
// with your real anonymizer that performs an actual protocol action.

// DEMO VALUE: echo helper deployed on Mainnet.
export const Strk20EchoHelperAddress = "0x78ae662e0cc6d1ab2cfeaf2a51ba8783d88e31886f88a794d142f95a6f8735b";

// Echo helper on Sepolia — set NEXT_PUBLIC_STRK20_ECHO_HELPER_SEPOLIA to enable the
// Echo action there. "0x0" = not deployed (the action stays disabled). Deploy a fresh
// instance from the Echo tab, then paste the address into .env.local.
export const Strk20EchoHelperSepolia = process.env.NEXT_PUBLIC_STRK20_ECHO_HELPER_SEPOLIA ?? "0x0";

// Declared class hash of the echo helper (Mainnet + Sepolia). Deploying a fresh
// instance (no constructor args) needs only this class hash + a signed UDC deploy.
// See cairo/address.md.
export const Strk20EchoHelperClassHash = "0x2a4482a13cb7f70dce6f7ba99c4ee6ce404379abeddd9b831b6bf24eb71e137";

// Resolve the echo helper for a frontend provider index (0 = Mainnet, 2 = Sepolia).
// Returns "0x0" when no helper is deployed on that network.
export function echoHelperForIndex(index: number): string {
    if (index === 0) return Strk20EchoHelperAddress;
    if (index === 2) return Strk20EchoHelperSepolia;
    return "0x0";
}

// Frontend provider indices where the STRK20 privacy pool is available, mapped to a
// display name. Used to gate the WalletAccountV6 STRK20 actions.
export const Strk20Networks: Record<number, string> = { 0: "MAINNET", 2: "SEPOLIA" };
