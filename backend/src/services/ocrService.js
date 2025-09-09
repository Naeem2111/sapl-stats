const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

/**
 * OCR Service for extracting statistics from screenshots
 */
class OCRService {
	constructor() {
		this.uploadDir = path.join(__dirname, "../../uploads");
		this.processedDir = path.join(__dirname, "../../processed");
		this.ensureDirectories();
	}

	/**
	 * Ensure upload and processed directories exist
	 */
	async ensureDirectories() {
		try {
			await fs.mkdir(this.uploadDir, { recursive: true });
			await fs.mkdir(this.processedDir, { recursive: true });
		} catch (error) {
			console.error("Error creating directories:", error);
		}
	}

	/**
	 * Preprocess image for better OCR accuracy
	 * Focuses on the right half of the image where player stats are typically displayed
	 */
	async preprocessImage(imagePath, cropConfig = {}) {
		try {
			const processedPath = path.join(
				this.processedDir,
				`processed_${Date.now()}.png`
			);

			// Get image metadata to determine dimensions
			const metadata = await sharp(imagePath).metadata();
			const { width, height } = metadata;

			console.log(`Original image dimensions: ${width}x${height}`);

			// Default crop configuration for right half
			const defaultCropConfig = {
				leftRatio: 0.5, // Start from middle of image
				topRatio: 0.0, // Start from top
				widthRatio: 0.5, // Take right half
				heightRatio: 1.0, // Take full height
			};

			// Merge with provided config
			const config = { ...defaultCropConfig, ...cropConfig };

			// Calculate crop area
			const cropLeft = Math.floor(width * config.leftRatio);
			const cropTop = Math.floor(height * config.topRatio);
			const cropWidth = Math.floor(width * config.widthRatio);
			const cropHeight = Math.floor(height * config.heightRatio);

			console.log(
				`Cropping to: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`
			);

			await sharp(imagePath)
				.extract({
					left: cropLeft,
					top: cropTop,
					width: cropWidth,
					height: cropHeight,
				})
				.grayscale() // Convert to grayscale
				.normalize() // Normalize contrast
				.sharpen() // Sharpen the image
				.png()
				.toFile(processedPath);

			console.log(`Processed image saved to: ${processedPath}`);
			return processedPath;
		} catch (error) {
			console.error("Error preprocessing image:", error);
			throw error;
		}
	}

