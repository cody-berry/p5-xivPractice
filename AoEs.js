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
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
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
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
            rect(this.x, this.y, this.width, this.height)
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        rect(this.x, this.y, this.width, this.height)
    }
}

class DonutAOE {
    constructor(posX, posY, size, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.size = size
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
            fill(0, 100, 100, min(this.opacity*20, 100)/2)
            beginShape()
            vertex(400, 0)
            vertex(1000, 0)
            vertex(1000, 600)
            vertex(400, 600)
            beginContour()
            for (let angle = TWO_PI; angle > 0; angle -= 0.1) {
                let x = this.x + cos(angle) * this.size
                let y = this.y + sin(angle) * this.size
                vertex(max(x, 400), y)
            }
            endContour()
            endShape(CLOSE)
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        beginShape()
        vertex(400, 0)
        vertex(1000, 0)
        vertex(1000, 600)
        vertex(400, 600)
        beginContour()
        for (let angle = TWO_PI; angle > 0; angle -= 0.1) {
            let x = this.x + cos(angle) * this.size
            let y = this.y + sin(angle) * this.size
            vertex(max(x, 400), y)
        }
        endContour()
        endShape(CLOSE)
    }
}

class ConeAOE {
    constructor(posX, posY, size, startingAngle, endingAngle, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.size = size
        this.startAngle = startingAngle
        this.endAngle = endingAngle
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
    }

    // update the AoE's opacity
    update() {
        if (this.opacity < 20 && this.goesOffAt - millis() > 100) {
            this.opacity += 1
        } if (this.goesOffAt - millis() < 20)  {
            this.opacity -= 1
        }
        if (this.goesOffAt < millis()) {
            fill(0, 100, 100, min(this.opacity*20, 100)/2)
            arc(this.x, this.y, this.size, this.size, radians(this.startAngle), radians(this.endAngle))
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        arc(this.x, this.y, this.size, this.size, radians(this.startAngle), radians(this.endAngle))
    }
}

class Exaflare {
    constructor(startingPosX, startingPosY, startingSize, goesOffInMillis, xDelta, yDelta, sizeDelta, timeDelta) {
        this.x = startingPosX
        this.y = startingPosY
        this.size = startingSize
        this.goesOffAt = millis() + goesOffInMillis
        this.xDiff = xDelta
        this.yDiff = yDelta
        this.sizeDiff = sizeDelta
        this.millisBetween = timeDelta
        this.opacity = 50
        this.wentOff = false
        this.iterations = 0
    }

    update() {
        this.opacity -= 1
        if (!this.wentOff && millis() > this.goesOffAt) {
            this.iterations += 1
            this.wentOff = true
            this.opacity = 50

            if (sqrt(abs(this.x - posX)**2 + abs(this.y - posY)**2) < this.size/2 + 16) {
                partyWiped = true
                causeOfWipe = "You got hit by an \nexoflare."
            }
        } if (this.wentOff && millis() > this.goesOffAt + this.millisBetween*this.iterations) {
            this.iterations += 1
            this.opacity = 50
            this.x += this.xDiff
            if (this.x + this.size <= 400 || this.x - this.size >= 1000) {
                this.x = -10000
            } if (this.y + this.size <= 0 || this.y - this.size >= 600) {
                this.y = -10000
            }
            this.y += this.yDiff
            this.size += this.sizeDiff

            if (sqrt(abs(this.x - posX)**2 + abs(this.y - posY)**2) < this.size/2 + 16) {
                partyWiped = true
                causeOfWipe = "You got hit by an \nexoflare."
            }
        }
    }

    displayAoE() {
        if (!this.wentOff) {
            stroke(0, 100, 100, 20)
            fill(0, 100, 100, 20)
            circle(this.x, this.y, this.size)
            stroke(0, 100, 100, 50)
            noFill()
            circle(this.x + this.xDiff, this.y + this.yDiff, this.size + this.sizeDiff)
            noStroke()
            fill(0, 0, 100)

            // display arrow (rotate)
            push()
            angleMode(RADIANS)
            translate(this.x, this.y)
            rotate(atan2(this.xDiff, -this.yDiff))
            stroke(0, 0, 100)
            fill(0, 100, 100)
            rect(-20, -10, 40, 50)
            triangle(-30, -10, 30, -10, 0, -50)
            stroke(0, 100, 100)
            line(18, -10, -18, -10)
            pop()
        } else {
            fill(0, 100, 100, this.opacity)
            circle(this.x, this.y, this.size)
        }
    }
}