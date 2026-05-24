import type { VaultFile } from '../types';
import type { VaultIpfsPayload } from './ipfs';

const ECDH_CURVE = 'P-256';
const FILE_ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_WRAP_INFO = 'aegis-protocol-vault-content-key';

export type JsonWebKeyPair = {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
};

export type EncryptedVaultFile = {
  index: number;
  ivBase64: string;
  ciphertextBase64: string;
};

type ClearVaultFilePackage = {
  name: string;
  type: string;
  size: string;
  bytes: number;
  dataBase64: string;
};

export type HybridEncryptionEnvelope = {
  scheme: 'ecdh-p256-aes-gcm-v1';
  ephemeralPublicKey: JsonWebKey;
  saltBase64: string;
  wrappedKeyIvBase64: string;
  wrappedContentKeyBase64: string;
};

export type DecryptedVaultFile = {
  name: string;
  type: string;
  bytes: number;
  blob: Blob;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importHeirPublicKey(publicKey: JsonWebKey) {
  return crypto.subtle.importKey(
    'jwk',
    publicKey,
    { name: 'ECDH', namedCurve: ECDH_CURVE },
    false,
    [],
  );
}

async function importHeirPrivateKey(privateKey: JsonWebKey) {
  return crypto.subtle.importKey(
    'jwk',
    privateKey,
    { name: 'ECDH', namedCurve: ECDH_CURVE },
    false,
    ['deriveBits'],
  );
}

async function deriveWrappingKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: Uint8Array,
) {
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256,
  );

  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(new TextEncoder().encode(KEY_WRAP_INFO)),
    },
    hkdfKey,
    { name: FILE_ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function importContentKey(rawKey: ArrayBuffer) {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: FILE_ENCRYPTION_ALGORITHM },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function generateHeirEncryptionKeyPair(): Promise<JsonWebKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: ECDH_CURVE,
    },
    true,
    ['deriveBits'],
  );

  return {
    publicKey: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
    privateKey: await crypto.subtle.exportKey('jwk', keyPair.privateKey),
  };
}

export function parseEncryptionPublicKey(value: string): JsonWebKey {
  try {
    const key = JSON.parse(value) as JsonWebKey;

    if (key.kty !== 'EC' || key.crv !== ECDH_CURVE || !key.x || !key.y) {
      throw new Error('Expected an ECDH P-256 public key JWK.');
    }

    if (key.d) {
      throw new Error('This looks like a private key. Share only the public encryption key.');
    }

    return key;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Invalid public encryption key JSON.');
  }
}

export function parseEncryptionPrivateKey(value: string): JsonWebKey {
  try {
    const key = JSON.parse(value) as JsonWebKey;

    if (key.kty !== 'EC' || key.crv !== ECDH_CURVE || !key.d || !key.x || !key.y) {
      throw new Error('Expected an ECDH P-256 private key JWK.');
    }

    return key;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Invalid private encryption key JSON.');
  }
}

export async function encryptVaultFilesForHeir(
  files: VaultFile[],
  heirPublicKeyJwk: JsonWebKey,
) {
  const heirPublicKey = await importHeirPublicKey(heirPublicKeyJwk);
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: ECDH_CURVE,
    },
    true,
    ['deriveBits'],
  );
  const salt = randomBytes(16);
  const wrappingKey = await deriveWrappingKey(
    ephemeralKeyPair.privateKey,
    heirPublicKey,
    salt,
  );
  const contentKey = await crypto.subtle.generateKey(
    { name: FILE_ENCRYPTION_ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const rawContentKey = await crypto.subtle.exportKey('raw', contentKey);
  const wrappedKeyIv = randomBytes(12);
  const wrappedContentKey = await crypto.subtle.encrypt(
    { name: FILE_ENCRYPTION_ALGORITHM, iv: wrappedKeyIv },
    wrappingKey,
    rawContentKey,
  );
  const encryptedFiles = await Promise.all(
    files.map(async (item, index): Promise<EncryptedVaultFile> => {
      if (!item.source) {
        throw new Error(`Missing source file for ${item.name}`);
      }

      const clearFileBytes = await item.source.arrayBuffer();
      const clearPackage: ClearVaultFilePackage = {
        name: item.name,
        type: item.type || 'application/octet-stream',
        size: item.size,
        bytes: item.bytes ?? item.source.size,
        dataBase64: bytesToBase64(new Uint8Array(clearFileBytes)),
      };
      const iv = randomBytes(12);
      const ciphertext = await crypto.subtle.encrypt(
        { name: FILE_ENCRYPTION_ALGORITHM, iv },
        contentKey,
        new TextEncoder().encode(JSON.stringify(clearPackage)),
      );

      return {
        index,
        ivBase64: bytesToBase64(iv),
        ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
      };
    }),
  );

  return {
    envelope: {
      scheme: 'ecdh-p256-aes-gcm-v1',
      ephemeralPublicKey: await crypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey),
      saltBase64: bytesToBase64(salt),
      wrappedKeyIvBase64: bytesToBase64(wrappedKeyIv),
      wrappedContentKeyBase64: bytesToBase64(new Uint8Array(wrappedContentKey)),
    } satisfies HybridEncryptionEnvelope,
    files: encryptedFiles,
  };
}

export async function decryptVaultPayloadWithPrivateKey(
  payload: VaultIpfsPayload,
  privateKeyJwk: JsonWebKey,
): Promise<DecryptedVaultFile[]> {
  if (payload.encryption !== 'ecdh-p256-aes-gcm-v1') {
    throw new Error('This payload is not encrypted with the current Aegis hybrid encryption scheme.');
  }

  if (!payload.envelope) {
    throw new Error('Missing encryption envelope in IPFS payload.');
  }

  const privateKey = await importHeirPrivateKey(privateKeyJwk);
  const ephemeralPublicKey = await importHeirPublicKey(payload.envelope.ephemeralPublicKey);
  const wrappingKey = await deriveWrappingKey(
    privateKey,
    ephemeralPublicKey,
    base64ToBytes(payload.envelope.saltBase64),
  );
  const rawContentKey = await crypto.subtle.decrypt(
    {
      name: FILE_ENCRYPTION_ALGORITHM,
      iv: base64ToBytes(payload.envelope.wrappedKeyIvBase64),
    },
    wrappingKey,
    base64ToBytes(payload.envelope.wrappedContentKeyBase64),
  );
  const contentKey = await importContentKey(rawContentKey);

  return Promise.all(
    payload.files.map(async (file) => {
      const clearBytes = await crypto.subtle.decrypt(
        {
          name: FILE_ENCRYPTION_ALGORITHM,
          iv: base64ToBytes(file.ivBase64),
        },
        contentKey,
        base64ToBytes(file.ciphertextBase64),
      );
      const clearFile = JSON.parse(
        new TextDecoder().decode(clearBytes),
      ) as ClearVaultFilePackage;
      const fileBytes = base64ToBytes(clearFile.dataBase64);

      return {
        name: clearFile.name,
        type: clearFile.type,
        bytes: clearFile.bytes,
        blob: new Blob([toArrayBuffer(fileBytes)], { type: clearFile.type }),
      };
    }),
  );
}
