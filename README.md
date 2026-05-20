# Aegis Protocol - Heritage Numerique Decentralise

Aegis Protocol est une DApp d'heritage numerique decentralise. L'application permet a un testateur de creer un coffre-fort numerique chiffre, stocke hors chaine sur IPFS, puis controle par un smart contract Solidity. Si le testateur reste inactif au-dela d'un delai defini, l'heritier designe peut revendiquer l'acces au coffre.

Ce document sert de feuille de route complete pour finaliser le frontend React/Vite existant et implementer le backend blockchain avec Hardhat.

## 1. Objectif Fonctionnel

Le projet doit couvrir deux espaces principaux.

### Espace Testateur

- Connexion wallet avec MetaMask ou autre wallet compatible EVM.
- Creation d'un vault avec adresse de l'heritier, delai d'inactivite et document ou texte sensible.
- Chiffrement local des donnees avant tout upload.
- Upload du contenu chiffre sur IPFS via Pinata.
- Enregistrement on-chain du CID IPFS, de l'heritier et du delai.
- Bouton `Ping` pour prouver que le testateur est toujours actif.
- Modification de l'heritier avec re-chiffrement obligatoire des donnees.
- Revocation complete du vault.
- Verrouillage irreversible pour empecher les modifications futures.

### Espace Heritier

- Connexion wallet.
- Liste des vaults ou l'adresse connectee est heritiere.
- Affichage du temps restant avant de pouvoir revendiquer.
- Bouton `Claim` active uniquement apres expiration du delai.
- Recuperation du CID IPFS apres claim.
- Telechargement du fichier chiffre depuis IPFS.
- Dechiffrement local cote navigateur.

## 2. Stack Technique

### Frontend Actuel

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Framer Motion

### Backend Blockchain A Ajouter

- Hardhat
- Solidity
- OpenZeppelin
- Viem ou Ethers via Hardhat Toolbox
- Tests TypeScript

### Web3 Frontend A Ajouter

- Wagmi
- Viem
- TanStack Query

### Stockage Et Chiffrement

- Pinata pour IPFS
- Web Crypto API pour chiffrement AES-GCM
- Strategie de cle publique pour l'heritier

## 3. Architecture Cible

Structure recommandee du projet :

```txt
My-Heritage/
  contracts/
    AegisVault.sol

  scripts/
    deploy.ts
    export-abi.ts

  test/
    AegisVault.test.ts

  ignition/
    modules/
      AegisVault.ts

  src/
    App.tsx

    contracts/
      AegisVault.json
      addresses.ts

    web3/
      config.ts
      chains.ts
      contracts.ts

    services/
      aegisContract.ts
      pinata.ts

    crypto/
      encryption.ts
      keyManagement.ts

    hooks/
      useWallet.tsx
      useVaults.tsx
      useClaims.ts
      useToast.tsx

    pages/
      Dashboard.tsx
      CreateVault.tsx
      Vaults.tsx
      HeirInbox.tsx
      ActivityExplorer.tsx
      Security.tsx
      Settings.tsx

  hardhat.config.ts
  .env
  .env.example
```

## 4. Installation Des Dependances

Installer Hardhat et les outils Solidity :

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

Installer les dependances Web3 frontend :

```bash
npm install wagmi viem @tanstack/react-query
```

Installer les dependances utiles pour IPFS :

```bash
npm install axios
```

Initialiser Hardhat :

```bash
npx hardhat init
```

Choisir :

```txt
Create a TypeScript project
```

## 5. Configuration Des Variables D'Environnement

Creer un fichier `.env` a la racine :

```env
# Blockchain locale
VITE_LOCAL_CHAIN_ID=31337
VITE_AEGIS_VAULT_ADDRESS_LOCAL=

# Sepolia
SEPOLIA_RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
VITE_AEGIS_VAULT_ADDRESS_SEPOLIA=

# Pinata
VITE_PINATA_JWT=
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

Creer aussi `.env.example` sans secrets :

```env
VITE_LOCAL_CHAIN_ID=31337
VITE_AEGIS_VAULT_ADDRESS_LOCAL=
SEPOLIA_RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
VITE_AEGIS_VAULT_ADDRESS_SEPOLIA=
VITE_PINATA_JWT=
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

Important : pour un MVP academique, `VITE_PINATA_JWT` dans le frontend est acceptable. Pour une vraie production, il faut un petit backend API pour cacher le token Pinata.

## 6. Smart Contract A Implementer

Fichier :

```txt
contracts/AegisVault.sol
```