	/**
	 * Preprocess image specifically for player statistics
	 * Optimized for the right side of screenshots where player stats are displayed
	 */
	async preprocessPlayerStatsImage(imagePath, regions = null) {
		try {
			const processedPath = path.join(
				this.processedDir,
				`player_stats_${Date.now()}.png`
			);

			// Get image metadata
			const metadata = await sharp(imagePath).metadata();
			const { width, height } = metadata;

			console.log(`Processing player stats image: ${width}x${height}`);

			// Use custom regions if provided, otherwise use default crop
			let cropConfig;
			if (regions && regions.playerStats) {
				// Use custom region for player stats
				const region = regions.playerStats;

				// Validate region coordinates
				const left = Math.max(0, Math.floor(region.x));
				const top = Math.max(0, Math.floor(region.y));
				const right = Math.min(width, left + Math.floor(region.width));
				const bottom = Math.min(height, top + Math.floor(region.height));
				const actualWidth = right - left;
				const actualHeight = bottom - top;

				cropConfig = {
					left: left,
					top: top,
					width: actualWidth,
					height: actualHeight,
				};

				console.log(
					`Original region: x=${region.x}, y=${region.y}, w=${region.width}, h=${region.height}`
				);
				console.log(`Image dimensions: ${width}x${height}`);
				console.log(`Validated crop config: ${JSON.stringify(cropConfig)}`);
				console.log(
					`Region percentage of image: ${(
						(cropConfig.width / width) *
						100
					).toFixed(1)}% width, ${((cropConfig.height / height) * 100).toFixed(
						1
					)}% height`
				);

				// Ensure the region is valid
				if (actualWidth <= 0 || actualHeight <= 0) {
					console.error(
						"Invalid region dimensions, falling back to default crop"
					);
					cropConfig = {
						left: Math.floor(width * 0.6),
						top: 0,
						width: Math.floor(width * 0.4),
						height: height,
					};
				}
			} else {
				// Default crop configuration - focus on right side where player stats typically are
				cropConfig = {
					left: Math.floor(width * 0.6), // Start from 60% of image width
					top: 0, // Start from top
					width: Math.floor(width * 0.4), // Take 40% of width
					height: height, // Take full height
				};
			}

			// First, let's save the raw extracted region to see what we're actually cropping
			const rawCropPath = processedPath.replace(".png", "_raw_crop.png");
			await sharp(imagePath).extract(cropConfig).png().toFile(rawCropPath);
			console.log(`Raw crop saved: ${rawCropPath}`);

			await sharp(imagePath)
				.extract(cropConfig)
				.grayscale() // Convert to grayscale
				.normalize({
					// More aggressive normalization for better text recognition
					lower: 5,
					upper: 95,
				})
				.sharpen({
					// More aggressive sharpening for text
					sigma: 2.0,
					flat: 1.5,
					jagged: 3.0,
				})
				.threshold(120) // Lower threshold for better text extraction
				.png()
				.toFile(processedPath);

			console.log(`Player stats image processed: ${processedPath}`);

			// Also save a debug version with the region highlighted
			if (regions && regions.playerStats) {
				try {
					await this.saveDebugImage(imagePath, cropConfig, processedPath);
				} catch (debugError) {
					console.error("Error creating debug image:", debugError);
				}
			}

			return processedPath;
		} catch (error) {
			console.error("Error preprocessing player stats image:", error);
			throw error;
		}
	}

	/**
	 * Create training regions from user-defined areas
	 * This allows users to highlight important areas and ignore others
	 */
	createTrainingRegions(imagePath, userRegions) {
		const regions = {
			playerStats: userRegions.playerStats || null,
			ignoreAreas: userRegions.ignoreAreas || [],
			importantAreas: userRegions.importantAreas || [],
		};

		console.log("Training regions created:", regions);
		return regions;
	}

