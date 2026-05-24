import type { VaultFile } from '../types';
import { encryptVaultFilesForHeir } from './crypto';
import type { HybridEncryptionEnvelope, EncryptedVaultFile } from './crypto';

const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export type VaultIpfsPayload = {
  version: 1;
  kind: 'aegis-vault-payload';
  encryption: 'ecdh-p256-aes-gcm-v1';
  envelope: HybridEncryptionEnvelope;
  createdAt: string;
  vault: {
    heir: string;
  };
  files: EncryptedVaultFile[];
};

export type UploadVaultPayloadParams = {
  vaultName: string;
  description: string;
  heir: string;
  heirEncryptionPublicKey: JsonWebKey;
  files: VaultFile[];
};

export type UploadVaultPayloadResult = {
  cid: string;
  gatewayUrl: string;
  payload: VaultIpfsPayload;
};

function getPinataJwt() {
  return (import.meta.env.VITE_PINATA_JWT as string | undefined)?.trim();
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return atob(normalized);
}

function assertPinataJwtIsUsable(jwt: string) {
  const segments = jwt.split('.');

  if (segments.length !== 3) {
    throw new Error('VITE_PINATA_JWT is malformed. Generate a fresh Pinata JWT and replace it in My-Heritage/.env.');
  }

  try {
    JSON.parse(decodeBase64Url(segments[0]));
    const payload = JSON.parse(decodeBase64Url(segments[1])) as { exp?: number };

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('VITE_PINATA_JWT is expired. Generate a fresh Pinata JWT and restart the Vite dev server.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('VITE_PINATA_JWT')) {
      throw error;
    }

    throw new Error('VITE_PINATA_JWT is not a valid JWT. Generate a fresh Pinata JWT and replace it in My-Heritage/.env.');
  }
}

function formatFileSize(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function buildPrivateMetadataFile(params: UploadVaultPayloadParams): VaultFile | null {
  const metadata = {
    vaultName: params.vaultName.trim(),
    description: params.description.trim(),
  };

  if (!metadata.vaultName && !metadata.description) {
    return null;
  }

  const source = new File(
    [JSON.stringify(metadata, null, 2)],
    'aegis-vault-metadata.json',
    { type: 'application/json' },
  );

  return {
    name: source.name,
    size: formatFileSize(source.size),
    type: source.type,
    bytes: source.size,
    source,
  };
}

export function getIpfsGatewayUrl(cid: string) {
  const gateway = (import.meta.env.VITE_PINATA_GATEWAY as string | undefined)?.trim() || DEFAULT_GATEWAY;
  return `${gateway.replace(/\/?$/, '/')}${cid}`;
}

async function buildVaultPayload(params: UploadVaultPayloadParams): Promise<VaultIpfsPayload> {
  const privateMetadataFile = buildPrivateMetadataFile(params);
  const filesToEncrypt = privateMetadataFile
    ? [privateMetadataFile, ...params.files]
    : params.files;
  const encrypted = await encryptVaultFilesForHeir(
    filesToEncrypt,
    params.heirEncryptionPublicKey,
  );

  return {
    version: 1,
    kind: 'aegis-vault-payload',
    encryption: 'ecdh-p256-aes-gcm-v1',
    envelope: encrypted.envelope,
    createdAt: new Date().toISOString(),
    vault: {
      heir: params.heir,
    },
    files: encrypted.files,
  };
}

export async function uploadVaultPayloadToIpfs(
  params: UploadVaultPayloadParams,
): Promise<UploadVaultPayloadResult> {
  const jwt = getPinataJwt();

  if (!jwt) {
    throw new Error('Missing VITE_PINATA_JWT. Add it to My-Heritage/.env before uploading to IPFS.');
  }

  assertPinataJwtIsUsable(jwt);

  const payload = await buildVaultPayload(params);
  const payloadBlob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  });
  const formData = new FormData();

  formData.append('file', payloadBlob, 'aegis-vault-payload.json');

  const response = await fetch(PINATA_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Pinata upload failed (${response.status}): ${details}`);
  }

  const result = (await response.json()) as { IpfsHash?: string };
  const cid = result.IpfsHash;

  if (!cid) {
    throw new Error('Pinata did not return an IPFS CID.');
  }

  return {
    cid,
    gatewayUrl: getIpfsGatewayUrl(cid),
    payload,
  };
}

export async function downloadIpfsPayload(cid: string): Promise<VaultIpfsPayload> {
  const response = await fetch(getIpfsGatewayUrl(cid));

  if (!response.ok) {
    throw new Error(`IPFS download failed (${response.status})`);
  }

  return (await response.json()) as VaultIpfsPayload;
}