### Structure Principale

```solidity
struct Vault {
    uint256 id;
    address owner;
    address heir;
    string ipfsCid;
    uint256 lastPing;
    uint256 inactivityDelay;
    bool revoked;
    bool claimed;
    bool locked;
}
```

### Fonctions Requises

```solidity
function createVault(address heir, string calldata ipfsCid, uint256 inactivityDelay) external;
function ping(uint256 vaultId) external;
function updateHeir(uint256 vaultId, address newHeir, string calldata newIpfsCid) external;
function updateCid(uint256 vaultId, string calldata newIpfsCid) external;
function revokeVault(uint256 vaultId) external;
function lockVault(uint256 vaultId) external;
function claimVault(uint256 vaultId) external;
function getVault(uint256 vaultId) external view returns (Vault memory);
function getOwnerVaults(address owner) external view returns (uint256[] memory);
function getHeirVaults(address heir) external view returns (uint256[] memory);
function isClaimable(uint256 vaultId) external view returns (bool);
```

### Events Requis

```solidity
event VaultCreated(uint256 indexed vaultId, address indexed owner, address indexed heir);
event PingExecuted(uint256 indexed vaultId, uint256 timestamp);
event VaultClaimed(uint256 indexed vaultId, address indexed heir);
event VaultRevoked(uint256 indexed vaultId);
event VaultHeirUpdated(uint256 indexed vaultId, address indexed oldHeir, address indexed newHeir);
event VaultCidUpdated(uint256 indexed vaultId);
event VaultLocked(uint256 indexed vaultId);
```

### Regles De Securite

- Le proprietaire seul peut ping, modifier, verrouiller ou revoquer.
- L'heritier seul peut claim.
- Un vault revoque ne peut plus etre claim.
- Un vault deja claim ne peut plus etre modifie.
- Un vault verrouille ne peut plus changer d'heritier.
- L'heritier ne doit pas etre `address(0)`.
- L'heritier ne doit pas etre le proprietaire.
- `claimVault` doit verifier :

```solidity
require(block.timestamp > vault.lastPing + vault.inactivityDelay, "Owner still active");
```

Utiliser OpenZeppelin :

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```

## 7. Tests Hardhat A Ecrire

Fichier :

```txt
test/AegisVault.test.ts
```

Tests minimum :

- Creation d'un vault valide.
- Rejet si l'heritier est `address(0)`.
- Rejet si l'heritier est egal au proprietaire.
- `ping` fonctionne pour le proprietaire.
- `ping` echoue pour un autre wallet.
- `claimVault` echoue avant expiration.
- `claimVault` fonctionne apres expiration.
- `revokeVault` bloque le claim.
- `updateHeir` fonctionne si le vault n'est pas verrouille.
- `updateHeir` echoue apres `lockVault`.
- `updateCid` fonctionne pour le proprietaire.
- Les events sont emis correctement.

Exemple de manipulation du temps :

```ts
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

await time.increase(30 * 24 * 60 * 60 + 1);
```

Lancer les tests :

```bash
npx hardhat test
```

## 8. Configuration Hardhat

Fichier :

```txt
hardhat.config.ts
```

Configuration cible :

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
```

Installer `dotenv` si necessaire :

```bash
npm install --save-dev dotenv
```

## 9. Deploiement Local

Lancer une blockchain locale :

```bash
npx hardhat node
```

Dans un deuxieme terminal :

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Apres le deploiement, copier l'adresse du contrat dans :

```txt
src/contracts/addresses.ts
```

Exemple :

```ts
export const AEGIS_VAULT_ADDRESSES = {
  localhost: "0x...",
  sepolia: "0x...",
} as const;
```

## 10. Export ABI Pour Le Frontend

Le frontend doit connaitre l'ABI du contrat.

Creer :

```txt
scripts/export-abi.ts
```

Objectif :

- Lire l'artifact Hardhat.
- Copier l'ABI dans `src/contracts/AegisVault.json`.

Commande :

```bash
npx hardhat compile
node scripts/export-abi.ts
```

Alternative simple au debut :

- Copier manuellement `artifacts/contracts/AegisVault.sol/AegisVault.json`.
- Garder uniquement l'ABI ou importer directement le JSON complet.

## 11. Configuration Wagmi Et Viem

Creer :

```txt
src/web3/config.ts
```

Responsabilites :

- Declarer les chains supportees.
- Configurer Wagmi.
- Activer MetaMask/injected wallet.
- Fournir `WagmiProvider` et `QueryClientProvider` dans `main.tsx` ou `App.tsx`.

