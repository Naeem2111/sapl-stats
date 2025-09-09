const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

async function debugOCRRegion() {
	try {
		// Test with a sample region
		const testRegion = {
			x: 752,
			y: 144,
			width: 324,
			height: 441,
		};

		console.log("Testing region extraction...");
		console.log("Region:", testRegion);

		// This would be the path to an uploaded image
		const imagePath = "uploads/screenshot-test.png"; // You'll need to provide a real image path

		if (
			!(await fs
				.access(imagePath)
				.then(() => true)
				.catch(() => false))
		) {
			console.log("No test image found. Please upload an image first.");
			return;
		}

		// Extract the region
		const processedPath = path.join("processed", `debug_${Date.now()}.png`);

		await sharp(imagePath)
			.extract({
				left: testRegion.x,
				top: testRegion.y,
				width: testRegion.width,
				height: testRegion.height,
			})
			.grayscale()
			.normalize({
				lower: 5,
				upper: 95,
			})
			.sharpen({
				sigma: 2.0,
				flat: 1.5,
				jagged: 3.0,
			})
			.threshold(120)
			.png()
			.toFile(processedPath);

		console.log(`Region extracted to: ${processedPath}`);
		console.log(
			"Check the processed image to see if the region selection is correct."
		);
	} catch (error) {
		console.error("Error:", error);
	}
}

debugOCRRegion();
