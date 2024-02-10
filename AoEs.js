
// Each AoE has a utility update function. It updates the opacity and checks if
// it's went off yet. The thing is, the opacity is always updated the same way.
// This function's job is to update the opacity in each AoE.
function updateOpacity(AoE) {
    // the time left until the AoE resolves and checks if you got hit
    let timeUntilGoesOff = AoE.goesOffAt - millis()

    // has the AoE already gone off?
    // based on the way that timeUntilGoesOff is calculated, when millis() >
    // AoE.goesOffAt, timeUntilGoesOff will be less than 0
    let wentOff = (timeUntilGoesOff < 0)

    // of course, we only do this if the AoE hasn't resolved already.
    if (!wentOff) {
        if (
            // if the helper is turned on, AoEs will gradually decrease opacity
            // when this is turned on, meaning that we can't just have this.opacity
            // < 20 here.
            !AoE.stopAccumulatingOpacity) {
            AoE.opacity += 1

            // if the AoE's opacity is 20, we shouldn't accumulate opacity anymore
            if (AoE.opacity >= 20) AoE.stopAccumulatingOpacity = true
        }
        if (AoE.stopAccumulatingOpacity && AoE.opacity > 5 && helper) {
            // decrease the opacity slightly so that you can tell z-index
            // only if the helper is enabled, though!
            AoE.opacity -= 0.1
        }
    }
    // if it did go off, then we leave that to the one that's calling the
    // function to handle.
}

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

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                // if your distance from the center of the circle (this.x, this.y)
                // is less than the radius, or this.diameter/2, then the party
                // wipes because you got hit by a circle AoE.
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

    // displays the orange version of the AoE.
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

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                // if you are within the bounds of the rectangle, the party
                // wipes because you got hit by an AoE!
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

    // displays the orange version of the AoE.
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

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
        if (this.goesOffAt < millis()) {
            this.opacity -= 0.2
            stroke(0, 100, 50, min(this.opacity*20, 100)/2)
            strokeWeight(this.thickness)
            line(this.x1, this.y1, this.x2, this.y2)
        }
    }

    // displays the orange version of the AoE.
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

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                // if your distance from the center of the donut is bigger than
                // the radius of the donut hole, then the party wipes because
                // you got hit.
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

    // displays the orange version of the AoE.
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

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
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

    // displays the orange version of the AoE.
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

    // displays the AoE, however it should be displayed
    displayAoE() {
        if (!this.wentOff) {
            // display where the exaflare starts
            stroke(0, 100, 100, 20)
            fill(0, 100, 100, 20)
            circle(this.x, this.y, this.size)
            if (helper) {
                // if the helper is enabled, outline exactly where it's going to
                // land next
                stroke(0, 100, 100, 20)
                noFill()
                circle(this.x + this.xDiff, this.y + this.yDiff, this.size + this.sizeDiff)
                noStroke()
                fill(0, 0, 100)
            }

            // display where the exaflare is moving (rotate from the center
            // of the exaflare)
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
            // now display 3 circles, each smaller than the last
            fill(200, 80, 80, this.opacity)
            circle(this.x, this.y, this.size)
            fill(200, 90, 70, this.opacity - 8)
            circle(this.x, this.y, this.size - 50)
            fill(200, 100, 50, this.opacity - 16)
            circle(this.x, this.y, this.size - 100)
            if (helper) {
                fill(200, 80, 80, this.prevCircleOpacity)
                circle(this.prevX, this.prevY, this.size)
            }
        }
    }
}

class SpreadCircle {
    constructor(playerTargeted,
                size, goesOffIn) {
        // 1 for you, 2 for the dragoon, 3 for the sage, and 4 for the warrior
        this.player = playerTargeted
        this.x = 0
        this.y = 0
        this.size = size
        this.goesOffAt = goesOffIn + millis()
        this.opacity = 200 // prematurely set the opacity high
        this.wentOff = false
    }