	/**
	 * Process image with multiple region-based OCR
	 * Applies different OCR settings to different regions
	 */
	async processWithRegions(imagePath, regions) {
		try {
			const results = [];

			// Process important areas with high accuracy settings
			for (const area of regions.importantAreas) {
				const areaPath = await this.extractRegion(imagePath, area, "important");
				const text = await this.extractTextFromProcessed(areaPath);
				results.push({
					region: "important",
					text: text,
					area: area,
				});
				await this.cleanupFile(areaPath);
			}

			// Process player stats region
			if (regions.playerStats) {
				const playerStatsPath = await this.preprocessPlayerStatsImage(
					imagePath,
					regions
				);
				const text = await this.extractTextFromProcessed(playerStatsPath);
				results.push({
					region: "playerStats",
					text: text,
					area: regions.playerStats,
				});
				await this.cleanupFile(playerStatsPath);
			}

			// Combine all text
			const combinedText = results.map((r) => r.text).join("\n");

			return {
				success: true,
				extractedText: combinedText,
				regionResults: results,
				confidence: 95, // Higher confidence due to region-based processing
			};
		} catch (error) {
			console.error("Error processing with regions:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Extract a specific region from an image
	 */
	async extractRegion(imagePath, region, regionType) {
		try {
			const processedPath = path.join(
				this.processedDir,
				`${regionType}_${Date.now()}.png`
			);

			// Get image metadata
			const metadata = await sharp(imagePath).metadata();
			const { width, height } = metadata;

			// Calculate crop area from region coordinates
			const cropConfig = {
				left: Math.floor(region.x),
				top: Math.floor(region.y),
				width: Math.floor(region.width),
				height: Math.floor(region.height),
			};

			console.log(`Extracting ${regionType} region:`, cropConfig);

			await sharp(imagePath)
				.extract(cropConfig)
				.grayscale()
				.normalize({
					lower: regionType === "important" ? 5 : 10,
					upper: regionType === "important" ? 95 : 90,
				})
				.sharpen({
					sigma: regionType === "important" ? 1.5 : 1.0,
					flat: regionType === "important" ? 1.5 : 1.0,
					jagged: regionType === "important" ? 3.0 : 2.0,
				})
				.threshold(regionType === "important" ? 120 : 128)
				.png()
				.toFile(processedPath);

			return processedPath;
		} catch (error) {
			console.error(`Error extracting ${regionType} region:`, error);
			throw error;
		}
	}

	/**
	 * Extract text from image using OCR
	 */
	async extractText(imagePath) {
		try {
			console.log("Starting OCR processing...");

			// Preprocess the image
			const processedImagePath = await this.preprocessImage(imagePath);

			// Perform OCR
			const {
				data: { text },
			} = await Tesseract.recognize(processedImagePath, "eng", {
				logger: (m) => {
					if (m.status === "recognizing text") {
						console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
					}
				},
				// OCR configuration for better accuracy
				ocr: {
					psm: 6, // Assume a single uniform block of text
					oem: 3, // Default OCR Engine Mode
				},
			});

			// Clean up processed image
			await fs.unlink(processedImagePath).catch(() => {});

			console.log("OCR completed successfully");
			return text;
		} catch (error) {
			console.error("OCR processing failed:", error);
			throw error;
		}
	}

	/**
	 * Save a debug image showing the selected region
	 */
	async saveDebugImage(originalImagePath, cropConfig, processedPath) {
		try {
			const debugPath = processedPath.replace(".png", "_debug.png");

			// Create a debug image with the region highlighted
			await sharp(originalImagePath)
				.composite([
					{
						input: Buffer.from(`
						<svg width="${cropConfig.width}" height="${cropConfig.height}">
							<rect x="0" y="0" width="${cropConfig.width}" height="${cropConfig.height}" 
								  fill="rgba(0,255,0,0.3)" stroke="red" stroke-width="2"/>
						</svg>
					`),
						left: cropConfig.left,
						top: cropConfig.top,
					},
				])
				.png()
				.toFile(debugPath);

			console.log(`Debug image saved: ${debugPath}`);
		} catch (error) {
			console.error("Error saving debug image:", error);
		}
	}

	/**
	 * Parse statistics from OCR text
	 */
	parseStatistics(ocrText) {
		const stats = {};
		const lines = ocrText
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line);

		console.log("Parsing OCR text for statistics...");
		console.log("OCR Text:", ocrText);

		// Common statistics patterns
		const statPatterns = {
			// Goals
			goals: /goals?[:\s]*(\d+)/i,
			totalGoals: /total\s+goals?[:\s]*(\d+)/i,

			// Assists
			assists: /assists?[:\s]*(\d+)/i,
			totalAssists: /total\s+assists?[:\s]*(\d+)/i,

			// Shots
			shots: /shots?[:\s]*(\d+)/i,
			totalShots: /total\s+shots?[:\s]*(\d+)/i,
			shotsOnTarget: /shots?\s+on\s+target[:\s]*(\d+)/i,

			// Passes
			passes: /passes?[:\s]*(\d+)/i,
			totalPasses: /total\s+passes?[:\s]*(\d+)/i,
			passAccuracy: /pass\s+accuracy[:\s]*(\d+(?:\.\d+)?)%?/i,

			// Tackles
			tackles: /tackles?[:\s]*(\d+)/i,
			totalTackles: /total\s+tackles?[:\s]*(\d+)/i,
			tacklesAttempted: /tackles?\s+attempted[:\s]*(\d+)/i,
			tackleSuccessRate: /tackle\s+success\s+rate[:\s]*(\d+(?:\.\d+)?)%?/i,

			// Interceptions
			interceptions: /interceptions?[:\s]*(\d+)/i,
			totalInterceptions: /total\s+interceptions?[:\s]*(\d+)/i,

			// Saves (GK)
			saves: /saves?[:\s]*(\d+)/i,
			totalSaves: /total\s+saves?[:\s]*(\d+)/i,
			savesSuccessRate: /saves?\s+success\s+rate[:\s]*(\d+(?:\.\d+)?)%?/i,

			// Clean Sheets
			cleanSheets: /clean\s+sheets?[:\s]*(\d+)/i,

			// Cards
			yellowCards: /yellow\s+cards?[:\s]*(\d+)/i,
			redCards: /red\s+cards?[:\s]*(\d+)/i,

			// Rating
			rating: /rating[:\s]*(\d+(?:\.\d+)?)/i,
			playerRating: /player\s+rating[:\s]*(\d+(?:\.\d+)?)/i,

			// Possession
			possessionLost: /possession\s+lost[:\s]*(\d+)/i,
			possessionWon: /possession\s+won[:\s]*(\d+)/i,

			// Man of the Match
			manOfTheMatch: /man\s+of\s+the\s+match[:\s]*(\d+)/i,

			// Advanced Statistics
			xG: /xG[:\s]*(\d+(?:\.\d+)?)/i,
			expectedGoals: /expected\s+goals?[:\s]*(\d+(?:\.\d+)?)/i,
			xA: /xA[:\s]*(\d+(?:\.\d+)?)/i,
			expectedAssists: /expected\s+assists?[:\s]*(\d+(?:\.\d+)?)/i,
			duelSuccess: /duel\s+success[:\s]*(\d+(?:\.\d+)?)%?/i,
			totalDuelSuccess: /total\s+duel\s+success[:\s]*(\d+(?:\.\d+)?)%?/i,
			playersBeatenByPass: /players?\s+beaten\s+by\s+pass[:\s]*(\d+)/i,

			// Goals Conceded (GK)
			goalsConceded: /goals?\s+conceded[:\s]*(\d+)/i,

			// Minutes Played
			minutesPlayed: /minutes?\s+played[:\s]*(\d+)/i,

			// Matches Played
			matchesPlayed: /matches?\s+played[:\s]*(\d+)/i,
			appearances: /appearances?[:\s]*(\d+)/i,
		};

		// Extract statistics using patterns
		for (const [statName, pattern] of Object.entries(statPatterns)) {
			const match = ocrText.match(pattern);
			if (match) {
				const value = parseFloat(match[1]);
				if (!isNaN(value)) {
					stats[statName] = value;
					console.log(`Found ${statName}: ${value}`);
				}
			}
		}

		// Try to extract from individual lines for better accuracy
		for (const line of lines) {
			// Look for key-value pairs
			const colonMatch = line.match(/^([^:]+):\s*(\d+(?:\.\d+)?%?)$/);
			if (colonMatch) {
				const key = colonMatch[1].toLowerCase().trim();
				const value = parseFloat(colonMatch[2].replace("%", ""));

				if (!isNaN(value)) {
					// Map common variations to our stat names
					const keyMapping = {
						goals: "goals",
						assists: "assists",
						shots: "shots",
						passes: "passes",
						tackles: "tackles",
						interceptions: "interceptions",
						saves: "saves",
						"clean sheets": "cleanSheets",
						"yellow cards": "yellowCards",
						"red cards": "redCards",
						rating: "rating",
						"possession lost": "possessionLost",
						"possession won": "possessionWon",
						"man of the match": "manOfTheMatch",
						xg: "xG",
						xa: "xA",
						"duel success": "duelSuccess",
						"players beaten by pass": "playersBeatenByPass",
						"tackles attempted": "tacklesAttempted",
						"goals conceded": "goalsConceded",
						"minutes played": "minutesPlayed",
						"matches played": "matchesPlayed",
					};

					const mappedKey = keyMapping[key];
					if (mappedKey && !stats[mappedKey]) {
						stats[mappedKey] = value;
						console.log(`Found ${mappedKey}: ${value} (from line parsing)`);
					}
				}
			}
		}

		console.log("Parsed statistics:", stats);
		return stats;
	}

	/**
	 * Parse statistics from extracted text
	 * Assumes the region contains individual player stats and extracts all stat line items
	 * Excludes the last column (team stats)
	 */
	parsePlayerStats(extractedText, playerName) {
		console.log(`Parsing stats from region (player: ${playerName})`);
		console.log("Extracted text:", extractedText);

		const stats = {};

		// Check if extractedText is valid
		if (!extractedText || typeof extractedText !== "string") {
			console.log("Invalid extracted text, returning empty stats");
			return stats;
		}

		// Parse all lines in the region - no need to find specific player
		const lines = extractedText.split("\n");
		console.log("Processing all lines in region:", lines.length);

		// Key mapping for player stats
		const keyMapping = {
			goals: "goals",
			assists: "assists",
			shots: "shots",
			passes: "passes",
			tackles: "tackles",
			interceptions: "interceptions",
			saves: "saves",
			"clean sheets": "cleanSheets",
			"yellow cards": "yellowCards",
			"red cards": "redCards",
			rating: "rating",
			"possession lost": "possessionLost",
			"possession won": "possessionWon",
			"man of the match": "manOfTheMatch",
			xg: "xG",
			xa: "xA",
			"duel success": "totalDuelSuccess",
			"players beaten by pass": "playersBeatenByPass",
			"tackles attempted": "tacklesAttempted",
			"goals conceded": "goalsConceded",
			"minutes played": "minutesPlayed",
			"matches played": "matchesPlayed",
		};

		// Parse each line for stats - extract all statistics from the region
		for (const line of lines) {
			const cleanLine = line.toLowerCase().trim();
			if (!cleanLine) continue;

			console.log(`Processing line: "${cleanLine}"`);

			// Look for key-value pairs
			for (const [key, mappedKey] of Object.entries(keyMapping)) {
				if (cleanLine.includes(key)) {
					// Extract the FIRST numeric value only (ignore team stats in second column)
					const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);
					if (numbers && numbers.length > 0) {
						// Take only the first number (individual player stat)
						const value = parseFloat(numbers[0]);
						stats[mappedKey] = value;
						console.log(`Found ${mappedKey}: ${value} (from: "${cleanLine}")`);
					}
				}
			}

			// Also try to extract stats from lines that contain numbers and common stat words
			const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);
			if (numbers && numbers.length > 0) {
				// Check if this line contains any stat-related keywords
				const statKeywords = [
					"goal",
					"assist",
					"shot",
					"pass",
					"tackle",
					"intercept",
					"save",
					"rating",
					"card",
				];
				const hasStatKeyword = statKeywords.some((keyword) =>
					cleanLine.includes(keyword)
				);

				if (hasStatKeyword) {
					// Try to map based on context
					for (const [key, mappedKey] of Object.entries(keyMapping)) {
						if (cleanLine.includes(key) && !stats[mappedKey]) {
							const value = parseFloat(numbers[0]);
							stats[mappedKey] = value;
							console.log(
								`Context-based found ${mappedKey}: ${value} (from: "${cleanLine}")`
							);
						}
					}
				}
			}

			// Special handling for boolean values
			if (
				cleanLine.includes("man of the match") ||
				cleanLine.includes("motm")
			) {
				stats.manOfTheMatch = true;
			}
			if (cleanLine.includes("clean sheet")) {
				stats.cleanSheets = 1;
			}
		}

		// Additional parsing for tabular data format
		// Look for lines that might contain stats in a table format
		for (const line of playerLines) {
			const cleanLine = line.trim();
			if (!cleanLine) continue;

			// Check if line contains multiple numbers separated by spaces (table format)
			const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);
			if (numbers && numbers.length >= 2) {
				// This might be a table row with player stats in first column, team stats in second
				// We want to extract stats based on context, not just position
				console.log(`Table row detected: ${cleanLine}`);
				console.log(`Numbers found: ${numbers.join(", ")}`);

				// Try to identify which numbers correspond to which stats
				// This is a more sophisticated approach for table parsing
				this.parseTableRow(cleanLine, stats, keyMapping);
			}
		}

