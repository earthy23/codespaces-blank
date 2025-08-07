import yauzl from "yauzl";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const openZip = promisify(yauzl.open);

/**
 * Validates that a zip file contains the required structure for an Eaglercraft client
 * Requirements:
 * - Must contain a folder with an index.html file
 * - The index.html should be in a subdirectory (not root)
 * - Must be a valid zip file
 */
export async function validateClientZip(zipPath) {
  try {
    console.log("🔍 Validating client zip:", zipPath);

    // Check if file exists
    try {
      await fs.access(zipPath);
    } catch (error) {
      throw new Error("Zip file not found");
    }

    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          console.error("❌ Failed to open zip file:", err);
          return reject(new Error("Invalid zip file format"));
        }

        let hasIndexHtml = false;
        let clientFolderName = null;
        let entryCount = 0;
        const entries = [];

        zipfile.readEntry();

        zipfile.on("entry", (entry) => {
          entryCount++;
          entries.push(entry.fileName);

          // Check if this is an index.html file in a subdirectory
          if (
            entry.fileName.endsWith("/index.html") ||
            entry.fileName.endsWith("\\index.html")
          ) {
            const pathParts = entry.fileName.split(/[\/\\]/);
            if (pathParts.length >= 2) {
              // Must be in a folder, not root
              hasIndexHtml = true;
              clientFolderName = pathParts[0];
              console.log("✅ Found index.html in folder:", clientFolderName);
            }
          }

          zipfile.readEntry();
        });

        zipfile.on("end", () => {
          console.log(`📦 Zip contains ${entryCount} entries`);

          if (!hasIndexHtml) {
            console.error("❌ No index.html found in a subdirectory");
            console.log("📋 Zip contents:", entries.slice(0, 10)); // Show first 10 entries
            return reject(
              new Error(
                "Zip must contain a folder with an index.html file. Current structure does not meet requirements.",
              ),
            );
          }

          if (entryCount === 0) {
            console.error("❌ Zip file is empty");
            return reject(new Error("Zip file is empty"));
          }

          console.log("✅ Zip validation passed");
          resolve({
            valid: true,
            clientFolderName,
            entryCount,
            hasIndexHtml: true,
          });
        });

        zipfile.on("error", (error) => {
          console.error("❌ Zip processing error:", error);
          reject(new Error("Error processing zip file: " + error.message));
        });
      });
    });
  } catch (error) {
    console.error("❌ Zip validation failed:", error);
    throw new Error(error.message || "Failed to validate zip file");
  }
}

/**
 * Extracts a client zip to a specific directory
 * Returns the path to the extracted client folder
 */
export async function extractClientZip(zipPath, extractPath) {
  try {
    console.log("📦 Extracting client zip to:", extractPath);

    // Ensure extract directory exists
    await fs.mkdir(extractPath, { recursive: true });

    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          return reject(new Error("Failed to open zip file for extraction"));
        }

        let extractedFiles = 0;
        let clientFolderPath = null;

        zipfile.readEntry();

        zipfile.on("entry", (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            const dirPath = path.join(extractPath, entry.fileName);
            fs.mkdir(dirPath, { recursive: true })
              .then(() => {
                zipfile.readEntry();
              })
              .catch(reject);
          } else {
            // File entry
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                return reject(err);
              }

              const filePath = path.join(extractPath, entry.fileName);
              const fileDir = path.dirname(filePath);

              // Ensure directory exists
              fs.mkdir(fileDir, { recursive: true })
                .then(() => {
                  const writeStream = require("fs").createWriteStream(filePath);

                  readStream.pipe(writeStream);

                  writeStream.on("close", () => {
                    extractedFiles++;

                    // Check if this is the index.html to determine client folder
                    if (
                      entry.fileName.endsWith("/index.html") &&
                      !clientFolderPath
                    ) {
                      clientFolderPath = path.join(
                        extractPath,
                        path.dirname(entry.fileName),
                      );
                    }

                    zipfile.readEntry();
                  });

                  writeStream.on("error", reject);
                })
                .catch(reject);
            });
          }
        });

        zipfile.on("end", () => {
          console.log(`✅ Extracted ${extractedFiles} files`);
          resolve({
            extractedFiles,
            clientFolderPath,
            extractPath,
          });
        });

        zipfile.on("error", reject);
      });
    });
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    throw new Error("Failed to extract client zip: " + error.message);
  }
}

/**
 * Gets metadata about the client from the extracted files
 */
export async function getClientMetadata(clientFolderPath) {
  try {
    const indexPath = path.join(clientFolderPath, "index.html");

    // Check if index.html exists
    try {
      await fs.access(indexPath);
    } catch {
      throw new Error("index.html not found in client folder");
    }

    // Read index.html to extract metadata
    const indexContent = await fs.readFile(indexPath, "utf-8");

    // Extract title from HTML
    const titleMatch = indexContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Eaglercraft Client";

    // Look for meta tags
    const versionMatch = indexContent.match(
      /<meta[^>]*name=["']version["'][^>]*content=["']([^"']+)["']/i,
    );
    const version = versionMatch ? versionMatch[1] : "1.8.8";

    const descriptionMatch = indexContent.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    );
    const description = descriptionMatch
      ? descriptionMatch[1]
      : "Minecraft in your browser";

    return {
      title,
      version,
      description,
      hasIndex: true,
      indexPath,
    };
  } catch (error) {
    console.error("Failed to get client metadata:", error);
    return {
      title: "Unknown Client",
      version: "1.8.8",
      description: "Eaglercraft client",
      hasIndex: false,
      error: error.message,
    };
  }
}

export default {
  validateClientZip,
  extractClientZip,
  getClientMetadata,
};
