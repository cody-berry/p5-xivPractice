// Displays a circle-shaped AoE on the screen
class CircleAOE {
    constructor(posX, posY, size, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.radius = size
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
        this.stopAccumulatingOpacity = false
    }

    // update the AoEs opacity
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && exoflareHelper) {
            this.opacity -= 0.2
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
        this.stopAccumulatingOpacity = false
    }

    // this is the same every time
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && exoflareHelper) {
            this.opacity -= 0.2
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
        this.stopAccumulatingOpacity = false
    }

    // update the AoEs opacity
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && exoflareHelper) {
            this.opacity -= 0.2
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
            this.opacity -= 1
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
            this.opacity -= 0.2
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
        this.prevX = startingPosX
        this.prevY = startingPosY
        this.prevCircleOpacity = 10
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
        if (exoflareHelper) {
            this.opacity = max(this.opacity, 10)
        }
        this.prevCircleOpacity -= 0.2
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
            this.prevCircleOpacity = this.opacity
            this.opacity = 50
            this.prevX = this.x
            this.prevY = this.y
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
            if (exoflareHelper) {
                stroke(0, 100, 100, 50)
                noFill()
                circle(this.x + this.xDiff, this.y + this.yDiff, this.size + this.sizeDiff)
                noStroke()
                fill(0, 0, 100)
            }

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
            fill(200, 80, 80, this.opacity)
            circle(this.x, this.y, this.size)
            fill(200, 90, 70, this.opacity)
            circle(this.x, this.y, this.size - 50)
            fill(200, 100, 50, this.opacity)
            circle(this.x, this.y, this.size - 100)
            if (exoflareHelper) {
                fill(200, 80, 80, this.prevCircleOpacity)
                circle(this.prevX, this.prevY, this.size)
            }
        }
    }
}

class SpreadCircle {
    constructor(playerTargeted, // 1 for you, 2 for the dragoon, 3 for the sage, and 4 for the warrior
                size, goesOffIn) {
        this.player = playerTargeted
        this.x = 0
        this.y = 0
        this.size = size
        this.goesOffAt = goesOffIn + millis()
        this.opacity = 102
        this.wentOff = false
    }

    // updates for the opacity
    update() {
        if (millis() > this.goesOffAt) {
            // when it goes off, check if anyone is in the vicinity
            if (!this.wentOff) {
                this.wentOff = true
                if (this.player === 1) { // 1 is you
                    this.x = posX
                    this.y = posY
                } if (this.player === 2) { // 2 is the dragoon
                    this.x = drgPosX
                    this.y = drgPosY
                } if (this.player === 3) { // 3 is the sage
                    this.x = sgePosX
                    this.y = sgePosY
                } if (this.player === 4) { // 4 is the warrior
                    this.x = warPosX
                    this.y = warPosY
                }
                for (let position of [
                    [posX, posY, 1],
                    [drgPosX, drgPosY, 2],
                    [sgePosX, sgePosY, 3],
                    [warPosX, warPosY, 4]
                ]) {
                    if (sqrt((this.x - position[0])**2 + (this.y - position[1])**2) < this.size/2) {
                        lastHitBy[position[2]] = ["spread", millis()]
                        print(lastHitBy)
                        if (position[2] !== this.player) {
                            partyWiped = true
                            causeOfWipe = "Someone clipped \nsomeone else with \nspread."
                        }
                    }
                }
            }
            this.opacity -= 3
        }
    }

    displayAoE() {
        if (millis() > this.goesOffAt) {
            fill(11, 100, 100, this.opacity)
            circle(this.x, this.y, this.size)
        }
    }
}

class StackCircle {
    constructor(playerTargeted, size, goesOffIn, minPlayers) {
        this.player = playerTargeted
        this.x = 0
        this.y = 0
        this.size = size
        this.goesOffAt = goesOffIn + millis()
        this.opacity = 102
        this.wentOff = false
        this.minPlayers = minPlayers
    }

    update() {
        if (millis() > this.goesOffAt) {
            // when it goes off, check if anyone is in the vicinity
            if (!this.wentOff) {
                this.wentOff = true
                if (this.player === 1) { // 1 is you
                    this.x = posX
                    this.y = posY
                } if (this.player === 2) { // 2 is the dragoon
                    this.x = drgPosX
                    this.y = drgPosY
                } if (this.player === 3) { // 3 is the sage
                    this.x = sgePosX
                    this.y = sgePosY
                } if (this.player === 4) { // 4 is the warrior
                    this.x = warPosX
                    this.y = warPosY
                }
                let playersHit = 0
                for (let position of [
                    [posX, posY, 1],
                    [drgPosX, drgPosY, 2],
                    [sgePosX, sgePosY, 3],
                    [warPosX, warPosY, 4]
                ]) {
                    if (sqrt((this.x - position[0])**2 + (this.y - position[1])**2) < this.size/2) {
                        if (lastHitBy[position[2]][1] > millis() - 1000) {
                            partyWiped = true
                            causeOfWipe = "2 stack people stacked \nup."
                        }
                        lastHitBy[position[2]] = ["stack", millis()]
                        print(lastHitBy)
                        playersHit += 1
                    }
                } if (playersHit < this.minPlayers) {
                    // if less than the minimum players have stacked up, one dies
                    partyWiped = true
                    causeOfWipe = "Too little people \nstacked up."
                }
            }
            this.opacity -= 3
        }
    }

    displayAoE() {
        if (millis() > this.goesOffAt) {
            fill(11, 100, 100, this.opacity)
            circle(this.x, this.y, this.size)
        }
    }
}

class SoakTower {
    constructor(color, xPos, yPos, radius, goesOffIn) {
        this.color = color
        this.x = xPos
        this.y = yPos
        this.size = radius
        this.goesOffAt = goesOffIn + millis()
        this.wentOff = false
        this.soaked = false
    }

    update() {
        if (millis() > this.goesOffAt) {
            if (this.wentOff === false) {
                for (let position of [
                    [posX, posY],
                    [drgPosX, drgPosY],
                    [warPosX, warPosY],
                    [sgePosX, sgePosY]
                ]) {
                    // if the tower wasn't soaked, the party wipes
                    if (sqrt((position[0] - this.x) ** 2 + (position[1] - this.y) ** 2) < this.size) {
                        this.soaked = true
                    }
                }
            }

            if (!this.soaked) {
                partyWiped = true
                causeOfWipe = "A tower went unsoaked."
            }

            this.wentOff = true
        }
    }

    displayTower() {
        if (!this.wentOff) {
            stroke(this.color[0], this.color[1], this.color[2])
            strokeWeight(1)
            noFill()
            circle(this.x, this.y, this.size*2)
            fill(this.color[0], this.color[1], this.color[2])
            noStroke()
            text(ceil((this.goesOffAt - millis())/1000), this.x - 10, this.y + 10)
        }
    }
}
