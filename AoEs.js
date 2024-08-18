
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
            AoE.opacity -= 0.05
        }
    }
    // if it did go off, then we leave that to the one that's calling the
    // function to handle.
}

// From M2S and M2 (Arcadion), we have group bees that have late-telegraphed
// line AoEs towards the direction the arrow is pointing.
class GroupBee {
    constructor(posX, posY, // the initial position of the group bee
                spawnAngle, // the angle it spawned in relative to the center
                spawnsInMillis) { // the number of ms the bee spawns in
        this.x = posX - 700
        this.y = posY - 300
        this.angle = spawnAngle
        this.arrowAngle = 0
        this.destX = 0
        this.destY = 0
        this.spawnsAt = millis() + spawnsInMillis
        this.telegraphsArrowAt = this.spawnsAt + 3500
        this.displaysLineAoEAt = this.telegraphsArrowAt + 5000
        this.arrowDisappearsAt = this.displaysLineAoEAt + 1000
        this.madeLineAOE = false
        this.decidedArrowPosition = false
    }

    update() {
        if (millis() > this.displaysLineAoEAt) {
            if (!this.madeLineAOE) {
                AoEs.push(new LineAOE(
                    this.x + 700, this.y + 300, this.destX + 700, this.destY + 300,
                    100, 1000))
                this.madeLineAOE = true
            }
        } if (millis() > this.telegraphsArrowAt) {
            if (!this.decidedArrowPosition) {
                // the arrow angle is always towards you
                this.arrowAngle = atan2(posY - 300 - this.y, posX - 700 - this.x)
                angleMode(RADIANS)
                this.destX = this.x + cos(this.arrowAngle)*580
                this.destY = this.y + sin(this.arrowAngle)*580

                this.decidedArrowPosition = true
            }
        }
    }

    displayAoE() {
        if (millis() < this.arrowDisappearsAt) {
            if (millis() > this.spawnsAt) {
                // display a cute little bee after this.spawnsAt
                // start with a yellow rectangle
                fill(50, 100, 90)
                rect(this.x - 10, this.y - 17, 20, 34)

                // display 2 stripes at the bottom
                fill(0, 0, 0)
                rect(this.x - 10, this.y + 3, 20, 5)
                rect(this.x - 10, this.y + 10, 20, 5)

                // display an eye as a circle
                circle(this.x + 5, this.y - 10, 6)

                // then display a green arrow if it's time
                // it gets much brighter as it moves out, but much thinner
                // as well
                if (millis() > this.telegraphsArrowAt) {
                    stroke(120, 50, 50)
                    strokeWeight(10)
                    line(this.x, this.y,
                         this.x + cos(this.arrowAngle)*210, this.y + sin(this.arrowAngle)*210)
                    stroke(120, 50, 70)
                    strokeWeight(5)
                    line(this.x + cos(this.arrowAngle)*210, this.y + sin(this.arrowAngle)*210,
                         this.x + cos(this.arrowAngle)*250, this.y + sin(this.arrowAngle)*250)
                    stroke(120, 50, 90)
                    strokeWeight(3)
                    line(this.x + cos(this.arrowAngle)*250, this.y + sin(this.arrowAngle)*250,
                        this.x + cos(this.arrowAngle)*290, this.y + sin(this.arrowAngle)*290)

                    // if the helper is enabled it draws another line
                    // directly to the destination.
                    if (helper) {
                        stroke(120, 50, 100)
                        strokeWeight(1)
                        line(this.x + cos(this.arrowAngle)*290, this.y + sin(this.arrowAngle)*290,
                             this.destX, this.destY)
                    }

                    noStroke()
                }
            }
        }
    }
}

