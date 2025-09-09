import React from "react";
import { Target, Users, Shield } from "lucide-react";

const FormationSelector = ({ formation, onFormationChange, teamName }) => {
	const formations = [
		{ id: "4-4-2", name: "4-4-2", description: "Classic balanced formation" },
		{
			id: "4-3-3",
			name: "4-3-3",
			description: "Attacking formation with wingers",
		},
		{ id: "3-5-2", name: "3-5-2", description: "Midfield-heavy formation" },
		{
			id: "4-2-3-1",
			name: "4-2-3-1",
			description: "Modern attacking formation",
		},
		{ id: "5-3-2", name: "5-3-2", description: "Defensive formation" },
		{ id: "4-1-4-1", name: "4-1-4-1", description: "Defensive midfield focus" },
		{ id: "3-4-3", name: "3-4-3", description: "Wing-back formation" },
		{ id: "4-5-1", name: "4-5-1", description: "Defensive counter-attack" },
	];

	const getFormationPositions = (formationId) => {
		const positions = {
			"4-4-2": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 20, y: 70 },
					{ x: 35, y: 70 },
					{ x: 65, y: 70 },
					{ x: 80, y: 70 },
				],
				MID: [
					{ x: 15, y: 50 },
					{ x: 35, y: 50 },
					{ x: 65, y: 50 },
					{ x: 85, y: 50 },
				],
				ATT: [
					{ x: 35, y: 25 },
					{ x: 65, y: 25 },
				],
			},
			"4-3-3": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 20, y: 70 },
					{ x: 35, y: 70 },
					{ x: 65, y: 70 },
					{ x: 80, y: 70 },
				],
				MID: [
					{ x: 25, y: 50 },
					{ x: 50, y: 50 },
					{ x: 75, y: 50 },
				],
				ATT: [
					{ x: 20, y: 25 },
					{ x: 50, y: 25 },
					{ x: 80, y: 25 },
				],
			},
			"3-5-2": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 25, y: 70 },
					{ x: 50, y: 70 },
					{ x: 75, y: 70 },
				],
				MID: [
					{ x: 10, y: 50 },
					{ x: 30, y: 50 },
					{ x: 50, y: 50 },
					{ x: 70, y: 50 },
					{ x: 90, y: 50 },
				],
				ATT: [
					{ x: 40, y: 25 },
					{ x: 60, y: 25 },
				],
			},
			"4-2-3-1": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 20, y: 70 },
					{ x: 35, y: 70 },
					{ x: 65, y: 70 },
					{ x: 80, y: 70 },
				],
				MID: [
					{ x: 35, y: 55 },
					{ x: 65, y: 55 },
					{ x: 20, y: 40 },
					{ x: 50, y: 40 },
					{ x: 80, y: 40 },
				],
				ATT: [{ x: 50, y: 25 }],
			},
			"5-3-2": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 15, y: 70 },
					{ x: 30, y: 70 },
					{ x: 50, y: 70 },
					{ x: 70, y: 70 },
					{ x: 85, y: 70 },
				],
				MID: [
					{ x: 30, y: 50 },
					{ x: 50, y: 50 },
					{ x: 70, y: 50 },
				],
				ATT: [
					{ x: 40, y: 25 },
					{ x: 60, y: 25 },
				],
			},
			"4-1-4-1": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 20, y: 70 },
					{ x: 35, y: 70 },
					{ x: 65, y: 70 },
					{ x: 80, y: 70 },
				],
				MID: [
					{ x: 50, y: 60 },
					{ x: 20, y: 45 },
					{ x: 40, y: 45 },
					{ x: 60, y: 45 },
					{ x: 80, y: 45 },
				],
				ATT: [{ x: 50, y: 25 }],
			},
			"3-4-3": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 25, y: 70 },
					{ x: 50, y: 70 },
					{ x: 75, y: 70 },
				],
				MID: [
					{ x: 15, y: 50 },
					{ x: 35, y: 50 },
					{ x: 65, y: 50 },
					{ x: 85, y: 50 },
				],
				ATT: [
					{ x: 20, y: 25 },
					{ x: 50, y: 25 },
					{ x: 80, y: 25 },
				],
			},
			"4-5-1": {
				GK: [{ x: 50, y: 90 }],
				DEF: [
					{ x: 20, y: 70 },
					{ x: 35, y: 70 },
					{ x: 65, y: 70 },
					{ x: 80, y: 70 },
				],
				MID: [
					{ x: 10, y: 50 },
					{ x: 30, y: 50 },
					{ x: 50, y: 50 },
					{ x: 70, y: 50 },
					{ x: 90, y: 50 },
				],
				ATT: [{ x: 50, y: 25 }],
			},
		};

		return positions[formationId] || positions["4-4-2"];
	};

	const renderFormation = (formationId) => {
		const positions = getFormationPositions(formationId);
		const isSelected = formation === formationId;

		return (
			<div
				key={formationId}
				className={`relative bg-gray-50 rounded-lg p-4 cursor-pointer transition-all ${
					isSelected
						? "ring-2 ring-primary-500 bg-primary-50"
						: "hover:bg-gray-100"
				}`}
				onClick={() => onFormationChange(formationId)}
			>
				{/* Formation Name */}
				<div className="text-center mb-3">
					<h4 className="font-semibold text-lg">{formationId}</h4>
					<p className="text-sm text-gray-500">
						{formations.find((f) => f.id === formationId)?.description}
					</p>
				</div>

				{/* Formation Visualization */}
				<div className="relative w-full h-32 bg-green-100 rounded-lg overflow-hidden">
					{/* Field lines */}
					<div className="absolute inset-0">
						{/* Center line */}
						<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
						{/* Center circle */}
						<div className="absolute top-1/2 left-1/2 w-8 h-8 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
					</div>

					{/* Position markers */}
					{Object.entries(positions).map(([positionType, posArray]) =>
						posArray.map((pos, index) => (
							<div
								key={`${positionType}-${index}`}
								className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 ${
									positionType === "GK"
										? "bg-red-500 text-white"
										: positionType === "DEF"
										? "bg-blue-500 text-white"
										: positionType === "MID"
										? "bg-yellow-500 text-black"
										: "bg-green-500 text-white"
								}`}
								style={{
									left: `${pos.x}%`,
									top: `${pos.y}%`,
								}}
							>
								{positionType === "GK"
									? "GK"
									: positionType === "DEF"
									? "D"
									: positionType === "MID"
									? "M"
									: "A"}
							</div>
						))
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center space-x-2">
				<Target className="h-5 w-5 text-primary-600" />
				<h3 className="text-lg font-semibold">
					Select Formation for {teamName}
				</h3>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{formations.map((formation) => renderFormation(formation.id))}
			</div>

			{/* Selected Formation Info */}
			{formation && (
				<div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
					<div className="flex items-center space-x-2">
						<Shield className="h-5 w-5 text-primary-600" />
						<span className="font-medium text-primary-800">
							Selected: {formation}
						</span>
					</div>
					<p className="text-sm text-primary-600 mt-1">
						{formations.find((f) => f.id === formation)?.description}
					</p>
				</div>
			)}
		</div>
	);
};

export default FormationSelector;






