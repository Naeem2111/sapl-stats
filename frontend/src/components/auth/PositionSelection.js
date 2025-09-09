import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./PositionSelection.css";

const PositionSelection = ({ user, onPositionSelected }) => {
	const [positions, setPositions] = useState([]);
	const [selectedPositions, setSelectedPositions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		fetchPositions();
	}, []);

	const fetchPositions = async () => {
		try {
			const response = await api.get("/player-positions/positions");
			setPositions(response.data.positions);
		} catch (error) {
			console.error("Error fetching positions:", error);
			setError("Failed to load positions");
		}
	};

	const handlePositionToggle = (position) => {
		setSelectedPositions((prev) => {
			if (prev.includes(position.value)) {
				return prev.filter((p) => p !== position.value);
			} else {
				return [...prev, position.value];
			}
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (selectedPositions.length === 0) {
			setError("Please select at least one position");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await api.post("/player-positions/update", {
				positions: selectedPositions,
			});

			if (response.data.success) {
				// Position updated successfully
				if (onPositionSelected) {
					onPositionSelected(response.data.player);
				}
				navigate("/dashboard");
			} else {
				setError(response.data.error || "Failed to update position");
			}
		} catch (error) {
			console.error("Error updating position:", error);
			setError("Failed to update position");
		} finally {
			setLoading(false);
		}
	};

	const positionGroups = {
		Goalkeeper: positions.filter((p) => p.value === "GK"),
		Defenders: positions.filter((p) => ["CB", "LB", "RB"].includes(p.value)),
		Midfielders: positions.filter((p) =>
			["CDM", "CM", "CAM", "LM", "RM"].includes(p.value)
		),
		Forwards: positions.filter((p) =>
			["LW", "RW", "ST", "CF"].includes(p.value)
		),
	};

	return (
		<div className="position-selection-container">
			<div className="position-selection-card">
				<div className="position-selection-header">
					<h2>Welcome, {user?.username}!</h2>
					<p>Please select your playing position(s) to continue</p>
				</div>

				<form onSubmit={handleSubmit} className="position-selection-form">
					<div className="position-groups">
						{Object.entries(positionGroups).map(
							([groupName, groupPositions]) => (
								<div key={groupName} className="position-group">
									<h3 className="position-group-title">{groupName}</h3>
									<div className="position-options">
										{groupPositions.map((position) => (
											<label
												key={position.value}
												className={`position-option ${
													selectedPositions.includes(position.value)
														? "selected"
														: ""
												}`}
											>
												<input
													type="checkbox"
													value={position.value}
													checked={selectedPositions.includes(position.value)}
													onChange={() => handlePositionToggle(position)}
													className="position-checkbox"
												/>
												<div className="position-info">
													<span className="position-label">
														{position.label}
													</span>
													<span className="position-description">
														{position.description}
													</span>
												</div>
											</label>
										))}
									</div>
								</div>
							)
						)}
					</div>

					{error && <div className="error-message">{error}</div>}

					<div className="position-selection-footer">
						<p className="position-help">
							💡 You can select multiple positions. The first one will be your
							primary position.
						</p>
						<button
							type="submit"
							disabled={loading || selectedPositions.length === 0}
							className="submit-button"
						>
							{loading ? "Updating..." : "Continue to Dashboard"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default PositionSelection;