// Displays a circle-shaped AoE on the screen
class CircleAOE {
    constructor(posX, posY, size, goesOffInMillis, isTelegraphed) {
        this.x = posX - 700
        this.y = posY - 300
        this.diameter = size
        this.goesOffAt = millis() + goesOffInMillis
        this.createdAt = millis()
        this.opacity = 0
        this.stopAccumulatingOpacity = false
        this.isTelegraphed = isTelegraphed
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
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": "You got hit by a circle.", "color": [0, 80, 80]}
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
            circle(this.x, this.y, this.diameter)
        }
    }

    // displays the orange version of the AoE.
    displayAoE() {
        if (this.isTelegraphed) {
            fill(20, 100, 100, this.opacity)
            circle(this.x, this.y, this.diameter)

            // we also have the highlight
            // moves from inner to outer
            noFill()
            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 5) % (this.diameter + 10),
                    4 * this.diameter / 5, this.diameter + 5, this.opacity / 2, 0))
            strokeWeight(5)
            circle(this.x, this.y, ((millis() - this.createdAt) / 5) % (this.diameter + 10))

            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 5) % (this.diameter + 10),
                    4 * this.diameter / 5, this.diameter + 5, this.opacity / 4, 0))
            strokeWeight(10)
            circle(this.x, this.y, ((millis() - this.createdAt) / 5) % (this.diameter + 10))

            noStroke()
        }
    }
}

class RectAOE {
    constructor(posX, posY, width, height, goesOffInMillis, isTelegraphed) {
        this.x = posX - 700
        this.y = posY - 300
        this.width = width
        this.height = height
        this.goesOffAt = millis() + goesOffInMillis
        this.createdAt = millis()
        this.opacity = 0
        this.stopAccumulatingOpacity = false
        this.isTelegraphed = isTelegraphed
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
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": "You got hit by a rectangle.", "color": [0, 80, 80]}
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 50, min(this.opacity*20, 100)/2)
            rect(this.x, this.y, this.width, this.height)
        }
    }

    // displays the orange version of the AoE.
    displayAoE() {
        if (this.isTelegraphed) {
            fill(20, 100, 100, this.opacity)
            rect(this.x, this.y, this.width, this.height)

            // create a highlighted part, moving from left to right
            noFill()
            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 4) % (this.width + 10),
                    4 * this.width / 5, this.width + 5, this.opacity / 2, 0))
            strokeWeight(5)
            line(this.x + ((millis() - this.createdAt) / 4) % (this.width + 10), this.y,
                this.x + ((millis() - this.createdAt) / 4) % (this.width + 10), this.y + this.height)

            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 4) % (this.width + 10),
                    4 * this.width / 5, this.width + 5, this.opacity / 4, 0))
            strokeWeight(10)
            line(this.x + ((millis() - this.createdAt) / 4) % (this.width + 10), this.y,
                this.x + ((millis() - this.createdAt) / 4) % (this.width + 10), this.y + this.height)

            noStroke()
        }
    }
}

