/**
 * Stats Fields Configuration Service
 * Manages required and custom stats fields for competitions
 */

const { prisma } = require("../database/prisma");
const { StatsFieldType } = require("@prisma/client");

/**
 * Get all stats field configurations
 * @param {boolean} includeInactive - Whether to include inactive fields
 * @returns {Array} Array of stats field configurations
 */
async function getStatsFieldConfigs(includeInactive = false) {
	const where = includeInactive ? {} : { isActive: true };

	return await prisma.statsFieldConfig.findMany({
		where,
		orderBy: [
			{ isRequired: "desc" },
			{ position: "asc" },
			{ createdAt: "asc" },
		],
	});
}

/**
 * Get required stats fields only
 * @returns {Array} Array of required stats field configurations
 */
async function getRequiredStatsFields() {
	return await prisma.statsFieldConfig.findMany({
		where: {
			isRequired: true,
			isActive: true,
		},
		orderBy: [{ position: "asc" }, { createdAt: "asc" }],
	});
}

/**
 * Get custom stats fields only
 * @returns {Array} Array of custom stats field configurations
 */
async function getCustomStatsFields() {
	return await prisma.statsFieldConfig.findMany({
		where: {
			isCustom: true,
			isActive: true,
		},
		orderBy: [{ position: "asc" }, { createdAt: "asc" }],
	});
}

/**
 * Create a new stats field configuration
 * @param {Object} fieldData - Field configuration data
 * @returns {Object} Created stats field configuration
 */
async function createStatsField(fieldData) {
	const {
		name,
		displayName,
		description,
		fieldType,
		isRequired,
		isCustom,
		position,
	} = fieldData;

	// Validate field type
	if (!Object.values(StatsFieldType).includes(fieldType)) {
		throw new Error("Invalid field type");
	}

	// Check if field name already exists
	const existingField = await prisma.statsFieldConfig.findUnique({
		where: { name },
	});

	if (existingField) {
		throw new Error("Field name already exists");
	}

	return await prisma.statsFieldConfig.create({
		data: {
			name,
			displayName,
			description,
			fieldType,
			isRequired: isRequired || false,
			isCustom: isCustom || false,
			position: position || 0,
			isActive: true,
		},
	});
}

/**
 * Update a stats field configuration
 * @param {string} fieldId - Field ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated stats field configuration
 */
async function updateStatsField(fieldId, updateData) {
	const {
		displayName,
		description,
		fieldType,
		isRequired,
		isCustom,
		position,
		isActive,
	} = updateData;

	// Validate field type if provided
	if (fieldType && !Object.values(StatsFieldType).includes(fieldType)) {
		throw new Error("Invalid field type");
	}

	return await prisma.statsFieldConfig.update({
		where: { id: fieldId },
		data: {
			displayName,
			description,
			fieldType,
			isRequired,
			isCustom,
			position,
			isActive,
		},
	});
}

/**
 * Delete a stats field configuration
 * @param {string} fieldId - Field ID
 * @returns {Object} Deleted stats field configuration
 */
async function deleteStatsField(fieldId) {
	// Check if field is required
	const field = await prisma.statsFieldConfig.findUnique({
		where: { id: fieldId },
	});

	if (field && field.isRequired) {
		throw new Error("Cannot delete required field");
	}

	return await prisma.statsFieldConfig.delete({
		where: { id: fieldId },
	});
}

/**
 * Initialize default required stats fields
 * @returns {Array} Array of created default fields
 */
