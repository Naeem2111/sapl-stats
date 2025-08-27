const express = require("express");
const router = express.Router();
const { prisma } = require("../database/prisma");
const { authenticateToken, requirePlayer } = require("../middleware/auth");

// Get all badges
router.get("/", async (req, res) => {
	try {
		const badges = await prisma.badge.findMany({
			orderBy: [
				{ category: "asc" },
				{ name: "asc" }
			]
		});

		res.json({
			success: true,
			data: badges
		});
	} catch (error) {
		console.error("Error fetching badges:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch badges"
			}
		});
	}
});

// Get badges by category
router.get("/category/:category", async (req, res) => {
	try {
		const { category } = req.params;

		const badges = await prisma.badge.findMany({
			where: {
				category: category.toUpperCase()
			},
			orderBy: {
				name: "asc"
			}
		});

		res.json({
			success: true,
			data: badges
		});
	} catch (error) {
		console.error("Error fetching badges by category:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch badges by category"
			}
		});
	}
});

// Get player's awarded badges
router.get("/player/:playerId", authenticateToken, requirePlayer, async (req, res) => {
	try {
		const { playerId } = req.params;
		const { season } = req.query;

		const where = { playerId };
		if (season && season !== "all") {
			where.seasonId = season;
		}

		const awardedBadges = await prisma.awardedBadge.findMany({
			where,
			include: {
				badge: true,
				season: {
					select: {
						id: true,
						name: true
					}
				},
				match: {
					select: {
						id: true,
						homeTeam: {
							select: {
								id: true,
								name: true
							}
						},
						awayTeam: {
							select: {
								id: true,
								name: true
							}
						},
						date: true
					}
				}
			},
			orderBy: [
				{ awardedAt: "desc" }
			]
		});

		// Group badges by category for better organization
		const groupedBadges = awardedBadges.reduce((acc, awardedBadge) => {
			const category = awardedBadge.badge.category;
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(awardedBadge);
			return acc;
		}, {});

		res.json({
			success: true,
			data: {
				awardedBadges,
				groupedBadges,
				totalBadges: awardedBadges.length
			}
		});
	} catch (error) {
		console.error("Error fetching player badges:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch player badges"
			}
		});
	}
});

// Get badge statistics for a player
router.get("/player/:playerId/stats", authenticateToken, requirePlayer, async (req, res) => {
	try {
		const { playerId } = req.params;

		const badgeStats = await prisma.awardedBadge.groupBy({
			by: ["badgeId"],
			where: { playerId },
			_count: {
				badgeId: true
			}
		});

		const badgeDetails = await Promise.all(
			badgeStats.map(async (stat) => {
				const badge = await prisma.badge.findUnique({
					where: { id: stat.badgeId }
				});
				return {
					badge,
					count: stat._count.badgeId
				};
			})
		);

		res.json({
			success: true,
			data: {
				badgeStats: badgeDetails,
				totalUniqueBadges: badgeDetails.length,
				totalBadges: badgeDetails.reduce((sum, item) => sum + item.count, 0)
			}
		});
	} catch (error) {
		console.error("Error fetching player badge stats:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch player badge statistics"
			}
		});
	}
});

// Get leaderboard for specific badge
router.get("/leaderboard/:badgeId", async (req, res) => {
	try {
		const { badgeId } = req.params;
		const { season } = req.query;

		const where = { badgeId };
		if (season && season !== "all") {
			where.seasonId = season;
		}

		const leaderboard = await prisma.awardedBadge.groupBy({
			by: ["playerId"],
			where,
			_count: {
				badgeId: true
			},
			orderBy: {
				_count: {
					badgeId: "desc"
				}
			},
			take: 10
		});

		const leaderboardWithDetails = await Promise.all(
			leaderboard.map(async (entry) => {
				const player = await prisma.player.findUnique({
					where: { id: entry.playerId },
					include: {
						team: {
							select: {
								id: true,
								name: true,
								logoUrl: true
							}
						}
					}
				});

				return {
					player,
					badgeCount: entry._count.badgeId
				};
			})
		);

		res.json({
			success: true,
			data: leaderboardWithDetails
		});
	} catch (error) {
		console.error("Error fetching badge leaderboard:", error);
		res.status(500).json({
			success: false,
			error: {
				message: "Failed to fetch badge leaderboard"
			}
		});
	}
});

module.exports = router;