class LineAOE {
    constructor(x1, y1, x2, y2, thickness, goesOffInMillis) {
        this.x1 = x1 - 700
        this.y1 = y1 - 300
        this.x2 = x2 - 700
        this.y2 = y2 - 300
        this.angleOfLine = atan2(this.y2 - this.y1, this.x2 - this.x1)
        this.thickness = thickness
        this.goesOffAt = millis() + goesOffInMillis
        this.opacity = 0
        this.stopAccumulatingOpacity = false
        this.wentOff = false
        this.youGotHitByLineAOE = false
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

            if (!this.wentOff) {
                this.wentOff = true

                // we see whether you got hit
                // find the center of the line
                // find the length as well
                let centerX = (this.x1 + this.x2)/2
                let centerY = (this.y1 + this.y2)/2
                let l = sqrt((this.x2 - this.x1)**2 + (this.y2 - this.y1)**2)

                // the approach will be to translate the center of the line
                // to the origin (0, 0) and rotate the line so that it is
                // horizontal, and then calculate from there

                // let's translate your position first, and then find your
                // angle and distance from the center
                let posXTranslated = posX - centerX - 700
                let posYTranslated = posY - centerY - 300
                let distFromCent = sqrt(posXTranslated**2 + posYTranslated**2)
                let angle = atan2(posYTranslated, posXTranslated)

                // rotate your position around the origin, calculating the
                // final position with distFromCenter and angle
                let posXRotated = cos(angle - this.angleOfLine)*distFromCent
                let posYRotated = sin(angle - this.angleOfLine)*distFromCent

                // now check if that is within the rectangle (width of l,
                // height of thickness)
                if (posXRotated < l/2 &&
                    posXRotated > -l/2 &&
                    posYRotated < this.thickness/2 &&
                    posYRotated > -this.thickness/2) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a line AOE."
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": "You got hit by a line.", "color": [0, 80, 80]}
                    this.youGotHitByLineAOE = true
                }
            }
        }
    }

    // displays the orange version of the AoE.
    displayAoE() {
        if (this.goesOffAt > millis()) {
            stroke(20, 100, 100, this.opacity)
            strokeWeight(this.thickness)
            line(this.x1, this.y1, this.x2, this.y2)
        } else {
            // in Alarm Pheremones, getting hit by one of these gets
            // you knocked back to x2, y2, 5 pixels every frame
            // since we already displayed the line AOE in update(), all we
            // need to do is update your position to be knocked back (Alarm
            // Pheremones only)
            if (mechanic === "Alarm Pheremones" && this.youGotHitByLineAOE) {
                // if you're within 20 pixels of the destination of the line
                // AOE you stop getting knocked back. turning off
                // this.youGotHitByLineAOE effectively achieves that
                if ((posX - this.x2 - 700)**2 + (posY - this.y2 - 300)**2 < 400) {
                    this.youGotHitByLineAOE = false
                    posX = min(984, max(posX, 416))
                    posY = min(584, max(posY, 16))
                } else {
                    // otherwise, you get knocked back towards x2, y2,
                    // faster the closer you are
                    let angleFromSecondCoordinate =
                        atan2(posY - this.y2 - 300, posX - this.x2 - 700)
                    let distFromSecondCoordinate = sqrt((posX - this.x2 - 700)**2 + (posY - this.y2 - 300)**2)
                    posX -= cos(angleFromSecondCoordinate)*(2000/distFromSecondCoordinate)
                    posY -= sin(angleFromSecondCoordinate)*(2000/distFromSecondCoordinate)
                }
            }
        }
    }
}

class DonutAOE {
    constructor(posX, posY, size, goesOffInMillis, isTelegraphed) {
        this.x = posX - 700
        this.y = posY - 300
        this.size = size
        this.goesOffAt = millis() + goesOffInMillis
        this.createdAt = millis()
        this.opacity = 0
        this.stopAccumulatingOpacity = false
        this.isTelegraphed = isTelegraphed
    }