Chains a supporter :

- `localhost` pour Hardhat.
- `sepolia` pour testnet.

Pages impactees :

- `src/hooks/useWallet.tsx`
- `src/App.tsx`
- `src/components/navigation/TopHeader.tsx`

## 12. Service Smart Contract Frontend

Creer :

```txt
src/services/aegisContract.ts
```

Fonctions a exposer :

```ts
createVault(heir: Address, cid: string, delay: bigint)
pingVault(vaultId: bigint)
claimVault(vaultId: bigint)
revokeVault(vaultId: bigint)
lockVault(vaultId: bigint)
updateHeir(vaultId: bigint, newHeir: Address, newCid: string)
updateCid(vaultId: bigint, newCid: string)
getOwnerVaults(owner: Address)
getHeirVaults(heir: Address)
getVault(vaultId: bigint)
isClaimable(vaultId: bigint)
```

Le service doit utiliser :

- `readContract` pour les lectures.
- `writeContract` pour les transactions.
- `waitForTransactionReceipt` pour attendre la confirmation.

## 13. Integration Des Pages Frontend

### `CreateVault.tsx`

A implementer :

- Saisie adresse heritier.
- Selection du delai : 30 jours, 6 mois, 1 an, ou personnalise.
- Upload fichier ou saisie texte.
- Chiffrement local.
- Upload IPFS.
- Transaction `createVault`.
- Toast succes/erreur.
- Redirection vers `Vaults`.

Ordre MVP :

1. Creer vault avec CID fake.
2. Ajouter upload IPFS.
3. Ajouter chiffrement.

### `Vaults.tsx`

A implementer :

- Recuperer les vaults du proprietaire connecte.
- Afficher : heritier, CID, dernier ping, delai, statut.
- Bouton `Ping`.
- Bouton `Revoquer`.
- Bouton `Verrouiller`.
- Bouton `Modifier heritier`.

### `HeirInbox.tsx`

A implementer :

- Recuperer les vaults ou l'utilisateur connecte est heritier.
- Afficher compte a rebours.
- Desactiver `Claim` si le delai n'est pas expire.
- Appeler `claimVault`.
- Apres claim, telecharger le contenu depuis IPFS.
- Dechiffrer et permettre le telechargement du document.

### `Dashboard.tsx`

A implementer :

- Nombre de vaults actifs.
- Nombre de vaults expires.
- Date du prochain vault a ping.
- Resume activite recente.

### `ActivityExplorer.tsx`

A implementer :

- Lire les events du contrat.
- Afficher l'historique :
  - vault cree
  - ping effectue
  - vault claim
  - revocation
  - modification heritier

## 14. IPFS Avec Pinata

Creer :

```txt
src/services/pinata.ts
```

Fonctions :

```ts
uploadEncryptedFile(file: Blob): Promise<string>
downloadEncryptedFile(cid: string): Promise<Blob>
```

Upload :

- Construire un `FormData`.
- Ajouter le fichier chiffre.
- Envoyer a l'API Pinata.
- Recuperer `IpfsHash`.

Download :

- Construire l'URL avec `VITE_PINATA_GATEWAY`.
- Recuperer le blob.

## 15. Chiffrement Local

Creer :

```txt
src/crypto/encryption.ts
src/crypto/keyManagement.ts
```

### Strategie MVP Recommandee

Pour faciliter l'integration :

- Generer une cle AES-GCM dans le navigateur.
- Chiffrer le document avec AES-GCM.
- Exporter un payload JSON contenant :
  - le contenu chiffre
  - l'IV
  - les metadonnees
  - la cle AES chiffree ou protegee selon la strategie retenue

### Probleme Important

Une adresse Ethereum n'est pas automatiquement une cle publique de chiffrement exploitable dans tous les wallets. Il faut choisir une strategie.

Options :

1. MVP simple : l'heritier cree/import une cle publique de chiffrement dans l'application.
2. MetaMask avance : utiliser `eth_getEncryptionPublicKey` et `eth_decrypt`.
3. Version production : utiliser un protocole dedie comme Lit Protocol ou threshold encryption.

Pour ton projet, commencer par l'option 1 est le plus stable.

## 16. Ordre D'Integration Recommande

Suivre cet ordre pour eviter les blocages :

