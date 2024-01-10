// Displays a circle-shaped AoE on the screen
class CircleAOE {
    constructor(posX, posY, size, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.radius = size
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
    }

    // update the AoEs opacity
    update() {
        if (this.opacity < 20 && this.goesOffAt - millis() > 100) {
            this.opacity += 1
        } if (this.goesOffAt - millis() < 20)  {
            this.opacity -= 1
        }
        if (this.goesOffAt < millis()) {
            fill(0, 100, 50, this.opacity*20)
            circle(this.x, this.y, this.radius)
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        circle(this.x, this.y, this.radius)
    }
}

class RectAOE {
    constructor(posX, posY, width, height, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.width = width
        this.height = height
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
    }

    // this is the same every time
    update() {
        if (this.opacity < 20 && this.goesOffAt - millis() > 100) {
            this.opacity += 1
        } if (this.goesOffAt - millis() < 20)  {
            this.opacity -= 1
        }
        if (this.goesOffAt < millis()) {
            fill(0, 100, 50, this.opacity*20)
            rect(this.x, this.y, this.width, this.height)
            delete this
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        rect(this.x, this.y, this.width, this.height)
    }
}