    // update the AoE by checking whether it's gone off and updating its
    // opacity.
    update() {
        updateOpacity(this)
        angleMode(RADIANS)
        if (this.goesOffAt < millis()) {
            if (this.opacity === 5) {
                // if your distance from the center of the donut is bigger than
                // the radius of the donut hole, then the party wipes because
                // you got hit.
                if (sqrt((posX - this.x)**2 + (posY - this.y)**2) > this.size) {
                    partyWiped = true
                    causeOfWipe = "You got hit by a donut."
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": "You got hit by a donut.", "color": [0, 80, 80]}
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 100, min(this.opacity*20, 100)/2)
            beginShape()
            vertex(-300, -300)
            vertex(300, -300)
            vertex(300, 300)
            vertex(-300, 300)
            beginContour()
            for (let angle = TWO_PI; angle > 0; angle -= TWO_PI/60) {
                let x = this.x + cos(angle) * this.size
                let y = this.y + sin(angle) * this.size
                vertex(x, y)
            }
            endContour()
            endShape(CLOSE)
        }
    }

    // displays the orange version of the AoE.
    displayAoE() {
        if (this.isTelegraphed) {
            // the only way to display a donut is to have a beginShape rectangle
            // and manually display a circle in the contour.
            fill(20, 100, 100, this.opacity)
            beginShape()
            vertex(-300, -300)
            vertex(300, -300)
            vertex(300, 300)
            vertex(-300, 300)
            beginContour()
            for (let angle = TWO_PI; angle > 0; angle -= TWO_PI / 60) {
                let x = this.x + cos(angle) * this.size
                let y = this.y + sin(angle) * this.size
                vertex(x, y)
            }
            endContour()
            endShape(CLOSE)

            // then add a highlight
            // now, you might not know how we're going to highlight a donut.
            // this is understandable, because it's quite complex.
            // we're going to start with the inner 60 points of the circle, and
            // then lerp those to the outer points repeatedly every 3s.

            // first we figure out the num millis the highlight has been lerping
            // to the outside for, and the progress in the lerp.
            let millisSinceHighlightAppeared = (millis() - this.createdAt) % 2000
            let lerpProgress = millisSinceHighlightAppeared / 2000

            // then make a list of the end points of the lerp and the starting
            // points of the lerp.
            // the starting points are the points along the inner circle. for
            // that, we use the same code we did earlier to display the hole of
            // the donut, except without the contour and vertex shenanigans and
            // instead appending x and y to the list.
            let startingXPoints = []
            let startingYPoints = []
            for (let angle = TWO_PI; angle > 0; angle -= TWO_PI / 60) {
                startingXPoints.push(this.x + cos(angle) * this.size)
                startingYPoints.push(this.y + sin(angle) * this.size)
            }

            // the ending points are the points along the outside. since there
            // must be 60 points evenly distributed across the outside of the
            // arena, there must be 14 points on each side and 1 point on each
            // corner.
            // we will start at the right, then make our way counterclockwise to
            // the point right before the right point in order to minimize
            // random rotation in the highlight.
            // since there is no middle right point (the closest we can get to
            // 300, 0 is 300, -20 or 300, 20 without breaking our points), we'll
            // start at 300, -20 for smoother rotation
            let endingXPoints = [
                300, 300, 300, 300, 300, 300, 300, 290,         // top part of right side + top-right corner
                260, 220, 180, 140, 100, 60, 20,                // right part of top side
                -20, -60, -100, -140, -180, -220, -260, -290,   // left part of top side + top-left corner
                -300, -300, -300, -300, -300, -300, -300,       // top part of left side
                -300, -300, -300, -300, -300, -300, -300, -290, // bottom part of left side + bottom-left corner
                -260, -220, -180, -140, -100, -60, -20,         // left part of bottom side
                20, 60, 100, 140, 180, 260, 290,                // right part of bottom side + bottom-right corner
                300, 300, 300, 300, 300, 300, 300               // bottom part of right side
            ]
            let endingYPoints = [
                -20, -60, -100, -140, -180, -220, -260, -290,   // top part of right side + top-right corner
                -300, -300, -300, -300, -300, -300, -300,       // right part of top side
                -300, -300, -300, -300, -300, -300, -300, -290, // left part of top side + top-left corner
                -260, -220, -180, -140, -100, -60, -20,         // top part of left side
                20, 60, 100, 140, 180, 260, 290,                // bottom part of left side + bottom-left corner
                300, 300, 300, 300, 300, 300, 300,              // left part of bottom side
                300, 300, 300, 300, 300, 300, 300, 290,         // right part of bottom side + bottom-right corner
                260, 220, 180, 140, 100, 60, 20,                // bottom part of right side
            ]

            // our highlight has less and less opacity starting from
            // lerpProgress=0.8, until it reaches lerpProgress=0.99 where the
            // highlight completely disappears.
            stroke(20, 100, 100,
                map(lerpProgress, 0.8, 0.99, this.opacity / 2, 0))
            noFill()
            strokeWeight(5)

            // we display all 60 points
            beginShape()
            for (let i = 0; i < 60; i++) {
                let startingX = startingXPoints[i]
                let startingY = startingYPoints[i]
                let endingX = endingXPoints[i]
                let endingY = endingYPoints[i]
                let x = map(lerpProgress, 0, 1, startingX, endingX)
                let y = map(lerpProgress, 0, 1, startingY, endingY)
                vertex(x, y)
            }
            endShape(CLOSE)

            noStroke()
        }
    }
}

class ConeAOE {
    constructor(posX, posY, size, startingAngle, endingAngle, goesOffInMillis, isTelegraphed) {
        this.x = posX - 700
        this.y = posY - 300
        this.size = size
        this.startAngle = startingAngle
        this.endAngle = endingAngle
        this.goesOffAt = millis() + goesOffInMillis
        this.createdAt = millis()
        this.opacity = 0
        this.stopAccumulatingOpacity = false
        this.isTelegraphed = isTelegraphed
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
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": "You got hit by a cone.", "color": [0, 80, 80]}
                }
            }
            this.opacity -= 0.2
            fill(0, 100, 100, min(this.opacity*20, 100)/2)
            arc(this.x, this.y, this.size, this.size, radians(this.startAngle), radians(this.endAngle))
        }
    }

    // displays the orange version of the AoE.
    displayAoE() {
        if (this.isTelegraphed) {
            fill(20, 100, 100, this.opacity)
            arc(this.x, this.y, this.size, this.size, radians(this.startAngle), radians(this.endAngle))

            // then highlight part of it, moving out
            // it disappears as it moves out
            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 3) % (this.size + 10),
                    4 * this.size / 5, this.size + 5, this.opacity / 2, 0))
            strokeWeight(5)
            noFill()
            arc(this.x, this.y,
                ((millis() - this.createdAt) / 3) % (this.size + 10),
                ((millis() - this.createdAt) / 3) % (this.size + 10),
                radians(this.startAngle), radians(this.endAngle))
            noStroke()

            // there's a lesser but thicker highlighting over that
            stroke(20, 100, 100,
                map(((millis() - this.createdAt) / 3) % (this.size + 10),
                    4 * this.size / 5, this.size + 5, this.opacity / 4, 0))
            strokeWeight(10)
            noFill()
            arc(this.x, this.y,
                ((millis() - this.createdAt) / 3) % (this.size + 10),
                ((millis() - this.createdAt) / 3) % (this.size + 10),
                radians(this.startAngle), radians(this.endAngle))
            noStroke()
        }
    }
}

