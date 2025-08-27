const express = require("express");
const router = express.Router();

// Placeholder - implement statistics routes here
router.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Stats route - implement statistics here",
	});
});

module.exports = router;
