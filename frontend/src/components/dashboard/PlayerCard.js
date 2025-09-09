import React from "react";
import { Users, Target, Star } from "lucide-react";

const PlayerCard = ({
	player,
	onDragStart,
	onDragEnd,
	isInFormation = false,
	position = null,
}) => {
	const getPositionColor = (position) => {
		// FIFA Ultimate Team style colors
		const colors = {
			GK: "from-red-500 to-red-600",
			CB: "from-blue-500 to-blue-600",
			CB1: "from-blue-500 to-blue-600",
			CB2: "from-blue-500 to-blue-600",
			CB3: "from-blue-500 to-blue-600",
			LB: "from-green-500 to-green-600",
			RB: "from-green-500 to-green-600",
			CDM: "from-yellow-500 to-yellow-600",
			CDM1: "from-yellow-500 to-yellow-600",
			CDM2: "from-yellow-500 to-yellow-600",
			CM: "from-purple-500 to-purple-600",
			CM1: "from-purple-500 to-purple-600",
			CM2: "from-purple-500 to-purple-600",
			CM3: "from-purple-500 to-purple-600",
			CAM: "from-indigo-500 to-indigo-600",
			LM: "from-pink-500 to-pink-600",
			RM: "from-pink-500 to-pink-600",
			LW: "from-orange-500 to-orange-600",
			RW: "from-orange-500 to-orange-600",
			ST: "from-gray-500 to-gray-600",
			ST1: "from-gray-500 to-gray-600",
			ST2: "from-gray-500 to-gray-600",
			CF: "from-gray-500 to-gray-600",
		};
		return colors[position] || "from-gray-500 to-gray-600";
	};

	const getPositionAbbreviation = (position) => {
		// Clean up position names for display - remove numbers
		const cleanPosition = position.replace(/[0-9]/g, "");
		const abbreviations = {
			GK: "GK",
			CB: "CB",
			LB: "LB",
			RB: "RB",
			CDM: "CDM",
			CM: "CM",
			CAM: "CAM",
			LM: "LM",
			RM: "RM",
			LW: "LW",
			RW: "RW",
			ST: "ST",
			CF: "CF",
		};
		return abbreviations[cleanPosition] || "UNK";
	};

	const getCardRarity = (rating) => {
		if (!rating) return "bronze";
		if (rating >= 85) return "icon";
		if (rating >= 80) return "gold";
		if (rating >= 75) return "silver";
		return "bronze";
	};

	const getRarityColors = (rarity) => {
		const colors = {
			icon: "from-yellow-400 via-yellow-500 to-yellow-600",
			gold: "from-yellow-300 via-yellow-400 to-yellow-500",
			silver: "from-gray-300 via-gray-400 to-gray-500",
			bronze: "from-orange-400 via-orange-500 to-orange-600",
		};
		return colors[rarity] || colors.bronze;
	};

	const handleDragStart = (e) => {
		e.dataTransfer.setData("application/json", JSON.stringify(player));
		onDragStart?.(player);
	};

	const handleDragEnd = (e) => {
		onDragEnd?.(player);
	};

	const rarity = getCardRarity(player.rating);
	const positionColor = getPositionColor(player.position);
	const rarityColors = getRarityColors(rarity);

	return (
		<div
			draggable={!isInFormation}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			className={`relative w-20 h-28 rounded-lg overflow-hidden transition-all cursor-pointer ${
				isInFormation
					? "shadow-lg scale-105"
					: "hover:shadow-xl hover:scale-110"
			}`}
		>
			{/* Card Background with Gradient */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${rarityColors} opacity-90`}
			></div>

			{/* Card Border */}
			<div className="absolute inset-0 border-2 border-white/30 rounded-lg"></div>

			{/* Player Avatar Area */}
			<div className="absolute top-1 left-1 right-1 h-8 bg-black/20 rounded-md flex items-center justify-center">
				<div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
					<Users className="h-3 w-3 text-white" />
				</div>
			</div>

			{/* Player Name */}
			<div className="absolute top-10 left-1 right-1">
				<p className="text-white text-[10px] font-bold truncate text-center drop-shadow-lg">
					{player.gamertag}
				</p>
				<p className="text-white/80 text-[9px] truncate text-center drop-shadow">
					{player.realName || `${player.firstName} ${player.lastName}`}
				</p>
			</div>

			{/* Position Badge */}
			<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
				<div
					className={`bg-gradient-to-r ${positionColor} px-1.5 py-0.5 rounded-md shadow-lg`}
				>
					<span className="text-white text-[10px] font-bold">
						{getPositionAbbreviation(player.position)}
					</span>
				</div>
			</div>

			{/* Rating */}
			{player.rating && (
				<div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
					<div className="bg-black/40 rounded-full px-1.5 py-0.5">
						<span className="text-white text-[10px] font-bold">
							{player.rating}
						</span>
					</div>
				</div>
			)}

			{/* Formation Position Indicator */}
			{isInFormation && position && (
				<div className="absolute top-1 right-1">
					<div className="bg-white/90 rounded-full p-1">
						<Target className="h-3 w-3 text-gray-700" />
					</div>
				</div>
			)}

			{/* Rarity Glow Effect */}
			<div
				className={`absolute inset-0 rounded-lg shadow-lg ${
					rarity === "icon"
						? "shadow-yellow-500/50"
						: rarity === "gold"
						? "shadow-yellow-400/30"
						: rarity === "silver"
						? "shadow-gray-400/20"
						: "shadow-orange-400/20"
				}`}
			></div>
		</div>
	);
};

export default PlayerCard;