class Exaflare {
    constructor(startingPosX, startingPosY, startingSize, goesOffInMillis, xDelta, yDelta, sizeDelta, timeDelta) {
        this.prevX = startingPosX - 700
        this.prevY = startingPosY - 300
        this.prevCircleOpacity = 10
        this.x = startingPosX - 700
        this.y = startingPosY - 300
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

            if (sqrt(abs(this.x - posX + 700)**2 + abs(this.y - posY + 300)**2) < this.size/2 + 16) {
                partyWiped = true
                causeOfWipe = "You got hit by an exaflare."
                logWindowRow6 = logWindowRow5
                logWindowRow5 = logWindowRow4
                logWindowRow4 = logWindowRow3
                logWindowRow3 = logWindowRow2
                logWindowRow2 = logWindowRow1
                logWindowRow1 = {"text": "You got hit by an exaflare.", "color": [0, 80, 80]}
            }
        } if (this.wentOff && millis() > this.goesOffAt + this.millisBetween*this.iterations) {
            this.iterations += 1
            this.prevCircleOpacity = this.opacity
            this.opacity = 50
            this.prevX = this.x
            this.prevY = this.y
            this.x += this.xDiff
            this.y += this.yDiff
            this.size += this.sizeDiff

            if (sqrt(abs(this.x - posX + 700)**2 + abs(this.y - posY + 300)**2) < this.size/2 + 16) {
                partyWiped = true
                causeOfWipe = "You got hit by an exaflare."
                logWindowRow6 = logWindowRow5
                logWindowRow5 = logWindowRow4
                logWindowRow4 = logWindowRow3
                logWindowRow3 = logWindowRow2
                logWindowRow2 = logWindowRow1
                logWindowRow1 = {"text": "You got hit by an exaflare.", "color": [0, 80, 80]}
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
                let executedCorrectly = true
                // set the
                if (this.player === 1) { // 1 is you
                    this.x = posX - 700
                    this.y = posY - 300
                } if (this.player === 2) { // 2 is the dragoon
                    this.x = drgPosX - 700
                    this.y = drgPosY - 300
                } if (this.player === 3) { // 3 is the sage
                    this.x = sgePosX - 700
                    this.y = sgePosY - 300
                } if (this.player === 4) { // 4 is the warrior
                    this.x = warPosX - 700
                    this.y = warPosY - 300
                }
                for (let position of [
                    [posX, posY, 1],
                    [drgPosX, drgPosY, 2],
                    [sgePosX, sgePosY, 3],
                    [warPosX, warPosY, 4]
                ]) {
                    // if anyone clips anyone else with spread, the party wipes
                    if (sqrt((this.x - position[0] + 700)**2 + (this.y - position[1] + 300)**2) < this.size/2) {
                        lastHitBy[position[2]] = ["spread", millis()]
                        print(lastHitBy)
                        if (position[2] !== this.player) {
                            partyWiped = true
                            causeOfWipe = "Someone clipped someone else with spread."
                            executedCorrectly = false
                            logWindowRow6 = logWindowRow5
                            logWindowRow5 = logWindowRow4
                            logWindowRow4 = logWindowRow3
                            logWindowRow3 = logWindowRow2
                            logWindowRow2 = logWindowRow1
                            logWindowRow1 = {"text": `Player ${this.player} clipped player ${position[2]} with spread.`, "color": [0, 80, 80]}
                        }
                    }
                }
                if (executedCorrectly) {
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {"text": `Player ${this.player}'s spread didn't clip anyone else.`, "color": [144, 80, 80]}
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
                let executedCorrectly = true
                // have the stack circle leap to the player needed
                if (this.player === 1) { // 1 is you
                    this.x = posX - 700
                    this.y = posY - 300
                }
                if (this.player === 2) { // 2 is the dragoon
                    this.x = drgPosX - 700
                    this.y = drgPosY - 300
                }
                if (this.player === 3) { // 3 is the sage
                    this.x = sgePosX - 700
                    this.y = sgePosY - 300
                }
                if (this.player === 4) { // 4 is the warrior
                    this.x = warPosX - 700
                    this.y = warPosY - 300
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
                    if (sqrt((this.x - position[0] + 700) ** 2 + (this.y - position[1] + 300) ** 2 + 300) < this.size / 2) {
                        if (lastHitBy[position[2]][1] > millis() - 1000) {
                            partyWiped = true
                            executedCorrectly = false
                            causeOfWipe = "2 stack people stacked up."
                            logWindowRow6 = logWindowRow5
                            logWindowRow5 = logWindowRow4
                            logWindowRow4 = logWindowRow3
                            logWindowRow3 = logWindowRow2
                            logWindowRow2 = logWindowRow1
                            logWindowRow1 = {
                                "text": `Player ${position[2]} got hit by 2 stacks.`,
                                "color": [0, 80, 80]
                            }
                        }
                        lastHitBy[position[2]] = ["stack", millis()]
                        print(lastHitBy)
                        playersHit += 1
                    }
                }
                if (playersHit < this.minPlayers) {
                    // if less than the minimum players have stacked up, one dies
                    partyWiped = true
                    executedCorrectly = false
                    causeOfWipe = "Too little people stacked up."
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {
                        "text": `Only ${playersHit} of ${this.minPlayers} got hit by player ${this.player}'s stack.`,
                        "color": [0, 80, 80]
                    }
                }
                if (executedCorrectly) {
                    logWindowRow6 = logWindowRow5
                    logWindowRow5 = logWindowRow4
                    logWindowRow4 = logWindowRow3
                    logWindowRow3 = logWindowRow2
                    logWindowRow2 = logWindowRow1
                    logWindowRow1 = {
                        "text": `Player ${this.player}'s stack was resolved correctly.`,
                        "color": [144, 80, 80]
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

class WaterLine {
    constructor(x1, y1, x2, y2, growingTimes) {
        this.x1 = x1 - 700
        this.y1 = y1 - 300
        this.x2 = x2 - 700
        this.y2 = y2 - 300
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
                "thickness": 60,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 40,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 28,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 15,
            },

            // Then we have a short transition to yellow.
            { // teal
                "hue": 150,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 9,
            }, { // green
                "hue": 120,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 8,
            }, { // yellow
                "hue": 45,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 5,
            },

            // Then white to make it glow.
            {
                "hue": 0,
                "saturation": 0,
                "brightness": 100,
                "opacity": 100,
                "thickness": 1,
            },
        ]

        // A little bigger than stage two.
        let linesForStageThree = [
            {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 10,
                "thickness": 80,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 50,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 37,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 25,
            }, {
                "hue": 150,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 15,
            }, {
                "hue": 120,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 13,
            }, {
                "hue": 45,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 10,
            }, {
                "hue": 0,
                "saturation": 0,
                "brightness": 100,
                "opacity": 100,
                "thickness": 3,
            },
        ]



        // A little bigger than stage three.
        let linesForStageFour = [
            {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 10,
                "thickness": 100,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 70,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 30,
                "thickness": 55,
            }, {
                "hue": 200,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 35,
            }, {
                "hue": 150,
                "saturation": 80,
                "brightness": 100,
                "opacity": 100,
                "thickness": 25,
            }, {
                "hue": 120,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 23,
            }, {
                "hue": 45,
                "saturation": 100,
                "brightness": 100,
                "opacity": 100,
                "thickness": 17,
            }, {
                "hue": 0,
                "saturation": 0,
                "brightness": 100,
                "opacity": 100,
                "thickness": 7,
            },
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
                for (let lineData of linesForStageTwo) {
                    stroke(lineData.hue, lineData.saturation,
                        lineData.brightness, lineData.opacity)
                    strokeWeight(lineData.thickness)
                    line(this.x1, this.y1, this.x2, this.y2)
                }
                break
            case 3:
                for (let lineData of linesForStageThree) {
                    stroke(lineData.hue, lineData.saturation,
                        lineData.brightness, lineData.opacity)
                    strokeWeight(lineData.thickness)
                    line(this.x1, this.y1, this.x2, this.y2)
                }
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

// This rectangle AoE persists for some amount of time. Untelegraphed.
class PersistingRectangleAOE {
    constructor(x, y, w, h, millisUntilActivation, millisUntilActivationEnds) {
        this.x = x - 700
        this.y = y - 300
        this.w = w
        this.h = h
        this.activateAt = millis() + millisUntilActivation
        this.endActivation = millis() + millisUntilActivationEnds
    }

    displayAoE() {
        // just display if the milliseconds is in between when it's supposed to
        // activate and when it's supposed to stop activating
        if (this.activateAt < millis() && millis() < this.endActivation) {
            fill(180, 100, 100, 50)
            noStroke()
            rect(this.x, this.y, this.w, this.h)

            // if you are in it, though, party wipe (you're dead)!
            // the rectangle AoE is 20 bigger than it looks because it has to
            // account for just your symbol, not your center, touching the AoE.
            if (posX > this.x - 710 && posX < this.x + this.w - 290 &&
                posY > this.y - 310 && posY < this.y + this.h - 290) {
                inRectangleAoE = true
                partyWiped = true
                causeOfWipe = "You are in a persisting rectangle AoE."
            }
        }
    }
}
