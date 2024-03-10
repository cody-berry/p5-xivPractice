// an arriving number.
class ArrivingNumber {
    // r is the distance at which we slow down. It'll become useful to know
    // that the variable assigned to 'r' has the same purpose, but globally.
    constructor(maxSpeed, r) {
        this.target = 0
        this.pos = 0
        this.maxSpeed = maxSpeed
        this.slowDownDistance = r
        this.yVel = 0
    }

    // updates the velocity to the position
    update() {
        this.pos += this.yVel
    }

    // arrives to the current target position
    // Translates to: "Go towards your target as fast as possible until you
    // get close enough to slow down linearly."
    arrive() {
        this.pos = this.pos % 360
        this.target = this.target % 360
        let distance = abs(this.target - this.pos)
        let distanceReversed = (distance > 180)
        if (distanceReversed) distance = 360 - distance
        this.yVel = map(abs(distance), 0, this.slowDownDistance, 0, this.maxSpeed, true)
        if ((this.target < this.pos) ^ (distanceReversed)) {
            this.yVel = -this.yVel
        }
    }
}