- Etape 1 : installer Hardhat.
- Etape 2 : creer `AegisVault.sol`.
- Etape 3 : ecrire les tests unitaires.
- Etape 4 : faire passer tous les tests.
- Etape 5 : deployer sur Hardhat local.
- Etape 6 : exporter ABI + adresse vers `src/contracts`.
- Etape 7 : installer Wagmi/Viem.
- Etape 8 : connecter MetaMask au frontend.
- Etape 9 : afficher adresse, reseau et solde.
- Etape 10 : brancher `createVault` avec CID fake.
- Etape 11 : brancher `getOwnerVaults`.
- Etape 12 : brancher `ping`.
- Etape 13 : brancher `getHeirVaults`.
- Etape 14 : brancher `claim`.
- Etape 15 : ajouter `revokeVault`.
- Etape 16 : ajouter `lockVault`.
- Etape 17 : ajouter `updateHeir`.
- Etape 18 : ajouter Pinata.
- Etape 19 : ajouter chiffrement local.
- Etape 20 : remplacer CID fake par CID IPFS reel.
- Etape 21 : ajouter telechargement IPFS cote heritier.
- Etape 22 : ajouter dechiffrement cote heritier.
- Etape 23 : deployer sur Sepolia.
- Etape 24 : verifier le contrat sur Etherscan.
- Etape 25 : finaliser README, captures et demo.

## 17. Definition Du MVP

Le MVP doit contenir :

- Connexion wallet.
- Creation d'un vault.
- Stockage d'un CID dans le smart contract.
- Liste des vaults du testateur.
- Ping du vault.
- Liste des vaults de l'heritier.
- Claim apres expiration.
- Upload IPFS chiffre.
- Recuperation IPFS apres claim.

Ne pas bloquer le MVP sur :

- Multi-heritiers.
- Notifications email.
- Audit professionnel.
- Backend Pinata securise.
- Threshold encryption.

## 18. Commandes Utiles

Lancer le frontend :

```bash
npm run dev
```

Compiler le frontend :

```bash
npm run build
```

Linter :

```bash
npm run lint
```

Compiler les contrats :

```bash
npx hardhat compile
```

Lancer les tests :

```bash
npx hardhat test
```

Lancer une blockchain locale :

```bash
npx hardhat node
```

Deployer en local :

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Deployer sur Sepolia :

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Verifier sur Etherscan :

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 19. Checklist De Validation

Avant de considerer le projet termine :

- Le frontend build sans erreur.
- Les tests Hardhat passent.
- Le contrat est deploye localement.
- Le frontend lit l'adresse du contrat depuis `addresses.ts`.
- MetaMask peut se connecter.
- Un testateur peut creer un vault.
- Le vault apparait dans son espace.
- Le testateur peut ping.
- L'heritier voit le vault dans son inbox.
- L'heritier ne peut pas claim avant expiration.
- L'heritier peut claim apres expiration.
- Un vault revoque ne peut pas etre claim.
- Un vault verrouille ne peut pas changer d'heritier.
- Le fichier chiffre est bien envoye sur IPFS.
- Le fichier peut etre recupere apres claim.
- Les erreurs utilisateur sont affichees clairement.

## 20. Ameliorations Apres MVP

- Ajouter plusieurs heritiers.
- Ajouter un seuil de recuperation, par exemple 2 heritiers sur 3.
- Ajouter un backend minimal pour securiser Pinata.
- Ajouter des notifications de rappel avant expiration.
- Ajouter un systeme de renouvellement automatique par signature off-chain.
- Ajouter un audit de securite du smart contract.
- Ajouter une interface admin/dev pour inspecter les events.
- Ajouter un support multi-chain.

## 21. Notes De Securite

- Ne jamais envoyer de donnees sensibles en clair a IPFS.
- Ne jamais stocker de cle privee dans le frontend.
- Ne jamais mettre de vraie phrase seed dans l'application.
- Ne jamais deployer avec une private key contenant beaucoup de fonds.
- Tester d'abord sur Hardhat local, puis Sepolia.
- En production, remplacer le token Pinata frontend par un backend securise.
- Documenter clairement que la revocation et le verrouillage ont des effets importants.

## 22. Etat Actuel Du Projet

Le projet contient deja une structure frontend utile :

- `src/pages/CreateVault.tsx`
- `src/pages/Vaults.tsx`
- `src/pages/HeirInbox.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ActivityExplorer.tsx`
- `src/hooks/useWallet.tsx`
- `src/hooks/useVaults.tsx`
- `src/hooks/useClaims.ts`

La prochaine grande etape est d'ajouter Hardhat et de remplacer progressivement les donnees locales ou fictives par des lectures et transactions blockchain reelles.