    // checks if the spread circle has gone off, and if it has, it does some
    // special work
    update() {
        if (millis() > this.goesOffAt) {
            // when it goes off, check if anyone is in the vicinity
            if (!this.wentOff) {
                this.wentOff = true
                // set the
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
                    // if anyone clips anyone else with spread, the party wipes
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
        // 1 for you, 2 for the dragoon, 3 for the sage, and 4 for the warrior
        this.player = playerTargeted
        this.x = 0
        this.y = 0
        this.size = size
        this.goesOffAt = goesOffIn + millis()
        this.opacity = 200 // make the stack circle stay opaque for a little bit
        this.wentOff = false
        this.minPlayers = minPlayers
    }

    update() {
        if (millis() > this.goesOffAt) {
            // when it goes off, check if anyone is in the vicinity
            if (!this.wentOff) {
                this.wentOff = true
                // have the stack circle leap to the player needed
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
                    // check for anyone in the vicinity
                    // if someone has been hit in the last second by spread/stack,
                    // then boom, dead
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
            // if this is the first time it's been updated since it's been
            // supposed to go off, check if the tower was soaked
            if (this.wentOff === false) {
                // iterate through every person to see if they soaked the tower
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

            // at the end of the day, just make sure we know that it went off
            this.wentOff = true
        }
    }

    displayTower() {
        if (!this.wentOff) {
            // display a small soak tower
            stroke(this.color[0], this.color[1], this.color[2])
            strokeWeight(1)
            noFill()
            circle(this.x, this.y, this.size*2)

            // display how many seconds left
            fill(this.color[0], this.color[1], this.color[2])
            noStroke()
            text(ceil((this.goesOffAt - millis())/1000), this.x - 10, this.y + 10)
        } if (this.wentOff && this.soaked) {
            // if it has been soaked, then display it as a thick soak tower to
            // show that it's been soaked
            stroke(this.color[0], this.color[1], this.color[2], this.opacity)
            strokeWeight(5)
            noFill()
            circle(this.x, this.y, this.size*2)
        } if (this.wentOff && !this.soaked) {
            // if it hasn't been soaked, then display a thick expanding circle
            // telling you that it wasn't soaked
            stroke(this.color[0], this.color[1], this.color[2], this.opacity)
            strokeWeight(10)
            noFill()
            circle(this.x, this.y, this.size*2 + (150 - this.opacity)*8)

            // a thin expanding circle as well that expands a little faster
            strokeWeight(1)
            circle(this.x, this.y, max(this.size*2 + (150 - this.opacity)*10, 0))
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
        this.angleOfLine = degrees(atan2(this.y2 - this.y1, this.x2 - this.x1))
        this.opacity = -5
        print(this.angleOfLine)
    }

    // normally it updates the opacity, but this time it updates
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
        // Display the water line. To mimic the effect in the actual mechanic,
        // I need to display multiple lines, some thinner than the others. Of
        // course, the thinnest ones are displayed last.

        // Stage one is just a sall blue line soaked in water.
        let linesForStageOne = [
            { // Low-opacity line. Mimics a small puddle of water.
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 10,
                "thickness": 20, // 20 might seem like a lot, but that's not true.
            }, { // Medium-opacity line. I'm trying to ease into blue.
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 13,
            }, { // Another medium-opacity line. Just easing into blue more.
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 7,
            }, { // Just a small blue line.
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 1,
            }
        ]

        // Stage two has to make the line glow a little bit. It also makes
        // the puddle bigger.
        let linesForStageTwo = [
            // The first 4 of these are the same (except thicker) as in stage 1.
            {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 10,
                "thickness": 20,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 13,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 7,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 1,
            },

            // Then we have a short transition to yellow.

        ]

        switch (this.stage) {
            case 1:
                for (let lineData of linesForStageOne) {
                    stroke(lineData.hue, lineData.saturation,
                        lineData.brightness, lineData.opacity)
                    strokeWeight(lineData.thickness)
                    line(this.x1, this.y1, this.x2, this.y2)
                }
                break
            case 2:
                stroke(200, 80, 100, 10)
                strokeWeight(60)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(40)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(28)
                line(this.x1, this.y1, this.x2, this.y2)
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
                stroke(200, 80, 100, 10)
                strokeWeight(80)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(50)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(37)
                line(this.x1, this.y1, this.x2, this.y2)
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
                stroke(200, 80, 100, 10)
                strokeWeight(100)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(70)
                line(this.x1, this.y1, this.x2, this.y2)
                stroke(200, 80, 100, 30)
                strokeWeight(55)
                line(this.x1, this.y1, this.x2, this.y2)
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
            // for some reason, you need to rotate the angle of the line
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
        // same here
        line(this.x1 + (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y1 - (40*this.iterations - 20)*cos(this.angleOfLine),
             this.x2 + (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y2 - (40*this.iterations - 20)*cos(this.angleOfLine))
        line(this.x1 - (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y1 + (40*this.iterations - 20)*cos(this.angleOfLine),
             this.x2 - (40*this.iterations - 20)*sin(this.angleOfLine),
             this.y2 + (40*this.iterations - 20)*cos(this.angleOfLine))
        strokeWeight(23)

        // now we display the line that helps you figure out which direction it's going
        stroke(200, 100, 100, (helper) ? max(30, this.opacity + 10) : this.opacity + 10)
        line(this.x1 + (millis() - this.wentOffAt - 100)/37.5*sin(this.angleOfLine),
             this.y1 - (millis() - this.wentOffAt - 100)/37.5*cos(this.angleOfLine),
             this.x2 + (millis() - this.wentOffAt - 100)/37.5*sin(this.angleOfLine),
             this.y2 - (millis() - this.wentOffAt - 100)/37.5*cos(this.angleOfLine))
        line(this.x1 - (millis() - this.wentOffAt - 100)/37.5*sin(this.angleOfLine),
             this.y1 + (millis() - this.wentOffAt - 100)/37.5*cos(this.angleOfLine),
             this.x2 - (millis() - this.wentOffAt - 100)/37.5*sin(this.angleOfLine),
             this.y2 + (millis() - this.wentOffAt - 100)/37.5*cos(this.angleOfLine))
    }
}
