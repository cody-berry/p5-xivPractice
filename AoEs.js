// Displays a circle-shaped AoE on the screen
class CircleAOE {
    constructor(posX, posY, size, goesOffInMillis) {
        this.x = posX
        this.y = posY
        this.diameter = size
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
        this.stopAccumulatingOpacity = false
    }

    // update the AoEs opacity
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && helper) {
            this.opacity -= 0.2
        }
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                if (sqrt((posX - this.x)**2 + (posY - this.y)**2) < this.diameter/2) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a circle."
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
            circle(this.x, this.y, this.diameter)
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        circle(this.x, this.y, this.diameter)
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
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && helper) {
            this.opacity -= 0.2
        }
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                if (posX > this.x || posX < this.x + this.width ||
                    posY > this.y || posY < this.y + this.height) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a rectangle."
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
            rect(this.x, this.y, this.width, this.height)
        }
    }

    displayAoE() {
        fill(20, 100, 100, this.opacity)
        rect(this.x, this.y, this.width, this.height)
    }
}

class LineAOE {
    constructor(x1, y1, x2, y2, thickness, goesOffInMillis) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.angleOfLine = atan2(this.y2 - this.y1, this.x2 - this.x1)
        this.thickness = thickness
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
        this.stopAccumulatingOpacity = false
    }

    // this is the same every time
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && helper) {
            this.opacity -= 0.05
        } if (this.goesOffAt < millis()) {
            if (this.opacity > 5) this.opacity = 5
            this.opacity -= 0.2
            stroke(0, 100, 50, min(this.opacity*20, 100)/2)
            strokeWeight(this.thickness)
            line(this.x1, this.y1, this.x2, this.y2)
        }
    }

    displayAoE() {
        if (this.goesOffAt > millis()) {
            stroke(20, 100, 100, this.opacity)
            strokeWeight(this.thickness)
            line(this.x1, this.y1, this.x2, this.y2)
        }
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

    // update the AoEs opacity TODO consider encapsulation
    update() {
        if (!this.stopAccumulatingOpacity && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity >= 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && helper) {
            this.opacity -= 0.2
        }
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                if (sqrt((posX - this.x)**2 + (posY - this.y)**2) > this.size) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a donut."
                }
            }
            this.opacity -= 0.2
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
        this.stopAccumulatingOpacity = false
    }

    // update the AoE's opacity
    update() {
        if (this.opacity < 20 && this.goesOffAt - millis() > 100) {
            this.opacity += 1
            if (this.opacity > 20) this.stopAccumulatingOpacity = true
        } if (this.stopAccumulatingOpacity && this.opacity > 5 && helper) {
            this.opacity -= 0.2
        }
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                if (sqrt((posX - this.x)**2 + (posY - this.y)**2) < this.size/2 &&
                    this.startAngle % TWO_PI < degrees(atan2(posY - this.y, posX - this.x) % TWO_PI) &&
                    atan2(posY - this.y, posX - this.x) % TWO_PI < this.endAngle % TWO_PI) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a cone."
                }
            }
            this.opacity -= 0.2
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
        if (helper) {
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
            if (helper) {
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
            if (helper) {
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
        this.opacity = 100
    }

    update() {
        if (millis() > this.goesOffAt) {
            this.opacity -= 5
            if (this.wentOff === false) {
                for (let position of [
                    [posX, posY],
                    [drgPosX, drgPosY],
                    [warPosX, warPosY],
                    [sgePosX, sgePosY]
                ]) {
                    // if the tower wasn't soaked, the party wipes
                    if (sqrt((position[0] - this.x) ** 2 + (position[1] - this.y)
                        ** 2) < this.size) {
                        this.soaked = true
                    }
                }

                if (!this.soaked) {
                    partyWiped = true
                    causeOfWipe = "A tower went unsoaked."
                    this.opacity = 150
                }
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
        } if (this.wentOff && this.soaked) {
            stroke(this.color[0], this.color[1], this.color[2], this.opacity)
            strokeWeight(5)
            noFill()
            circle(this.x, this.y, this.size*2)
        } if (this.wentOff && !this.soaked) {
            stroke(this.color[0], this.color[1], this.color[2], this.opacity)
            strokeWeight(10)
            noFill()
            circle(this.x, this.y, this.size*2 + (150 - this.opacity)*8)
            strokeWeight(1)
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10, 0))
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10 - 400, 0))
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10 - 800, 0))
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10 - 1200, 0))
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10 - 1600, 0))
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10 - 2000, 0))
        }
    }
}

