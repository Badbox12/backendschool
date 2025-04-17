import { randomBytes, pbkdf2, createHash } from "node:crypto";

/**
 * Hash a password using SHA-256 with a unique salt
 * @param password - The plaintext password to hash
 * @returns An object containing the hashed password and the salt
 */

// Hash the password using PBKDF2
export const hashPassword = async (
  password: string
): Promise<{ hash: string; salt: string }> => {
  const salt = randomBytes(16).toString("hex"); // Generate a random salt
  const iterations = 1000; // Must match in both hashing and comparison
  const keyLength = 64; // Must match in both hashing and comparison
  const digest = "sha256"; // Algorithm used for hashing

  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, iterations, keyLength, digest, (error, derivedKey) => {
      if (error) {
        return reject(error);
      }
      return resolve({ hash: derivedKey.toString("hex"), salt });
    });
  });
};

/**
 * Compare a plaintext password with the stored hash and salt
 * @param password - The plaintext password
 * @param salt - The salt used to hash the stored password
 * @param hash - The stored hashed password
 * @returns A boolean indicating if the password matches
 */

export const comparePassword = async (
  password: string,
  salt: string,
  hash: string
): Promise<boolean> => {
  try {
    // console.log("=== DEBUGGING PASSWORD COMPARISON ===");
    // console.log("Input password:", password);
    // console.log("Stored salt:", salt);
    // console.log("Stored hash:", hash);

    const derivedKey = await new Promise<Buffer>((resolve, reject) =>
      pbkdf2(password, salt, 1000, 64, "sha256", (err, derivedKey) =>
        err ? reject(err) : resolve(derivedKey)
      )
    );

    //console.log("Derived hash from input:", derivedKey.toString("hex"));

    const isMatch = hash === derivedKey.toString("hex");
    //console.log("Passwords match:", isMatch);

    return isMatch;
  } catch (error) {
    console.error("Error during password comparison:", error);
    return false;
  }
};

export const debugRehash = async (
  password: string,
  storedSalt: string,
  storedHash: string
): Promise<void> => {
  console.log("=== DEBUGGING RE-HASH ===");
  console.log("Input password:", password);
  console.log("Stored salt:", storedSalt);
  console.log("Stored hash:", storedHash);

  const derivedKey = await new Promise<Buffer>((resolve, reject) =>
    pbkdf2(password, storedSalt, 1000, 64, "sha256", (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey)
    )
  );

  const derivedHash = derivedKey.toString("hex");
  // console.log("Re-hashed password:", derivedHash);

  if (derivedHash === storedHash) {
    console.log("Re-hashed password matches the stored hash!");
  } else {
    console.error("Re-hashed password does NOT match the stored hash.");
  }
};


/**
 * Create an MD5 hash of a string (for non-secure operations)
 * @param text - The input string
 * @returns The MD5 hash of the input
 */
export function md5hash(text: string): string {
    return createHash("md5").update(text).digest("hex");
  }