		// Additional parsing: try to extract any numbers and map them to common stats
		// This is a fallback for when the text is too fragmented
		this.extractNumbersFromText(extractedText, stats);

		// If we still have no stats, try a more aggressive approach
		if (Object.keys(stats).length === 0) {
			console.log(
				"No stats found with standard parsing, trying aggressive extraction..."
			);
			this.aggressiveStatExtraction(extractedText, stats);
		}

		console.log("Parsed player statistics:", stats);
		return stats;
	}

	/**
	 * Aggressive stat extraction for heavily fragmented text
	 */
	aggressiveStatExtraction(extractedText, stats) {
		console.log("Attempting aggressive stat extraction...");

		// Extract all numbers from the text
		const allNumbers = extractedText.match(/(\d+(?:\.\d+)?)/g);
		if (!allNumbers || allNumbers.length === 0) {
			console.log("No numbers found for aggressive extraction");
			return;
		}

		console.log(
			`Found ${allNumbers.length} numbers for aggressive extraction:`,
			allNumbers
		);

		// Convert to numbers and sort
		const numbers = allNumbers.map((n) => parseFloat(n)).sort((a, b) => b - a);

		// Try to map numbers to stats based on typical patterns
		// This is a last resort when OCR text is very fragmented
		const statMappings = [
			{ key: "goals", pattern: /[0-9]+/, min: 0, max: 10, priority: 1 },
			{ key: "assists", pattern: /[0-9]+/, min: 0, max: 15, priority: 2 },
			{ key: "shots", pattern: /[0-9]+/, min: 0, max: 20, priority: 3 },
			{ key: "passes", pattern: /[0-9]+/, min: 10, max: 200, priority: 4 },
			{ key: "tackles", pattern: /[0-9]+/, min: 0, max: 20, priority: 5 },
			{ key: "interceptions", pattern: /[0-9]+/, min: 0, max: 15, priority: 6 },
			{ key: "saves", pattern: /[0-9]+/, min: 0, max: 15, priority: 7 },
			{ key: "rating", pattern: /[0-9]+/, min: 0, max: 10, priority: 8 },
		];

		// Map numbers to stats based on typical ranges
		for (const mapping of statMappings) {
			if (stats[mapping.key]) continue; // Already found this stat

			const matchingNumber = numbers.find(
				(num) => num >= mapping.min && num <= mapping.max
			);

			if (matchingNumber !== undefined) {
				stats[mapping.key] = matchingNumber;
				console.log(`Aggressive mapping: ${mapping.key} = ${matchingNumber}`);
			}
		}
	}

	/**
	 * Extract numbers from text and try to map them to common stats
	 * This is a fallback method for fragmented OCR text
	 */
	extractNumbersFromText(extractedText, stats) {
		console.log("Attempting number extraction fallback...");

		// Extract all numbers from the text
		const allNumbers = extractedText.match(/(\d+(?:\.\d+)?)/g);
		if (!allNumbers || allNumbers.length === 0) {
			console.log("No numbers found in text");
			return;
		}

		console.log(`Found ${allNumbers.length} numbers:`, allNumbers);

		// Common stat patterns and their typical ranges
		const statPatterns = [
			{ key: "goals", min: 0, max: 10, priority: 1 },
			{ key: "assists", min: 0, max: 15, priority: 2 },
			{ key: "shots", min: 0, max: 20, priority: 3 },
			{ key: "passes", min: 0, max: 200, priority: 4 },
			{ key: "tackles", min: 0, max: 20, priority: 5 },
			{ key: "interceptions", min: 0, max: 15, priority: 6 },
			{ key: "saves", min: 0, max: 15, priority: 7 },
			{ key: "rating", min: 0, max: 10, priority: 8 },
		];

		// Sort numbers and try to map them to stats
		const sortedNumbers = allNumbers
			.map((n) => parseFloat(n))
			.sort((a, b) => b - a);

		for (const pattern of statPatterns) {
			if (stats[pattern.key]) continue; // Already found this stat

			// Find the first number that fits this pattern's range
			const matchingNumber = sortedNumbers.find(
				(num) => num >= pattern.min && num <= pattern.max
			);

			if (matchingNumber !== undefined) {
				stats[pattern.key] = matchingNumber;
				console.log(`Fallback mapping: ${pattern.key} = ${matchingNumber}`);
			}
		}
	}

	/**
	 * Parse a table row to extract individual player stats (first column) and ignore team stats
	 */
	parseTableRow(line, stats, keyMapping) {
		// Split line by whitespace to get individual values
		const parts = line.split(/\s+/);
		console.log(`Table row parts: ${parts.join(" | ")}`);

		// Look for stat names and their corresponding values
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i].toLowerCase();

			// Check if this part matches a stat name
			for (const [key, mappedKey] of Object.entries(keyMapping)) {
				if (part.includes(key) && !stats[mappedKey]) {
					// Look for the next numeric value (should be the individual player stat)
					for (let j = i + 1; j < parts.length; j++) {
						const nextPart = parts[j];
						const numericMatch = nextPart.match(/(\d+(?:\.\d+)?)/);
						if (numericMatch) {
							const value = parseFloat(numericMatch[1]);
							stats[mappedKey] = value;
							console.log(`Table parsing - Found ${mappedKey}: ${value}`);
							break; // Found the stat, move to next
						}
					}
					break; // Found the stat name, move to next
				}
			}
		}
	}

	/**
	 * Enhanced parsing that specifically handles two-column stat layouts
	 * First column = individual player stats, Second column = team stats (ignored)
	 */
	parseTwoColumnStats(extractedText, playerName) {
		console.log(`Parsing two-column stats for player: ${playerName}`);

		const stats = {};

		// Check if extractedText is valid
		if (!extractedText || typeof extractedText !== "string") {
			console.log(
				"Invalid extracted text for two-column parsing, returning empty stats"
			);
			return stats;
		}

		const lines = extractedText.split("\n");

		// Key mapping for player stats
		const keyMapping = {
			goals: "goals",
			assists: "assists",
			shots: "shots",
			passes: "passes",
			tackles: "tackles",
			interceptions: "interceptions",
			saves: "saves",
			"clean sheets": "cleanSheets",
			"yellow cards": "yellowCards",
			"red cards": "redCards",
			rating: "rating",
			"possession lost": "possessionLost",
			"possession won": "possessionWon",
			"man of the match": "manOfTheMatch",
			xg: "xG",
			xa: "xA",
			"duel success": "totalDuelSuccess",
			"players beaten by pass": "playersBeatenByPass",
			"tackles attempted": "tacklesAttempted",
			"goals conceded": "goalsConceded",
			"minutes played": "minutesPlayed",
			"matches played": "matchesPlayed",
		};

		// Look for lines that contain stat names followed by two numbers
		for (const line of lines) {
			const cleanLine = line.toLowerCase().trim();
			if (!cleanLine) continue;

			// Check if line contains a stat name
			for (const [key, mappedKey] of Object.entries(keyMapping)) {
				if (cleanLine.includes(key) && !stats[mappedKey]) {
					// Extract all numbers from the line
					const numbers = cleanLine.match(/(\d+(?:\.\d+)?)/g);

					if (numbers && numbers.length >= 2) {
						// Take the first number (individual player stat)
						// Ignore the second number (team stat)
						const playerValue = parseFloat(numbers[0]);
						const teamValue = parseFloat(numbers[1]);

						stats[mappedKey] = playerValue;
						console.log(
							`Two-column parsing - ${mappedKey}: ${playerValue} (ignored team: ${teamValue})`
						);
					} else if (numbers && numbers.length === 1) {
						// Only one number found, use it
						const value = parseFloat(numbers[0]);
						stats[mappedKey] = value;
						console.log(`Single value - ${mappedKey}: ${value}`);
					}
				}
			}

			// Special handling for boolean values
			if (
				cleanLine.includes("man of the match") ||
				cleanLine.includes("motm")
			) {
				stats.manOfTheMatch = true;
			}
			if (cleanLine.includes("clean sheet")) {
				stats.cleanSheets = 1;
			}
		}

		return stats;
	}

	/**
	 * Process screenshot and extract statistics
	 */
	async processScreenshot(imagePath) {
		try {
			console.log("Processing screenshot:", imagePath);

			// Extract text using OCR
			const ocrText = await this.extractText(imagePath);

			// Parse statistics from the text
			const statistics = this.parseStatistics(ocrText);

			return {
				success: true,
				ocrText,
				statistics,
				message: "Screenshot processed successfully",
			};
		} catch (error) {
			console.error("Error processing screenshot:", error);
			return {
				success: false,
				error: error.message,
				message: "Failed to process screenshot",
			};
		}
	}

	/**
	 * Process player screenshot with optimized preprocessing for player stats
	 */
	async processPlayerScreenshot(imagePath) {
		try {
			console.log("Processing player screenshot:", imagePath);

			// Use optimized preprocessing for player stats
			const processedImagePath = await this.preprocessPlayerStatsImage(
				imagePath
			);

			// Extract text using OCR with player stats optimization
			const ocrText = await this.extractTextFromProcessed(processedImagePath);

			// Clean up processed image
			await this.cleanupFile(processedImagePath);

			return {
				success: true,
				extractedText: ocrText,
				confidence: 90, // Higher confidence due to optimized preprocessing
			};
		} catch (error) {
			console.error("Error processing player screenshot:", error);
			return {
				success: false,
				error: error.message,
				message: "Failed to process player screenshot",
			};
		}
	}

	/**
	 * Extract text from already processed image
	 */
	async extractTextFromProcessed(processedImagePath) {
		try {
			console.log("Starting OCR on processed image...");

			const {
				data: { text },
			} = await Tesseract.recognize(processedImagePath, "eng", {
				logger: (m) => {
					if (m.status === "recognizing text") {
						console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
					}
				},
				// Enhanced OCR options for better text recognition
				tessedit_char_whitelist:
					"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,%()[]- ",
				tessedit_pageseg_mode: "6", // Uniform block of text
				tessedit_ocr_engine_mode: "3", // Default, LSTM + Legacy
				// Additional options for better number recognition
				tessedit_do_invert: "0", // Don't invert
				tessedit_char_blacklist: "|{}[]()", // Exclude common OCR artifacts
			});

			console.log("OCR completed successfully");
			console.log("Extracted text length:", text.length);
			console.log("Extracted text preview:", text.substring(0, 200));
			console.log("Full extracted text:", text);

			return text;
		} catch (error) {
			console.error("Error during OCR:", error);
			throw error;
		}
	}

	/**
	 * Clean up uploaded files
	 */
	async cleanupFile(filePath) {
		try {
			await fs.unlink(filePath);
		} catch (error) {
			console.error("Error cleaning up file:", error);
		}
	}
}

module.exports = new OCRService();
