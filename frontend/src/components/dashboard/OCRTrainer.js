import React, { useState, useRef, useCallback } from "react";
import { Camera, Save, Upload, Target, X, Check } from "lucide-react";
import api from "../../utils/api";

const OCRTrainer = () => {
	const [image, setImage] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [regions, setRegions] = useState({
		playerStats: null,
		ignoreAreas: [],
		importantAreas: [],
	});
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentRegion, setCurrentRegion] = useState(null);
	const [regionType, setRegionType] = useState("playerStats");
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState(null);
	const [trainingName, setTrainingName] = useState("");
	const [trainingDescription, setTrainingDescription] = useState("");

	const canvasRef = useRef(null);
	const imageRef = useRef(null);

	// Handle image upload
	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setImage(file);
			setImageUrl(url);
			setRegions({
				playerStats: null,
				ignoreAreas: [],
				importantAreas: [],
			});
		}
	};

	// Handle mouse down to start drawing
	const handleMouseDown = (event) => {
		if (!imageUrl) return;

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		setIsDrawing(true);
		setCurrentRegion({
			startX: x,
			startY: y,
			endX: x,
			endY: y,
		});
	};

	// Handle mouse move while drawing
	const handleMouseMove = (event) => {
		if (!isDrawing || !currentRegion) return;

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		setCurrentRegion((prev) => ({
			...prev,
			endX: x,
			endY: y,
		}));

		// Redraw canvas
		drawCanvas();
	};

	// Handle mouse up to finish drawing
	const handleMouseUp = () => {
		if (!isDrawing || !currentRegion) return;

		const region = {
			x: Math.min(currentRegion.startX, currentRegion.endX),
			y: Math.min(currentRegion.startY, currentRegion.endY),
			width: Math.abs(currentRegion.endX - currentRegion.startX),
			height: Math.abs(currentRegion.endY - currentRegion.startY),
		};

		// Only add region if it has some size
		if (region.width > 10 && region.height > 10) {
			addRegion(region);
		}

		setIsDrawing(false);
		setCurrentRegion(null);
	};

	// Add region to the appropriate array
	const addRegion = (region) => {
		setRegions((prev) => {
			const newRegions = { ...prev };

			if (regionType === "playerStats") {
				newRegions.playerStats = region;
				console.log("Created player stats region:", region);
			} else if (regionType === "ignore") {
				newRegions.ignoreAreas.push(region);
			} else if (regionType === "important") {
				newRegions.importantAreas.push(region);
			}

			return newRegions;
		});
	};

	// Draw canvas with regions
	const drawCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !imageUrl) return;

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw regions
		drawRegions(ctx);

		// Draw current region being drawn
		if (currentRegion) {
			ctx.strokeStyle =
				regionType === "playerStats"
					? "#3B82F6"
					: regionType === "important"
					? "#10B981"
					: "#EF4444";
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.strokeRect(
				Math.min(currentRegion.startX, currentRegion.endX),
				Math.min(currentRegion.startY, currentRegion.endY),
				Math.abs(currentRegion.endX - currentRegion.startX),
				Math.abs(currentRegion.endY - currentRegion.startY)
			);
		}
	}, [currentRegion, regionType, imageUrl]);

	// Draw all regions
	const drawRegions = (ctx) => {
		// Draw player stats region
		if (regions.playerStats) {
			ctx.strokeStyle = "#3B82F6";
			ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
			ctx.lineWidth = 2;
			ctx.setLineDash([]);
			ctx.fillRect(
				regions.playerStats.x,
				regions.playerStats.y,
				regions.playerStats.width,
				regions.playerStats.height
			);
			ctx.strokeRect(
				regions.playerStats.x,
				regions.playerStats.y,
				regions.playerStats.width,
				regions.playerStats.height
			);
			ctx.fillStyle = "#3B82F6";
			ctx.font = "12px Arial";
			ctx.fillText(
				"Player Stats",
				regions.playerStats.x + 5,
				regions.playerStats.y + 15
			);
		}

		// Draw important areas
		regions.importantAreas.forEach((region, index) => {
			ctx.strokeStyle = "#10B981";
			ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
			ctx.lineWidth = 2;
			ctx.setLineDash([]);
			ctx.fillRect(region.x, region.y, region.width, region.height);
			ctx.strokeRect(region.x, region.y, region.width, region.height);
			ctx.fillStyle = "#10B981";
			ctx.font = "12px Arial";
			ctx.fillText(`Important ${index + 1}`, region.x + 5, region.y + 15);
		});

		// Draw ignore areas
		regions.ignoreAreas.forEach((region, index) => {
			ctx.strokeStyle = "#EF4444";
			ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
			ctx.lineWidth = 2;
			ctx.setLineDash([]);
			ctx.fillRect(region.x, region.y, region.width, region.height);
			ctx.strokeRect(region.x, region.y, region.width, region.height);
			ctx.fillStyle = "#EF4444";
			ctx.font = "12px Arial";
			ctx.fillText(`Ignore ${index + 1}`, region.x + 5, region.y + 15);
		});
	};

	// Remove region
	const removeRegion = (type, index) => {
		setRegions((prev) => {
			const newRegions = { ...prev };
			if (type === "playerStats") {
				newRegions.playerStats = null;
			} else if (type === "important") {
				newRegions.importantAreas.splice(index, 1);
			} else if (type === "ignore") {
				newRegions.ignoreAreas.splice(index, 1);
			}
			return newRegions;
		});
	};

	// Process image with regions
	const handleProcessWithRegions = async () => {
		if (!image || !regions.playerStats) {
			alert(
				"Please upload an image and define at least the player stats region"
			);
			return;
		}

		setIsProcessing(true);
		try {
			// Scale coordinates from canvas size to actual image size
			const canvas = canvasRef.current;
			const img = imageRef.current;

			if (!canvas || !img) {
				alert("Canvas or image not found");
				return;
			}

			// Get the actual image dimensions
			const actualImageWidth = img.naturalWidth;
			const actualImageHeight = img.naturalHeight;
			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;

			console.log(`Canvas size: ${canvasWidth}x${canvasHeight}`);
			console.log(
				`Actual image size: ${actualImageWidth}x${actualImageHeight}`
			);

			// Scale the regions to match actual image dimensions
			const scaleX = actualImageWidth / canvasWidth;
			const scaleY = actualImageHeight / canvasHeight;

			console.log(
				`Scale factors: x=${scaleX.toFixed(3)}, y=${scaleY.toFixed(3)}`
			);

			const scaledRegions = {
				...regions,
				playerStats: regions.playerStats
					? {
							x: regions.playerStats.x * scaleX,
							y: regions.playerStats.y * scaleY,
							width: regions.playerStats.width * scaleX,
							height: regions.playerStats.height * scaleY,
					  }
					: null,
				importantAreas: regions.importantAreas.map((area) => ({
					x: area.x * scaleX,
					y: area.y * scaleY,
					width: area.width * scaleX,
					height: area.height * scaleY,
				})),
				ignoreAreas: regions.ignoreAreas.map((area) => ({
					x: area.x * scaleX,
					y: area.y * scaleY,
					width: area.width * scaleX,
					height: area.height * scaleY,
				})),
			};

			// Debug: Log the regions being sent
			console.log("Original regions:", regions);
			console.log("Scaled regions:", scaledRegions);
			console.log("Player stats region:", scaledRegions.playerStats);

			const formData = new FormData();
			formData.append("screenshot", image);
			formData.append("regions", JSON.stringify(scaledRegions));
			formData.append("playerName", "Test Player"); // You could make this dynamic

			const response = await api.post("/ocr/process-with-regions", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.data.success) {
				setResult(response.data.data);
			} else {
				alert("Failed to process image: " + response.data.error.message);
			}
		} catch (error) {
			console.error("Error processing with regions:", error);
			alert("Failed to process image");
		} finally {
			setIsProcessing(false);
		}
	};

	// Save training regions
	const handleSaveTraining = async () => {
		if (!trainingName.trim()) {
			alert("Please enter a name for the training data");
			return;
		}

		try {
			const response = await api.post("/ocr/save-training-regions", {
				regions,
				name: trainingName,
				description: trainingDescription,
			});

			if (response.data.success) {
				alert("Training regions saved successfully!");
			} else {
				alert("Failed to save training regions");
			}
		} catch (error) {
			console.error("Error saving training regions:", error);
			alert("Failed to save training regions");
		}
	};

	// Update canvas when regions change
	React.useEffect(() => {
		drawCanvas();
	}, [regions, drawCanvas]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">OCR Trainer</h2>
					<p className="text-gray-600">
						Upload screenshots and highlight regions to train the OCR system
					</p>
				</div>
			</div>

			{/* Image Upload */}
			<div className="card">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Upload Screenshot
				</label>
				<input
					type="file"
					accept="image/*"
					onChange={handleImageUpload}
					className="input-field"
				/>
			</div>

			{/* Region Type Selection */}
			{imageUrl && (
				<div className="card">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Select Region Type
					</label>
					<div className="flex space-x-4">
						<button
							onClick={() => setRegionType("playerStats")}
							className={`px-4 py-2 rounded ${
								regionType === "playerStats"
									? "bg-blue-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
						>
							Player Stats
						</button>
						<button
							onClick={() => setRegionType("important")}
							className={`px-4 py-2 rounded ${
								regionType === "important"
									? "bg-green-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
						>
							Important Areas
						</button>
						<button
							onClick={() => setRegionType("ignore")}
							className={`px-4 py-2 rounded ${
								regionType === "ignore"
									? "bg-red-600 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
						>
							Ignore Areas
						</button>
					</div>
					<p className="text-sm text-gray-500 mt-2">
						{regionType === "playerStats" &&
							"Draw a rectangle around the player stats area"}
						{regionType === "important" &&
							"Draw rectangles around important areas to focus on"}
						{regionType === "ignore" &&
							"Draw rectangles around areas to ignore"}
					</p>
				</div>
			)}

			{/* Image Canvas */}
			{imageUrl && (
				<div className="card">
					<div className="relative">
						<img
							ref={imageRef}
							src={imageUrl}
							alt="Screenshot"
							className="max-w-full h-auto"
							onLoad={() => {
								const canvas = canvasRef.current;
								const img = imageRef.current;
								if (canvas && img) {
									canvas.width = img.offsetWidth;
									canvas.height = img.offsetHeight;
									drawCanvas();
								}
							}}
						/>
						<canvas
							ref={canvasRef}
							className="absolute top-0 left-0 cursor-crosshair"
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
						/>
					</div>
					<p className="text-sm text-gray-500 mt-2">
						Click and drag to draw rectangles. Different colors represent
						different region types.
					</p>
				</div>
			)}

			{/* Region List */}
			{imageUrl && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Player Stats Region */}
					<div className="card">
						<h3 className="font-medium text-blue-600 mb-2">
							Player Stats Region
						</h3>
						{regions.playerStats ? (
							<div className="flex items-center justify-between p-2 bg-blue-50 rounded">
								<span className="text-sm">
									{regions.playerStats.width}x{regions.playerStats.height} at (
									{regions.playerStats.x}, {regions.playerStats.y})
								</span>
								<button
									onClick={() => removeRegion("playerStats")}
									className="text-red-600 hover:text-red-800"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<p className="text-sm text-gray-500">No region defined</p>
						)}
					</div>

					{/* Important Areas */}
					<div className="card">
						<h3 className="font-medium text-green-600 mb-2">Important Areas</h3>
						{regions.importantAreas.length > 0 ? (
							<div className="space-y-2">
								{regions.importantAreas.map((region, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-2 bg-green-50 rounded"
									>
										<span className="text-sm">
											{region.width}x{region.height} at ({region.x}, {region.y})
										</span>
										<button
											onClick={() => removeRegion("important", index)}
											className="text-red-600 hover:text-red-800"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-500">No regions defined</p>
						)}
					</div>

					{/* Ignore Areas */}
					<div className="card">
						<h3 className="font-medium text-red-600 mb-2">Ignore Areas</h3>
						{regions.ignoreAreas.length > 0 ? (
							<div className="space-y-2">
								{regions.ignoreAreas.map((region, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-2 bg-red-50 rounded"
									>
										<span className="text-sm">
											{region.width}x{region.height} at ({region.x}, {region.y})
										</span>
										<button
											onClick={() => removeRegion("ignore", index)}
											className="text-red-600 hover:text-red-800"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-500">No regions defined</p>
						)}
					</div>
				</div>
			)}

			{/* Process Button */}
			{imageUrl && regions.playerStats && (
				<div className="card">
					<button
						onClick={handleProcessWithRegions}
						disabled={isProcessing}
						className="btn-primary flex items-center space-x-2"
					>
						{isProcessing ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>Processing...</span>
							</>
						) : (
							<>
								<Target className="h-4 w-4" />
								<span>Process with Regions</span>
							</>
						)}
					</button>
				</div>
			)}

			{/* Results */}
			{result && (
				<div className="card">
					<h3 className="font-medium text-gray-900 mb-4">OCR Results</h3>
					<div className="space-y-4">
						<div>
							<h4 className="font-medium text-gray-700 mb-2">
								Extracted Text:
							</h4>
							<pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
								{result.extractedText}
							</pre>
						</div>
						{result.playerStats &&
							Object.keys(result.playerStats).length > 0 && (
								<div>
									<h4 className="font-medium text-gray-700 mb-2">
										Player Stats:
									</h4>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
										{Object.entries(result.playerStats).map(([key, value]) => (
											<div key={key} className="bg-blue-50 p-2 rounded">
												<span className="text-sm font-medium">{key}:</span>
												<span className="text-sm ml-1">{value}</span>
											</div>
										))}
									</div>
								</div>
							)}
						<div>
							<h4 className="font-medium text-gray-700 mb-2">
								Confidence: {result.confidence}%
							</h4>
						</div>
					</div>
				</div>
			)}

			{/* Save Training Data */}
			{imageUrl && regions.playerStats && (
				<div className="card">
					<h3 className="font-medium text-gray-900 mb-4">Save Training Data</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Training Name
							</label>
							<input
								type="text"
								value={trainingName}
								onChange={(e) => setTrainingName(e.target.value)}
								placeholder="e.g., FIFA 24 Player Stats"
								className="input-field"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Description
							</label>
							<textarea
								value={trainingDescription}
								onChange={(e) => setTrainingDescription(e.target.value)}
								placeholder="Describe this training data..."
								className="input-field"
								rows={3}
							/>
						</div>
						<button
							onClick={handleSaveTraining}
							className="btn-secondary flex items-center space-x-2"
						>
							<Save className="h-4 w-4" />
							<span>Save Training Data</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default OCRTrainer;
