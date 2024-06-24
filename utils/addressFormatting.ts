import { ethers } from "ethers";
const { Keyring } = require('@polkadot/keyring');

// converts a string to a byte32 string
export const stringToByte32 = (str: string) => {
    return ethers.utils.keccak256(str);
}

function uint8ArrayToByte32String(uint8Array: Uint8Array) {
    // Ensure the input is Uint8Array
    if (!(uint8Array instanceof Uint8Array)) {
        throw new Error('Input must be a Uint8Array');
    }

    // Create a hex string from the Uint8Array
    let hexString = '';
    for (const byte of uint8Array as any) {
        hexString += byte.toString(16).padStart(2, '0');
    }

    // Ensure the hex string is 64 characters long
    if (hexString.length !== 64) {
        throw new Error('Input must be 32 bytes long');
    }

    return '0x' + hexString;
}

// converts a substrate address to a public key
export const substrateAddressToPublicKey = (address: string) => {
    const accountId = address;

    // Instantiate a keyring
    const keyring = new Keyring({ type: 'sr25519' });

    // Add account using the account ID
    const pair = keyring.addFromAddress(accountId);
    const publicKeyByte8Array = pair.publicKey

    // Get the public address
    const publicKeyByte32String = uint8ArrayToByte32String(publicKeyByte8Array);

    return publicKeyByte32String;
}
