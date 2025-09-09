const XLSX = require("xlsx");

const workbook = XLSX.readFile("../sapl.xlsx");

console.log("All sheets in the Excel file:");
workbook.SheetNames.forEach((name, i) => {
	const data = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
	console.log(`${i + 1}. ${name}: ${data.length} rows`);
});

console.log(
	"\nLooking for sheets that might contain match-by-match player data..."
);

// Check if any sheet has a pattern that suggests match-by-match data
workbook.SheetNames.forEach((sheetName) => {
	if (
		sheetName !== "STATS REF" &&
		sheetName !== "RESULTS" &&
		sheetName !== "POTS" &&
		sheetName !== "KEY"
	) {
		const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
			header: 1,
		});
		console.log(`\n--- ${sheetName} ---`);
		console.log(`Rows: ${data.length}`);

		if (data.length > 0) {
			console.log("First row:", data[0]);
			if (data.length > 1) {
				console.log("Second row:", data[1]);
			}
		}
	}
});

