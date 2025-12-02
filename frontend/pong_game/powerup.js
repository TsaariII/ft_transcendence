class PowerUp {
	constructor(type, duration, y, x, radius) {
		this.type = type;
		this.duration = duration;
		this.y = y;
		this.x = x;
		this.radius = radius;
	}

	collision(state) {
		// get centers
		const ballCenterY = state.positions[state.ballYI] + state.ballSize / 2;
		const ballCenterX = state.positions[state.ballXI] + state.ballSize / 2;
		const powerupCenterY = this.y + this.radius / 2;
		const powerupCenterX = this.x + this.radius / 2;

		// get distance from center to center
		const dy = ballCenterY - powerupCenterY;
		const dx = ballCenterX - powerupCenterX;

		const distance = Math.hypot(dy, dx);
		const isCollision = distance <= this.radius || distance <= state.ballSize / 2;
	
		if (!isCollision)
			return false;

		// remove this from visible so it disappears
		const index = state.visiblePowerups.indexOf(this);
		if (index !== -1) {
			state.visiblePowerups.splice(index, 1);
		}

		// Add this to active
		state.activePowerups.push(this);

		return true;
	}

	enable(state) {
		this.activationTime = new Date();
		state.activePowerups.push(this);
		switch (this.type)
		{
			case "speed":
				state.ballSpeedUp++;
				break;
			default:
				throw new Error("Unknown powerup");
		}
	}

	disable(state) {

		// remove this from active powerups
		const index = state.activePowerups.indexOf(this);
		if (index !== -1) {
			state.activePowerups.splice(index, 1);
		}

		// revert effect
		switch (this.type)
		{
			case "speed":
				state.ballSpeedUp = Math.max(1, state.ballSpeedUp - 1);
				break;
			default:
				throw new Error("Unknown powerup");
		}
	}

	isExpired() {
		const currentTime = new Date();
		return currentTime - this.activationTime >= this.duration * 1000;
	}
}

module.exports = PowerUp;
