import { encodeURLSafe } from "@stablelib/base64";

/**
 * Options for creating a JWS string.
 */
export interface StandardClaims {
  /** (issuer): Issuer of the JWT */
  iss?: string;
  /** (subject): Subject of the JWT (the user) */
  sub?: string;
  /**  (audience): Recipient for which the JWT is intended */
  aud?: string;
  /** (expiration time): Time after which the JWT expires */
  exp?: number;
  /**  (not before time): Time before which the JWT must not be accepted for processing */
  nbf?: number;
  /** (issued at time): Time at which the JWT was issued; can be used to determine age of the JWT */
  iat?: number;
}

/**
 * Options for controlling the JWS header.
 */
export interface Header {
  /** (algorithm): Hashing algorithm being used (e.g., HMAC SHA256 or RSA) */
  alg?: string;
  /** (type): Type of token. Default to JWT. */
  typ?: "JWT";
  /** (key id): Unique key identifier https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.4 */
  kid?: string;
}

/**
 * Generic interface for object capable of signing a message.
 */
export interface Signer {
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

// Utilities and constants
const encoder = new TextEncoder();
const encode = encoder.encode.bind(encoder);
const padReg = /=+$/;
const { stringify } = JSON;

/**
 * Create a JWS.
 * @param signer The signer. Any object that satisfies the Signer interface.
 * @param opts Additional options to control the header and payload objects.
 * @returns A Promise that resolves to the full JWS string.
 * @note For ETH-based tokens we borrow ideas from: https://github.com/ethereum/EIPs/issues/1341
 */
export async function createToken(
  signer: Signer,
  header: Header,
  claims: StandardClaims
): Promise<{ token: string; claims: StandardClaims; header: Header }> {
  if (!claims.iss && !header.kid)
    throw new Error("InputError: must include kid header and/or iss claim");
  header = { typ: "JWT", alg: "EdDSA", ...header };
  // Default subject to the issuer
  claims.sub = claims.sub ?? claims.iss ?? header.kid;
  // UNIX origin time for current time
  const iat = ~~(Date.now() / 1000);
  const exp = iat + 60 * 10; // Default to ~10 minutes
  const payload = {
    nbf: iat - 10,
    iat,
    exp,
    ...claims,
  };
  // Optional: https://www.npmjs.com/package/canonicalize
  const encodedHeader = encodeURLSafe(encode(stringify(header))).replace(
    padReg,
    ""
  );
  const encodedPayload = encodeURLSafe(encode(stringify(payload))).replace(
    padReg,
    ""
  );
  const message = encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await signer.signMessage(message);
  const encodedSignature = encodeURLSafe(signature).replace(padReg, "");
  const jws = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  return { token: jws, claims: payload, header };
}