async function initializeDefaultFields() {
	const defaultFields = [
		{
			name: "goals",
			displayName: "Goals",
			description: "Number of goals scored",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 1,
		},
		{
			name: "assists",
			displayName: "Assists",
			description: "Number of assists made",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 2,
		},
		{
			name: "shots",
			displayName: "Shots",
			description: "Number of shots taken",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 3,
		},
		{
			name: "passes",
			displayName: "Passes",
			description: "Number of passes completed",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 4,
		},
		{
			name: "passAccuracy",
			displayName: "Pass Accuracy",
			description: "Percentage of successful passes",
			fieldType: StatsFieldType.PERCENTAGE,
			isRequired: true,
			isCustom: false,
			position: 5,
		},
		{
			name: "tackles",
			displayName: "Tackles",
			description: "Number of tackles made",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 6,
		},
		{
			name: "interceptions",
			displayName: "Interceptions",
			description: "Number of interceptions made",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 7,
		},
		{
			name: "saves",
			displayName: "Saves",
			description: "Number of saves made (goalkeepers)",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 8,
		},
		{
			name: "cleanSheet",
			displayName: "Clean Sheet",
			description: "Whether the player kept a clean sheet",
			fieldType: StatsFieldType.BOOLEAN,
			isRequired: true,
			isCustom: false,
			position: 9,
		},
		{
			name: "rating",
			displayName: "Rating",
			description: "Overall player rating",
			fieldType: StatsFieldType.RATING,
			isRequired: true,
			isCustom: false,
			position: 10,
		},
		{
			name: "totwRating",
			displayName: "TOTW Rating",
			description: "Team of the Week rating based on position",
			fieldType: StatsFieldType.RATING,
			isRequired: true,
			isCustom: false,
			position: 11,
		},
		{
			name: "minutesPlayed",
			displayName: "Minutes Played",
			description: "Number of minutes played in the match",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 12,
		},
		{
			name: "yellowCards",
			displayName: "Yellow Cards",
			description: "Number of yellow cards received",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 13,
		},
		{
			name: "redCards",
			displayName: "Red Cards",
			description: "Number of red cards received",
			fieldType: StatsFieldType.INTEGER,
			isRequired: true,
			isCustom: false,
			position: 14,
		},
	];

	const createdFields = [];

	for (const fieldData of defaultFields) {
		try {
			const existingField = await prisma.statsFieldConfig.findUnique({
				where: { name: fieldData.name },
			});

			if (!existingField) {
				const createdField = await prisma.statsFieldConfig.create({
					data: fieldData,
				});
				createdFields.push(createdField);
			}
		} catch (error) {
			console.error(`Error creating field ${fieldData.name}:`, error);
		}
	}

	return createdFields;
}

/**
 * Validate stats data against field configurations
 * @param {Object} statsData - Stats data to validate
 * @param {Array} fieldConfigs - Field configurations to validate against
 * @returns {Object} Validation result with errors and warnings
 */
function validateStatsData(statsData, fieldConfigs) {
	const errors = [];
	const warnings = [];

	// Check required fields
	const requiredFields = fieldConfigs.filter((field) => field.isRequired);

	for (const field of requiredFields) {
		if (!(field.name in statsData)) {
			errors.push(`Required field '${field.displayName}' is missing`);
		} else {
			// Validate field type
			const value = statsData[field.name];
			const validationResult = validateFieldValue(value, field.fieldType);
			if (!validationResult.isValid) {
				errors.push(`Field '${field.displayName}': ${validationResult.error}`);
			}
		}
	}

	// Check for extra fields not in configuration
	const configuredFieldNames = fieldConfigs.map((field) => field.name);
	const extraFields = Object.keys(statsData).filter(
		(key) => !configuredFieldNames.includes(key)
	);

	if (extraFields.length > 0) {
		warnings.push(`Extra fields found: ${extraFields.join(", ")}`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate a single field value against its type
 * @param {*} value - Value to validate
 * @param {string} fieldType - Expected field type
 * @returns {Object} Validation result
 */
function validateFieldValue(value, fieldType) {
	switch (fieldType) {
		case StatsFieldType.INTEGER:
			if (typeof value !== "number" || !Number.isInteger(value)) {
				return { isValid: false, error: "Must be an integer" };
			}
			break;
		case StatsFieldType.FLOAT:
			if (typeof value !== "number") {
				return { isValid: false, error: "Must be a number" };
			}
			break;
		case StatsFieldType.BOOLEAN:
			if (typeof value !== "boolean") {
				return { isValid: false, error: "Must be a boolean" };
			}
			break;
		case StatsFieldType.TEXT:
			if (typeof value !== "string") {
				return { isValid: false, error: "Must be a string" };
			}
			break;
		case StatsFieldType.PERCENTAGE:
			if (typeof value !== "number" || value < 0 || value > 100) {
				return { isValid: false, error: "Must be a number between 0 and 100" };
			}
			break;
		case StatsFieldType.RATING:
			if (typeof value !== "number" || value < 0 || value > 10) {
				return { isValid: false, error: "Must be a number between 0 and 10" };
			}
			break;
		default:
			return { isValid: false, error: "Unknown field type" };
	}

	return { isValid: true };
}

module.exports = {
	getStatsFieldConfigs,
	getRequiredStatsFields,
	getCustomStatsFields,
	createStatsField,
	updateStatsField,
	deleteStatsField,
	initializeDefaultFields,
	validateStatsData,
	validateFieldValue,
};
