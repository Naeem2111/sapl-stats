import React from "react";
import { Target, Users, X } from "lucide-react";
import PlayerCard from "./PlayerCard";

const FormationDisplay = ({
	formation,
	lineup,
	team,
	teamType, // "home" or "away"
	onPlayerDrop,
	onPlayerRemove,
	onPlayerClick,
}) => {
	const getFormationPositions = (formationId) => {
		const positions = {
			"4-4-2": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 20, y: 70, position: "LB" },
					{ x: 35, y: 70, position: "CB1" },
					{ x: 65, y: 70, position: "CB2" },
					{ x: 80, y: 70, position: "RB" },
				],
				MID: [
					{ x: 15, y: 50, position: "LM" },
					{ x: 35, y: 50, position: "CM1" },
					{ x: 65, y: 50, position: "CM2" },
					{ x: 85, y: 50, position: "RM" },
				],
				ATT: [
					{ x: 35, y: 25, position: "ST1" },
					{ x: 65, y: 25, position: "ST2" },
				],
			},
			"4-3-3": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 20, y: 70, position: "LB" },
					{ x: 35, y: 70, position: "CB1" },
					{ x: 65, y: 70, position: "CB2" },
					{ x: 80, y: 70, position: "RB" },
				],
				MID: [
					{ x: 25, y: 50, position: "CM1" },
					{ x: 50, y: 50, position: "CM2" },
					{ x: 75, y: 50, position: "CM3" },
				],
				ATT: [
					{ x: 20, y: 25, position: "LW" },
					{ x: 50, y: 25, position: "ST" },
					{ x: 80, y: 25, position: "RW" },
				],
			},
			"3-5-2": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 25, y: 70, position: "CB1" },
					{ x: 50, y: 70, position: "CB2" },
					{ x: 75, y: 70, position: "CB3" },
				],
				MID: [
					{ x: 10, y: 50, position: "LM" },
					{ x: 30, y: 50, position: "CM1" },
					{ x: 50, y: 50, position: "CM2" },
					{ x: 70, y: 50, position: "CM3" },
					{ x: 90, y: 50, position: "RM" },
				],
				ATT: [
					{ x: 40, y: 25, position: "ST1" },
					{ x: 60, y: 25, position: "ST2" },
				],
			},
			"4-2-3-1": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 20, y: 70, position: "LB" },
					{ x: 35, y: 70, position: "CB1" },
					{ x: 65, y: 70, position: "CB2" },
					{ x: 80, y: 70, position: "RB" },
				],
				MID: [
					{ x: 35, y: 55, position: "CDM1" },
					{ x: 65, y: 55, position: "CDM2" },
					{ x: 20, y: 40, position: "LW" },
					{ x: 50, y: 40, position: "CAM" },
					{ x: 80, y: 40, position: "RW" },
				],
				ATT: [{ x: 50, y: 25, position: "ST" }],
			},
			"5-3-2": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 15, y: 70, position: "LB" },
					{ x: 30, y: 70, position: "CB1" },
					{ x: 50, y: 70, position: "CB2" },
					{ x: 70, y: 70, position: "CB3" },
					{ x: 85, y: 70, position: "RB" },
				],
				MID: [
					{ x: 30, y: 50, position: "CM1" },
					{ x: 50, y: 50, position: "CM2" },
					{ x: 70, y: 50, position: "CM3" },
				],
				ATT: [
					{ x: 40, y: 25, position: "ST1" },
					{ x: 60, y: 25, position: "ST2" },
				],
			},
			"4-1-4-1": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 20, y: 70, position: "LB" },
					{ x: 35, y: 70, position: "CB1" },
					{ x: 65, y: 70, position: "CB2" },
					{ x: 80, y: 70, position: "RB" },
				],
				MID: [
					{ x: 50, y: 60, position: "CDM" },
					{ x: 20, y: 45, position: "LM" },
					{ x: 40, y: 45, position: "CM1" },
					{ x: 60, y: 45, position: "CM2" },
					{ x: 80, y: 45, position: "RM" },
				],
				ATT: [{ x: 50, y: 25, position: "ST" }],
			},
			"3-4-3": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 25, y: 70, position: "CB1" },
					{ x: 50, y: 70, position: "CB2" },
					{ x: 75, y: 70, position: "CB3" },
				],
				MID: [
					{ x: 15, y: 50, position: "LM" },
					{ x: 35, y: 50, position: "CM1" },
					{ x: 65, y: 50, position: "CM2" },
					{ x: 85, y: 50, position: "RM" },
				],
				ATT: [
					{ x: 20, y: 25, position: "LW" },
					{ x: 50, y: 25, position: "ST" },
					{ x: 80, y: 25, position: "RW" },
				],
			},
			"4-5-1": {
				GK: [{ x: 50, y: 90, position: "GK" }],
				DEF: [
					{ x: 20, y: 70, position: "LB" },
					{ x: 35, y: 70, position: "CB1" },
					{ x: 65, y: 70, position: "CB2" },
					{ x: 80, y: 70, position: "RB" },
				],
				MID: [
					{ x: 10, y: 50, position: "LM" },
					{ x: 30, y: 50, position: "CM1" },
					{ x: 50, y: 50, position: "CM2" },
					{ x: 70, y: 50, position: "CM3" },
					{ x: 90, y: 50, position: "RM" },
				],
				ATT: [{ x: 50, y: 25, position: "ST" }],
			},
		};

		return positions[formation] || positions["4-4-2"];
	};

	const handleDrop = (e, position) => {
		e.preventDefault();
		const playerData = JSON.parse(e.dataTransfer.getData("application/json"));
		onPlayerDrop?.(playerData.id, position, teamType);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const getPlayerInPosition = (position) => {
		const playerId = lineup[position];
		if (!playerId) return null;
		return team?.players?.find((p) => p.id === playerId);
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

	const positions = getFormationPositions(formation);

	return (
		<div className="space-y-4">
			<div className="text-center">
				<h4 className="font-semibold text-lg">{formation} Formation</h4>
				<p className="text-sm text-gray-500">Drag players to positions</p>
			</div>

			{/* Formation Field */}
			<div className="relative w-full h-[500px] bg-gradient-to-b from-green-200 to-green-300 rounded-lg overflow-hidden border-2 border-green-400 shadow-lg">
				{/* Field lines */}
				<div className="absolute inset-0">
					{/* Center line */}
					<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
					{/* Center circle */}
					<div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
					{/* Goal areas */}
					<div className="absolute top-0 left-1/4 right-1/4 h-12 border-l-2 border-r-2 border-t-2 border-white transform -translate-x-1/2"></div>
					<div className="absolute bottom-0 left-1/4 right-1/4 h-12 border-l-2 border-r-2 border-b-2 border-white transform -translate-x-1/2"></div>
					{/* Penalty areas */}
					<div className="absolute top-0 left-1/6 right-1/6 h-20 border-l-2 border-r-2 border-t-2 border-white transform -translate-x-1/2"></div>
					<div className="absolute bottom-0 left-1/6 right-1/6 h-20 border-l-2 border-r-2 border-b-2 border-white transform -translate-x-1/2"></div>
				</div>

				{/* Position slots */}
				{Object.entries(positions).map(([positionType, posArray]) =>
					posArray.map((pos, index) => {
						const player = getPlayerInPosition(pos.position);
						return (
							<div
								key={`${positionType}-${index}`}
								className="absolute transform -translate-x-1/2 -translate-y-1/2"
								style={{
									left: `${pos.x}%`,
									top: `${pos.y}%`,
								}}
								onDrop={(e) => handleDrop(e, pos.position)}
								onDragOver={handleDragOver}
							>
								{player ? (
									<div className="relative group">
										<PlayerCard
											player={player}
											isInFormation={true}
											position={pos.position}
											onClick={() => onPlayerClick?.(player)}
										/>
										<button
											onClick={() => onPlayerRemove?.(pos.position, teamType)}
											className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								) : (
									<div
										className="w-20 h-28 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors cursor-pointer backdrop-blur-sm"
										onClick={() => onPlayerClick?.(null, pos.position)}
									>
										<div className="text-center">
											<Target className="h-6 w-6 text-gray-400 mx-auto mb-1" />
											<span className="text-[10px] text-gray-500 font-medium">
												{getPositionAbbreviation(pos.position)}
											</span>
										</div>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Formation Legend */}
			<div className="flex justify-center space-x-4 text-xs">
				<div className="flex items-center space-x-1">
					<div className="w-3 h-3 bg-red-500 rounded-full"></div>
					<span>Goalkeeper</span>
				</div>
				<div className="flex items-center space-x-1">
					<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
					<span>Defender</span>
				</div>
				<div className="flex items-center space-x-1">
					<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
					<span>Midfielder</span>
				</div>
				<div className="flex items-center space-x-1">
					<div className="w-3 h-3 bg-green-500 rounded-full"></div>
					<span>Attacker</span>
				</div>
			</div>
		</div>
	);
};

export default FormationDisplay;