class FlameLine {
    constructor(x1, y1, x2, y2, growingTimes) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.growingTimes = growingTimes
        this.initiatedAt = millis()
        this.stage = 0 // not displayed
        this.wentOff = false
    }

    update() {
        if (millis() - this.initiatedAt > this.growingTimes[0]) {
            this.stage = 1 // displayed as red line
        } if (millis() - this.initiatedAt > this.growingTimes[1]) {
            this.stage = 2 // slightly glowing
        } if (millis() - this.initiatedAt > this.growingTimes[2]) {
            this.stage = 3 // moderately glowing
        } if (millis() - this.initiatedAt > this.growingTimes[3]) {
            this.stage = 4 // heavily glowing
        } if (millis() - this.initiatedAt > this.growingTimes[4]) {
            this.stage = 0
            if (!this.wentOff) {
                AoEs.push(new LineAOE(this.x1, this.y1, this.x2, this.y2, 310, 1000))
                this.wentOff = true
            }
        }
    }

    displayAoE() {
        switch (this.stage) {
            case 1:
                stroke(0, 100, 100) // red
                strokeWeight(1)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 2:
                stroke(0, 100, 100) // red
                strokeWeight(15)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(7, 100, 100) // vermilion
                strokeWeight(12)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(25, 100, 100) // orange
                strokeWeight(8)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(5)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(1)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 3:
                stroke(0, 100, 100) // red
                strokeWeight(25)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(7, 100, 100) // vermilion
                strokeWeight(22)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(25, 100, 100) // orange
                strokeWeight(18)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(35, 100, 100) // orange-yellow
                strokeWeight(13)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(10)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 50, 100) // yellow-white
                strokeWeight(6)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(3)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 4:
                stroke(0, 100, 100) // red
                strokeWeight(35)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(7, 100, 100) // vermilion
                strokeWeight(31)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(25, 100, 100) // orange
                strokeWeight(27)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(35, 100, 100) // orange-yellow
                strokeWeight(23)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(19)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 50, 100) // yellow-white
                strokeWeight(13)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(7)
                line(this.x1, this.y1, this.x2, this.y2)
                break
        }
        noStroke()
    }
}
class WaterLine {
    constructor(x1, y1, x2, y2, growingTimes) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.growingTimes = growingTimes
        this.initiatedAt = millis()
        this.stage = 0 // not displayed
        this.wentOff = false
        this.wentOffAt = -100000
        this.iterations = 0
        this.angleOfLine = atan2(this.y2 - this.y1, this.x2 - this.x1)
        this.opacity = -5
    }

    update() {
        if (millis() - this.initiatedAt > this.growingTimes[0]) {
            this.stage = 1 // displayed as blue line
        } if (millis() - this.initiatedAt > this.growingTimes[1]) {
            this.stage = 2 // slightly glowing
        } if (millis() - this.initiatedAt > this.growingTimes[2]) {
            this.stage = 3 // moderately glowing
        } if (millis() - this.initiatedAt > this.growingTimes[3]) {
            this.stage = 4 // heavily glowing
        } if (millis() - this.initiatedAt > this.growingTimes[4]) {
            this.stage = 5
            if (!this.wentOff) {
                this.wentOff = true
                this.wentOffAt = millis()
            } else {
                this.opacity -= 4
                if (millis() - this.wentOffAt > 500 + 1500*this.iterations) {
                    this.opacity = 300
                    this.iterations++
                }
            }
        }
    }

    displayAoE() {
        switch (this.stage) {
            case 1:
                stroke(200, 80, 100) // blue
                strokeWeight(1)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 2:
                stroke(200, 80, 100) // blue
                strokeWeight(15)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(150, 80, 100) // teal
                strokeWeight(9)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(120, 100, 100) // green
                strokeWeight(8)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(5)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(1)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 3:
                stroke(200, 80, 100) // blue
                strokeWeight(25)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(150, 80, 100) // teal
                strokeWeight(15)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(120, 100, 100) // green
                strokeWeight(14)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(70, 100, 100) // green-yellow
                strokeWeight(13)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(10)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 50, 100) // yellow-white
                strokeWeight(6)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(3)
                line(this.x1, this.y1, this.x2, this.y2)
                break
            case 4:
                stroke(200, 80, 100) // blue
                strokeWeight(35)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(150, 80, 100) // teal
                strokeWeight(25)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(120, 100, 100) // green
                strokeWeight(24)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(70, 100, 100) // green-yellow
                strokeWeight(23)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 100, 100) // yellow
                strokeWeight(19)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(45, 50, 100) // yellow-white
                strokeWeight(13)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(0, 0, 100) // white
                strokeWeight(7)
                line(this.x1, this.y1, this.x2, this.y2)
                break
        }
        if (millis() - this.wentOffAt < 500) { // show telegraph
            stroke(20, 100, 100, 20)
            strokeWeight(40)
            line(this.x1 + (40*this.iterations - 20)*sin(this.angleOfLine),
                 this.y1 - (40*this.iterations - 20)*cos(this.angleOfLine),
                 this.x2 + (40*this.iterations - 20)*sin(this.angleOfLine),
                 this.y2 - (40*this.iterations - 20)*cos(this.angleOfLine))
            line(this.x1 - (40*this.iterations - 20)*sin(this.angleOfLine),
                 this.y1 + (40*this.iterations - 20)*cos(this.angleOfLine),
                 this.x2 - (40*this.iterations - 20)*sin(this.angleOfLine),
                 this.y2 + (40*this.iterations - 20)*cos(this.angleOfLine))

        }
        stroke(200, 100, 100, min(this.opacity, 90)) // deep blue: wave color
        strokeWeight(40)
        line(this.x1 + (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y1 - (40*this.iterations - 20)*cos(this.angleOfLine),
             this.x2 + (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y2 - (40*this.iterations - 20)*cos(this.angleOfLine))
        line(this.x1 - (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y1 + (40*this.iterations - 20)*cos(this.angleOfLine),
             this.x2 - (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y2 + (40*this.iterations - 20)*cos(this.angleOfLine))
        strokeWeight(23)
        stroke(200, 100, 100, (helper) ? max(30, this.opacity + 10) : this.opacity + 10)
        line(this.x1 + (millis() - this.wentOffAt - 350)/37.5*sin(this.angleOfLine),
             this.y1 - (millis() - this.wentOffAt - 350)/37.5*cos(this.angleOfLine),
             this.x2 + (millis() - this.wentOffAt - 350)/37.5*sin(this.angleOfLine),
             this.y2 - (millis() - this.wentOffAt - 350)/37.5*cos(this.angleOfLine))
        line(this.x1 - (millis() - this.wentOffAt - 350)/37.5*sin(this.angleOfLine),
             this.y1 + (millis() - this.wentOffAt - 350)/37.5*cos(this.angleOfLine),
             this.x2 - (millis() - this.wentOffAt - 350)/37.5*sin(this.angleOfLine),
             this.y2 + (millis() - this.wentOffAt - 350)/37.5*cos(this.angleOfLine))
    }
}
