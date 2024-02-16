/**
 *  @author Cody
 *  @date 2024.01.09
 *
 */

// an enum for facing and general direction in degrees
class Direction {
    static Right = new Direction(0)
    static RightTiltedDown = new Direction(22)
    static BottomRight = new Direction(45)
    static DownTiltedRight = new Direction(68)
    static Down = new Direction(90)
    static DownTiltedLeft = new Direction(112)
    static BottomLeft = new Direction(135)
    static LeftTiltedDown = new Direction(158)
    static Left = new Direction(180)
    static LeftTiltedUp = new Direction(202)
    static TopLeft = new Direction(225)
    static UpTiltedLeft = new Direction(248)
    static Up = new Direction(270)
    static UpTiltedRight = new Direction(292)
    static TopRight = new Direction(315)
    static RightTiltedUp = new Direction(338)

    constructor(angle) {
        this.angle = angle
        this.onDiagonal = !((this.angle === 0) || (this.angle === 90) || (this.angle === 180) || (this.angle === 270))
    } rotateToDirection() {
        rotate(radians(this.angle))
    }
}

let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

// everyone's facing starts up
let yourFacing = Direction.Up
let drgFacing = Direction.Up
let sgeFacing = Direction.Up
let warFacing = Direction.Up

// everyone starts in the middle and the boss goes out the canvas
let posX = 700
let posY = 300
let drgPosX = 700
let drgPosY = 300
let sgePosX = 700
let sgePosY = 300
let warPosX = 700
let warPosY = 300
let bossPosX = -100
let bossPosY = -100

let drgSymbol
let rdmSymbol
let sgeSymbol
let warSymbol

let engaged = false
let engagedAt = 100000000000

let partyWiped = false
let causeOfWipe = ""

let exoflares
let helper
let AoEs

let blueSoakTowers
let orangeSoakTowers
let directionOfBlue
let rotatePlayers
let topRightIsBlue
let topLeftIsBlue
let bottomRightIsBlue
let bottomLeftIsBlue
let areThereTriples
let majorityRed
let triplesGivenTo
let triplesNotGivenTo
let droppedTowers

let swapMovement // whether the top-right or top-left is originally safe, basically
let stackFirst // do we stack first or spread first?
let whoGetsStack // who got "stack"?
let swap // only used for sage: did both DPS or both supports get it?
let rotateExaflares // the exaflares could be on the north and south or on the east and west

let lastHitBy // Keeps track of what and when each character suffered an AoE

let mechanic // keeps track of what mechanic we're practicing
let mechanicStarted

let bossFacing
let cleaveOneColor
let cleaveOneSafeDirection
let cleaveTwoColor
let cleaveTwoSafeDirection
let cleaveThreeColor
let cleaveThreeSafeDirection
let firstAoEResolved
let secondAoEResolved
let thirdAoEResolved

let circleResolved
let topLeftCrossExpandsFirst // whether the top-left to bottom-right cross expands first or the bottom-left to top-right one
let northLineExpandsFirst // whether the top horizontal line expands first or the bottom horizontal line
let tetheredPlayer
let jumpResolved

let linesInOrderOfResolvingOrder

// there's some noise from cos() and sin(). this only matters for 0.
function normalize(value, threshold) {
    if (Math.abs(value) < threshold) return 0;
    return value;
}

// mixes Left, Up, Right, and Down
function mixDirections(directions) {
    if (directions.length === 1) { // this is simple. return the same direction!
        return directions[0]
    } else {
        // otherwise, sum up all the directions
        angleMode(DEGREES)
        // calculate the cosine and sine of every direction
        let xDiff = 0
        let yDiff = 0
        for (let i = 0; i < directions.length; i++) {
            let cosForDirection = cos(directions[i].angle)
            let sinForDirection = sin(directions[i].angle)
            xDiff += normalize(cosForDirection, 0.001)
            yDiff += normalize(sinForDirection, 0.001)
        }
        let result = new Direction( // if the degrees are below 0, add 360 to make it positive
            round((atan2(yDiff, xDiff) < 0) ? atan2(yDiff, xDiff) + 360 : atan2(yDiff, xDiff))
        ) // not returning allows us to reset the angle mode
        angleMode(RADIANS)
        return result
    }
}

function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')

    // load the images
    drgSymbol = loadImage("images/Dragoon_Icon_3.png")
    rdmSymbol = loadImage("images/Red_Mage_Icon_3.png")
    sgeSymbol = loadImage("images/Sage_Icon_3.png")
    warSymbol = loadImage("images/Warrior_Icon_3.png")
}


function setup() {
    let cnv = createCanvas(1000, 600)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(variableWidthFont, 14)

    frameRate(62) // keep everything consistent!

    lastHitBy = {
        1: ["None", 0],
        2: ["None", 0],
        3: ["None", 0],
        4: ["None", 0]
    }
    mechanic = "Exoflares"
    mechanicStarted = 0

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    // assign now so that we can position exoflares properly
    swapMovement = random([false, true])
    rotateExaflares = random([false, true])
    stackFirst = random([false, true])
    whoGetsStack = [0, 0]
    whoGetsStack[0] = random([1, 2, 3, 4])
    whoGetsStack[1] = whoGetsStack[0]
    while (whoGetsStack[0] === whoGetsStack[1]) {
        whoGetsStack[1] = random([1, 2, 3, 4])
    }
    whoGetsStack.sort()
    swap = (whoGetsStack[0] === 1 && whoGetsStack[1] === 2) || (whoGetsStack[0] === 3 && whoGetsStack[1] === 4)
    print(swap)

    helper = false
    exoflares = [
        // Add exoflares on the east and west. They go to the top-left and
        // bottom-right if swapMovement is false, and the top-right and
        // bottom-left if swapMovement is true.
        // Or on north and south if rotateExaflares is true!!
        new Exaflare((!rotateExaflares) ? 450 : ((swapMovement) ? 620 : 440),
                     (rotateExaflares) ? 50 : ((swapMovement) ? 220 : 40), 180, 6500, (rotateExaflares) ? 0 : 79, (!rotateExaflares) ? 0 : 79, 0, 1000),
        new Exaflare((!rotateExaflares) ? 950 : ((swapMovement) ? 440 : 620),
                     (rotateExaflares) ? 550 : ((swapMovement) ? 40 : 220), 180, 6500, (rotateExaflares) ? 0 : -79, (!rotateExaflares) ? 0 : -79, 0, 1000),
        new Exaflare((!rotateExaflares) ? 450 : ((swapMovement) ? 960 : 780),
                     (rotateExaflares) ? 50 : ((swapMovement) ? 560 : 380), 180, 6500, (rotateExaflares) ? 0 : 79, (!rotateExaflares) ? 0 : 79, 0, 1000),
        new Exaflare((!rotateExaflares) ? 950 : ((swapMovement) ? 780 : 960),
                     (rotateExaflares) ? 550 : ((swapMovement) ? 380 : 560), 180, 6500, (rotateExaflares) ? 0 : -79, (!rotateExaflares) ? 0 : -79, 0, 1000),
        // These are the cardinal exoflares. They're always in the same
        // orientation.
        new Exaflare(620, 300, 200, 6500, -79, 0, 0, 1000),
        new Exaflare(780, 300, 200, 6500, 79, 0, 0, 1000),
        new Exaflare(700, 380, 200, 6500, 0, 79, 0, 1000),
        new Exaflare(700, 220, 200, 6500, 0, -79, 0, 1000)
    ]


    AoEs = [
        // add the spreads and stacks
        // the millisecond differences are because you can't have them trigger
        // on the same frame if you want to detect if someone else got clipped
        new SpreadCircle(1, 250, (stackFirst) ? 13470 : 8470),
        new SpreadCircle(2, 250, (stackFirst) ? 13490 : 8490),
        new SpreadCircle(3, 250, (stackFirst) ? 13510 : 8510),
        new SpreadCircle(4, 250, (stackFirst) ? 13530 : 8530),
        new StackCircle(whoGetsStack[0], 250, (stackFirst) ? 8490 : 13490, 2),
        new StackCircle(whoGetsStack[1], 250, (stackFirst) ? 8510 : 13510, 2),
    ]
    angleMode(RADIANS)
}


function draw() {
    background(234, 34, 24)


    // add exoflare helper toggle
    if (!helper) {
        fill(0, 0, 25)
        if (mouseX > 0 && mouseX < 230 &&
            mouseY > height - 30 && mouseY < height) fill(0, 0, 20)
        noStroke()
        rect(0, height - 30, 230, 30)
        fill(0, 0, 100)
        text("Enable helper", 5, height - 3)
    }

    // add mechanic buttons
    fill(0, 0, 25)
    stroke(0, 0, 100)
    strokeWeight(1)
    if (mouseX > 0 && mouseX < 77 &&
        mouseY > 390 && mouseY < 410) fill(0, 0, 15)
    rect(-10, 390, 87, 20)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 127 &&
        mouseY > 410 && mouseY < 433) fill(0, 0, 15)
    rect(-10, 410, 137, 23)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 210 &&
        mouseY > 433 && mouseY < 453) fill(0, 0, 15)
    rect(-10, 433, 220, 20)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 151 &&
        mouseY > 453 && mouseY < 476) fill(0, 0, 15)
    rect(-10, 453, 161, 23)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 133 &&
        mouseY > 476 && mouseY < 499) fill(0, 0, 15)
    rect(-10, 476, 143, 23)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 120 &&
        mouseY > 499 && mouseY < 519) fill(0, 0, 15)
    rect(-10, 499, 130, 23)
    fill(0, 0, 25)

    fill(0, 0, 100)
    noStroke()
    textSize(17)
    text("Exoflares", 0, 405)
    text("Fighting Spirits", 0, 428)
    text("Malformed Reincarnation", 0, 448)
    text("Triple Kasumi-Giri", 0, 471)
    text("Fleeting Lai-Giri", 0, 494)
    text("Azure Auspice", 0, 517)

    stroke(0, 0, 0)


    // display a wooden chess board, basically
    // (with red stuff on the outside and a purple entrance on at the bottom)
    if (mechanic === "Exoflares" || mechanic === "Fighting Spirits" || mechanic === "Malformed Reincarnation") { // Gorai
        // draw the red stuff on the outside
        fill(0, 80, 75)
        rect(400, 0, 600, 600)

        // display the purple entrance
        stroke(300, 50, 50)
        strokeWeight(10)
        line(650, 600, 750, 600)
        fill(20, 50, 40)

        // now display the chess board
        noStroke()
        rect(420, 20, 560, 560)
        // display the darker parts of the chess board (just a little darker)
        for (let xIncrements = 0; xIncrements < 8; xIncrements++) {
            for (let yIncrements = 0; yIncrements < 8; yIncrements++) {
                if ((xIncrements + yIncrements) % 2 === 0) {
                    fill(20, 50, 38)
                    rect(421 + xIncrements * 70, 21 + yIncrements * 70, 68, 68)
                }
            }
            stroke(0, 0, 0)
            strokeWeight(1)
            line(420 + xIncrements * 70, 20, 420 + xIncrements * 70, 580) // x line
            line(420, 20 + xIncrements * 70, 980, 20 + xIncrements * 70) // y line
            noStroke()
        }
        stroke(0, 0, 0)
        strokeWeight(1)
        line(980, 20, 980, 580) // total bottom x line
        line(420, 580, 980, 580) // total right y line
    } if (mechanic === "Triple Kasumi-Giri" || mechanic === "Fleeting Lai-Giri" || mechanic === "Azure Auspice") { // Moko
        let rowHeight = 600/19 // there are 19 rows and 20 columns
        let columnWidth = 600/20
        fill(0, 0, 50)
        rect(400, 0, 600, 600)
        stroke(0, 0, 0)

        for (let yIncrements = 1; yIncrements < 20; yIncrements++) {
            // draw this part of the board:
            //____________________ 1
            // __  __  __  __  __  2
            //____________________ 3
            //____________________ 4
            // __  __  __  __  __  5
            //____________________ 6
            //____________________ 7
            // __  __  __  __  __  8
            //____________________ 9
            //____________________ 10
            // __  __  __  __  __  11
            //____________________ 12
            //____________________ 13
            // __  __  __  __  __  14
            //____________________ 15
            //____________________ 16
            // __  __  __  __  __  17
            //____________________ 18
            //____________________ 19
            // these are all the horizontal lines
            if ([1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19].includes(yIncrements)) {

                line(400, rowHeight*yIncrements, 1000, rowHeight*yIncrements) // straight line across
            } else { // many fragmented lines across
                line(400 + columnWidth, rowHeight * yIncrements, 400 + columnWidth * 3, rowHeight * yIncrements)
                line(400 + columnWidth * 5, rowHeight * yIncrements, 400 + columnWidth * 7, rowHeight * yIncrements)
                line(400 + columnWidth * 9, rowHeight * yIncrements, 400 + columnWidth * 11, rowHeight * yIncrements)
                line(400 + columnWidth * 13, rowHeight * yIncrements, 400 + columnWidth * 15, rowHeight * yIncrements)
                line(400 + columnWidth * 17, rowHeight * yIncrements, 400 + columnWidth * 19, rowHeight * yIncrements)
            }


            // display this section of the board:

            //                     1
            // | ||| ||| ||| ||| | 2
            // | ||| ||| ||| ||| | 3
            //                     4
            // | ||| ||| ||| ||| | 5
            // | ||| ||| ||| ||| | 6
            //                     7
            // | ||| ||| ||| ||| | 8
            // | ||| ||| ||| ||| | 9
            //                     10
            // | ||| ||| ||| ||| | 11
            // | ||| ||| ||| ||| | 12
            //                     13
            // | ||| ||| ||| ||| | 14
            // | ||| ||| ||| ||| | 15
            //                     16
            // | ||| ||| ||| ||| | 17
            // | ||| ||| ||| ||| | 18
            //                     19
            if ([1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17].includes(yIncrements)) {
                line(400 + columnWidth, rowHeight * yIncrements,
                     400 + columnWidth, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 3, rowHeight * yIncrements,
                     400 + columnWidth * 3, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 4, rowHeight * yIncrements,
                     400 + columnWidth * 4, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 5, rowHeight * yIncrements,
                     400 + columnWidth * 5, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 7, rowHeight * yIncrements,
                     400 + columnWidth * 7, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 8, rowHeight * yIncrements,
                     400 + columnWidth * 8, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 9, rowHeight * yIncrements,
                     400 + columnWidth * 9, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 11, rowHeight * yIncrements,
                     400 + columnWidth * 11, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 12, rowHeight * yIncrements,
                     400 + columnWidth * 12, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 13, rowHeight * yIncrements,
                     400 + columnWidth * 13, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 15, rowHeight * yIncrements,
                     400 + columnWidth * 15, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 16, rowHeight * yIncrements,
                     400 + columnWidth * 16, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 17, rowHeight * yIncrements,
                     400 + columnWidth * 17, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 19, rowHeight * yIncrements,
                     400 + columnWidth * 19, rowHeight * (yIncrements + 1))
            }
        }

        // we draw a low-opacity border that covers 2 columns and a little less
        // than 2 rows on each side
        fill(120, 80, 50, 20)
        noStroke()
        beginShape()
        vertex(400, 0)
        vertex(400, 600)
        vertex(1000, 600)
        vertex(1000, 0)
        beginContour()
        vertex(400 + columnWidth*2, rowHeight*2 - 3)
        vertex(1000 - columnWidth*2, rowHeight*2 - 3)
        vertex(1000 - columnWidth*2, 600 - rowHeight*2 + 3)
        vertex(400 + columnWidth*2, 600 - rowHeight*2 + 3)
        endContour()
        endShape()
    }


    textSize(30)
    noStroke()
    switch (mechanic) {
        case "Exoflares":
            // update so that people can dodge exoflares!
            // make the sage go to the stack preposition
            // if swap & swapMovement: we move to the bottom-left corner
            // if swap & !swapMovement: we move to the bottom-right corner
            // if !swap & swapMovement: we move to the top-left corner
            // if !swap & !swapMovement: we move to the top-right corner
            if (millis() > mechanicStarted + 3500 && millis() < mechanicStarted + 5100) {
                sgePosY -= (swap) ? -1.35 : 1.35
                sgePosX -= (swapMovement ^ swap) ? -1.25 : 1.25
                sgeFacing = (swap) ? ((swapMovement) ? Direction.LeftTiltedDown : Direction.RightTiltedDown) : ((swapMovement) ? Direction.UpTiltedRight : Direction.UpTiltedLeft)
            }
            // go to corner of exaflare if spread is first
            // same direction as earlier
            if (millis() > mechanicStarted + 5100 && millis() < mechanicStarted + 5500 && !stackFirst) {
                sgePosY -= (swap) ? -1.35 : 1.35
                sgePosX -= (swapMovement ^ swap) ? -1.25 : 1.25
                sgeFacing = (swap) ? ((swapMovement) ? Direction.LeftTiltedDown : Direction.RightTiltedDown) : ((swapMovement) ? Direction.UpTiltedRight : Direction.UpTiltedLeft)
            }
            // go out of the corner exaflare, parallel to how it's moving
            // if it's N/S we move down or up, depending on whether we're top or
            // bottom
            // if it's E/W we move left or right, depending on which corner
            // we're in
            if (millis() > mechanicStarted + 5500 && millis() < mechanicStarted + 6800 && !stackFirst) {
                if (rotateExaflares) {
                    sgePosY -= (swap) ? -1.3 : 1.3
                    sgeFacing = (swap) ? Direction.Down : Direction.Up
                } else {
                    sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                    sgeFacing = (swapMovement ^ swap) ? Direction.Right : Direction.Left
                }
            }
            // pre-position dragoon and warrior
            // warrior always goes north, dragoon south
            // whether they go east or west is dependent on where the safe spots
            // are
            if (millis() > mechanicStarted + 4900 && millis() < mechanicStarted + 6500) {
                warPosY -= 1.3
                warPosX -= (swapMovement) ? -1.3 : 1.3
                warFacing = (swapMovement) ? Direction.TopRight : Direction.TopLeft
                drgPosY += 1.3
                drgPosX += (swapMovement) ? -1.3 : 1.3
                drgFacing = (swapMovement) ? Direction.BottomLeft : Direction.BottomRight
            }
            // the sage goes to the corner before spread goes off in order to
            // not clip their partner
            if (millis() > mechanicStarted + 7000 && millis() < mechanicStarted + 8000 && !stackFirst) {
                if (rotateExaflares) {
                    sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                    sgeFacing = (swapMovement ^ swap) ? Direction.Right : Direction.Left
                } else {
                    sgePosY -= (swap) ? -1.3 : 1.3
                    sgeFacing = (swap) ? Direction.Down : Direction.Up
                }
            }
            // or go to the corner after stack resolves to dodge exaflares
            if (millis() > mechanicStarted + 8500 && millis() < mechanicStarted + 9800 && stackFirst) {
                sgePosY -= (swap) ? -1.3 : 1.3
                sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                sgeFacing = (swap) ? ((swapMovement) ? Direction.BottomRight : Direction.BottomLeft) : ((swapMovement) ? Direction.TopLeft : Direction.TopRight)
            }
            // after stack/spread resolves, dragoon and warrior move to corner
            if (millis() > mechanicStarted + 8500 && millis() < mechanicStarted + 10000) {
                warPosY -= 1.3
                warPosX -= (swapMovement) ? -1.3 : 1.3
                warFacing = (swapMovement) ? Direction.BottomRight : Direction.BottomLeft
                drgPosY += 1.3
                drgPosX += (swapMovement) ? -1.3 : 1.3
                drgFacing = (swapMovement) ? Direction.TopLeft : Direction.TopRight
            }
            // if spread second, dragoon and warrior follow the exaflares to the
            // opposite corner
            if (millis() > mechanicStarted + 9000 && millis() < mechanicStarted + 12500 && stackFirst) {
                if (!rotateExaflares) {
                    warPosX += (swapMovement) ? -1.3 : 1.3
                    warFacing = (swapMovement) ? Direction.Left : Direction.Right

                    // Winry says fancy dodging allows you to dodge the exaflare
                    // while running the wrong way!
                    drgPosY -= 1.3
                    warFacing = Direction.Up
                } else {
                    warPosY += 1.3
                    warFacing = Direction.Down

                    // Explanation above
                    drgPosX -= (swapMovement) ? -1.3 : 1.3
                    drgFacing = (swapMovement) ? Direction.Right : Direction.Left
                }
            }

            strokeWeight(3)

            // display stacks and spreads (at correct time).
            // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140.
            let xPosStack = (stackFirst) ? 105 : 140
            let xPosSpread = (stackFirst) ? 140 : 105

            // all the spreads/stacks should be gone after 13.5 seconds
            if (millis() < mechanicStarted + 13500) {
                fill(0, 80, 50)
                // here we display the red rectangles representing the spread
                // and stack debuffs
                // note that the first debuff resolves at 8.5 seconds.
                if (!stackFirst || millis() < mechanicStarted + 8500) {
                    // these are the stacks.
                    rect(xPosStack - 15, 20 + whoGetsStack[0] * 50, 30, 30)
                    rect(xPosStack - 15, 20 + whoGetsStack[1] * 50, 30, 30)
                }
                if (stackFirst || millis() < mechanicStarted + 8500) {
                    // these are the spreads.
                    rect(xPosSpread - 15, 70, 30, 30)
                    rect(xPosSpread - 15, 120, 30, 30)
                    rect(xPosSpread - 15, 170, 30, 30)
                    rect(xPosSpread - 15, 220, 30, 30)
                }

                fill(0, 0, 100)
                // display a "2" for stack
                if (!stackFirst || millis() < mechanicStarted + 8500) {
                    text("2", xPosStack - 10, 45 + whoGetsStack[0] * 50)
                    text("2", xPosStack - 10, 45 + whoGetsStack[1] * 50)
                }

                // display a stroked un-filled circle for spread
                if (stackFirst || millis() < mechanicStarted + 8500) {
                    stroke(0, 0, 100)
                    noFill()
                    circle(xPosSpread, 85, 20)
                    circle(xPosSpread, 135, 20)
                    circle(xPosSpread, 185, 20)
                    circle(xPosSpread, 235, 20)
                }
            }


            noStroke()

            // display exaflares and spreads/stack AoEs
            for (let exoflare of exoflares) {
                exoflare.update()
                exoflare.displayAoE()
            }

            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }

            // make it so that you can't see the corner exaflare sticking out by
            // adding a rectangle colored the background color to the left
            fill(234, 34, 24)
            noStroke()
            rect(350, 0, 50, height)
            break
        case "Malformed Reincarnation":
            // display the blue and odrange soak towers
            for (let soakTower of blueSoakTowers) {
                soakTower.update()
                soakTower.displayTower()
            }
            for (let soakTower of orangeSoakTowers) {
                soakTower.update()
                soakTower.displayTower()
            }

            // display the rodential and odder debuffs, as well as the tower-dropping
            // ones
            for (let player of [1, 2, 3, 4]) {
                // each player is displayed on a different y-coordinate
                let yPos = 45 + player*50
                if (triplesGivenTo.includes(player)) {
                    if (majorityRed.includes(player)) { // drop blue, soak red-red-red
                        stroke(240, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop blue
                        } else {
                            // drop a blue tower
                            // since everything triggers at the same time, it's
                            // guaranteed that if we stop dropping towers once
                            // we hit the last player, everyone will drop a
                            // tower
                            if (!droppedTowers) {
                                if (player === 4) {
                                    droppedTowers = true
                                }
                                let playerPosX = 0
                                let playerPosY = 0
                                if (player === 1) {
                                    playerPosX = posX
                                    playerPosY = posY
                                } if (player === 2) {
                                    playerPosX = drgPosX
                                    playerPosY = drgPosY
                                } if (player === 3) {
                                    playerPosX = sgePosX
                                    playerPosY = sgePosY
                                } if (player === 4) {
                                    playerPosX = warPosX
                                    playerPosY = warPosY
                                }
                                blueSoakTowers.push(
                                    new SoakTower([240, 100, 100], playerPosX, playerPosY, 65, 7400)
                                )
                            }
                        }
                        noStroke()
                        fill(15, 100, 100)
                        if (millis() - mechanicStarted < 14600) {
                            text("123", 100, yPos)
                        } else if (millis() - mechanicStarted < 16000) {
                            text("23", 117, yPos)
                        } else if (millis() - mechanicStarted < 17400) {
                            text("3", 136, yPos)
                        }
                    } else { // drop red, soak blue-blue-blue
                        stroke(15, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop red
                        } else {
                            if (!droppedTowers) {
                                // drop red
                                // since everything triggers at the same time, it's
                                // guaranteed that if we stop dropping towers once
                                // we hit the last player, everyone will drop a
                                // tower
                                if (player === 4) {
                                    droppedTowers = true
                                }
                                let playerPosX = 0
                                let playerPosY = 0
                                if (player === 1) {
                                    playerPosX = posX
                                    playerPosY = posY
                                } if (player === 2) {
                                    playerPosX = drgPosX
                                    playerPosY = drgPosY
                                } if (player === 3) {
                                    playerPosX = sgePosX
                                    playerPosY = sgePosY
                                } if (player === 4) {
                                    playerPosX = warPosX
                                    playerPosY = warPosY
                                }
                                orangeSoakTowers.push(
                                    new SoakTower([15, 100, 100], playerPosX, playerPosY, 65, 7400)
                                )
                            }
                        }
                        noStroke()
                        fill(240, 100, 100)
                        if (millis() - mechanicStarted < 14600) {
                            text("123", 100, yPos - 5)
                        } else if (millis() - mechanicStarted < 16000) {
                            text("23", 117, yPos - 5)
                        } else if (millis() - mechanicStarted < 17400) {
                            text("3", 136, yPos - 5)
                        }
                    }
                } else {
                    if (majorityRed.includes(player)) { // drop red, soak red-red-blue
                        stroke(15, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop red
                        } else {
                            if (!droppedTowers) {
                                // drop red
                                // since everything triggers at the same time, it's
                                // guaranteed that if we stop dropping towers once
                                // we hit the last player, everyone will drop a
                                // tower
                                if (player === 4) {
                                    droppedTowers = true
                                }
                                let playerPosX = 0
                                let playerPosY = 0
                                if (player === 1) {
                                    playerPosX = posX
                                    playerPosY = posY
                                } if (player === 2) {
                                    playerPosX = drgPosX
                                    playerPosY = drgPosY
                                } if (player === 3) {
                                    playerPosX = sgePosX
                                    playerPosY = sgePosY
                                } if (player === 4) {
                                    playerPosX = warPosX
                                    playerPosY = warPosY
                                }
                                orangeSoakTowers.push(
                                    new SoakTower([15, 100, 100], playerPosX, playerPosY, 65, 7400)
                                )
                            }
                        }
                        noStroke()
                        fill(15, 100, 100)
                        if (millis() - mechanicStarted < 14600) {
                            text("12", 100, yPos - 2)
                        } else if (millis() - mechanicStarted < 16000) {
                            text("2", 117, yPos - 2)
                        }
                        fill(240, 100, 100)
                        if (millis() - mechanicStarted < 17400) {
                            text("3", 137, yPos - 4.5)
                        }
                    } else { // drop blue, soak blue-blue-red
                        stroke(240, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop blue
                        } else {
                            if (!droppedTowers) {
                                // drop blue
                                // since everything triggers at the same time, it's
                                // guaranteed that if we stop dropping towers once
                                // we hit the last player, everyone will drop a
                                // tower
                                if (player === 4) {
                                    droppedTowers = true
                                }
                                let playerPosX = 0
                                let playerPosY = 0
                                if (player === 1) {
                                    playerPosX = posX
                                    playerPosY = posY
                                } if (player === 2) {
                                    playerPosX = drgPosX
                                    playerPosY = drgPosY
                                } if (player === 3) {
                                    playerPosX = sgePosX
                                    playerPosY = sgePosY
                                } if (player === 4) {
                                    playerPosX = warPosX
                                    playerPosY = warPosY
                                }
                                blueSoakTowers.push(
                                    new SoakTower([240, 100, 100], playerPosX, playerPosY, 65, 7400)
                                )
                            }
                        }
                        noStroke()
                        fill(240, 100, 100)
                        if (millis() - mechanicStarted < 14600) {
                            text("12", 100, yPos - 7)
                        } else if (millis() - mechanicStarted < 16000) {
                            text("2", 117, yPos - 7)
                        }
                        fill(15, 100, 100)
                        if (millis() - mechanicStarted < 17400) {
                            text("3", 137, yPos - 4.5)
                        }
                    }
                }
            }

            // automate everyone
            if (millis() - mechanicStarted < 5500) {
                if (triplesGivenTo.includes(2)) { // 2 is the dragoon
                    // we want to get north if triples are given here
                    drgPosY -= 1.3
                    drgFacing = Direction.Up
                }
            } if (millis() - mechanicStarted > 0 && millis() - mechanicStarted < 4000 && rotatePlayers) {
                if (triplesGivenTo.includes(2)) { // 2 is the dragoon
                    // rotate from top to right
                    drgPosY += 0.92
                    drgPosX += 0.92
                    drgFacing = Direction.BottomRight
                } else {
                    // rotate from down to left
                    drgPosY -= 0.86
                    drgPosX -= 0.92
                    drgFacing = Direction.TopLeft
                }
            } if (millis() - mechanicStarted > 5500 && millis() - mechanicStarted < 6500) {
                // now we want to drop our tower
                // up, down, left, or right depending on what tower we want to
                // drop behind
                if (rotatePlayers) {
                    drgPosY += (directionOfBlue === 3 ^ majorityRed.includes(2)) ? -1.3 : 1.3
                    drgFacing = (directionOfBlue === 3 ^ majorityRed.includes(2))
                        ? Direction.Up : Direction.Down
                } else {
                    drgPosX += (directionOfBlue === 2 ^ majorityRed.includes(2)) ? -1.3 : 1.3
                    drgFacing = (directionOfBlue === 2 ^ majorityRed.includes(2))
                        ? Direction.Left : Direction.Right
                }
            }
            // now we need to soak our towers
            // start with the first
            if (millis() - mechanicStarted > 10000 && millis() - mechanicStarted < 13000) {
                // Have yet to implement
            } if (millis() - mechanicStarted > 14600 && millis() - mechanicStarted < 16000) {
                // Have yet to implement
            } if (millis() - mechanicStarted > 16000 && millis() - mechanicStarted < 17000) {
                // Have yet to implement
            }
            break
        case "Triple Kasumi-Giri":
            // add ring that represents facing
            stroke(0, 0, 100)
            strokeWeight(1)
            noFill()
            circle(bossPosX, bossPosY, 160) // note: this is 160 diameter, not 160 radius
            fill(0, 0, 100)
            noStroke()
            if (bossFacing === 1) { // up
                triangle(bossPosX - 10, bossPosY - 80, bossPosX + 10,
                         bossPosY - 80, bossPosX, bossPosY - 96)
            } if (bossFacing === 2) { // right
                triangle(bossPosX + 80, bossPosY - 10, bossPosX + 80,
                         bossPosY + 10, bossPosX + 96, bossPosY)
            } if (bossFacing === 3) { // down
                triangle(bossPosX - 10, bossPosY + 80, bossPosX + 10,
                         bossPosY + 80, bossPosX, bossPosY + 96)
            } if (bossFacing === 4) { // left
                triangle(bossPosX - 80, bossPosY - 10, bossPosX - 80,
                         bossPosY + 10, bossPosX - 96, bossPosY)
            }

            // display the symbols for each cleave
            if (millis() - mechanicStarted > 0 && millis() - mechanicStarted < 1800) { // cleave #1
                fill(0, 0, 0)
                rect(bossPosX - 15, bossPosY - 45, 30, 30)
                if (cleaveOneColor === "orange") {
                    fill(15, 100, 100)
                } else {
                    fill(180, 100, 100)
                }
                angleMode(DEGREES)
                // display an arc with the cleaveOneSafeDirection not included
                // (this is filled as a pie segment)
                // not rotated towards boss facing!
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveOneSafeDirection*90,
                    135 + cleaveOneSafeDirection*90)
                angleMode(RADIANS)
            } if (millis() - mechanicStarted > 2000 && millis() - mechanicStarted < 3800) { // cleave #2
                fill(0, 0, 0)
                rect(bossPosX - 15, bossPosY - 45, 30, 30)
                if (cleaveTwoColor === "orange") {
                    fill(15, 100, 100)
                } else {
                    fill(180, 100, 100)
                }
                angleMode(DEGREES)
                // display an arc with the cleaveTwoSafeDirection not included
                // (this is filled as a pie segment)
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveTwoSafeDirection*90,
                    135 + cleaveTwoSafeDirection*90)
                angleMode(RADIANS)
            } if (millis() - mechanicStarted > 4000 && millis() - mechanicStarted < 5800) { // cleave #2
                fill(0, 0, 0)
                rect(bossPosX - 15, bossPosY - 45, 30, 30)
                if (cleaveThreeColor === "orange") {
                    fill(15, 100, 100)
                } else {
                    fill(180, 100, 100)
                }
                angleMode(DEGREES)
                // display an arc with the cleaveThreeSafeDirection not included
                // (this is filled as a pie segment)
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveThreeSafeDirection*90,
                    135 + cleaveThreeSafeDirection*90)
                angleMode(RADIANS)
            }

            if (millis() - mechanicStarted > 6000 && !firstAoEResolved) {
                firstAoEResolved = true
                AoEs.push( // make these resolve immediately!
                    (cleaveOneColor === "orange") ? // orange = circle, blue = donut
                        new CircleAOE(bossPosX, bossPosY, 160, 0) :
                        new DonutAOE(bossPosX, bossPosY, 80, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // now add the cone
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848,
                        225 + cleaveOneSafeDirection*90 - 90 + bossFacing*90,
                        135 + cleaveOneSafeDirection*90 - 90 + bossFacing*90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2
                bossFacing = (cleaveOneSafeDirection + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            if (millis() - mechanicStarted > 8700 && !secondAoEResolved) {
                secondAoEResolved = true
                AoEs.push( // make these resolve immediately!
                    (cleaveTwoColor === "orange") ? // orange = circle, blue = donut
                        new CircleAOE(bossPosX, bossPosY, 160, 0) :
                        new DonutAOE(bossPosX, bossPosY, 80, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // now add the cone
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848,
                        225 + cleaveTwoSafeDirection*90 - 90 + bossFacing*90,
                        135 + cleaveTwoSafeDirection*90 - 90 + bossFacing*90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2
                bossFacing = (cleaveTwoSafeDirection + bossFacing - 1 + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            if (millis() - mechanicStarted > 11400 && !thirdAoEResolved) {
                thirdAoEResolved = true
                AoEs.push( // make these resolve immediately!
                    (cleaveThreeColor === "orange") ? // orange = circle, blue = donut
                        new CircleAOE(bossPosX, bossPosY, 160, 0) :
                        new DonutAOE(bossPosX, bossPosY, 80, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // now add the cone
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848,
                        225 + cleaveThreeSafeDirection*90 - 90 + bossFacing*90,
                        135 + cleaveThreeSafeDirection*90 - 90 + bossFacing*90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2
                bossFacing = (cleaveThreeSafeDirection + bossFacing - 1 + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }
            break
        case "Fleeting Lai-Giri":
            // at 2000 milliseconds, there's a hidden circle AoE
            if (millis() - mechanicStarted > 2000 && !circleResolved) {
                circleResolved = true
                AoEs.push(
                    new CircleAOE(bossPosX, bossPosY, 160, 0)
                )
                AoEs[AoEs.length - 1].opacity = 5
                // now add the Boundless Scarlet lines
                AoEs.push(
                    new LineAOE(400, 170, 1000, 170, 130, 4000),
                    new LineAOE(400, 430, 1000, 430, 130, 4000),
                    new LineAOE(400, 0, 1000, 600, 130, 4000),
                    new LineAOE(400, 600, 1000, 0, 130, 4000)
                )
            }

            // display stacks and spreads (at correct time).
            // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140
            // the debuffs only appear at 10000. The first debuff resolves at
            // 32500 millis and the second resolves at 40000 millis.
            if ((10000 < millis() - mechanicStarted) && (millis() - mechanicStarted < 40000)) {
                let xPosStackDisplay = (stackFirst) ? 105 : 140
                let xPosSpreadDisplay = (stackFirst) ? 140 : 105
                fill(0, 80, 50)
                if (!stackFirst || millis() - mechanicStarted < 32500) {
                    rect(xPosStackDisplay - 15, 20 + whoGetsStack[0] * 50, 30, 30)
                    rect(xPosStackDisplay - 15, 20 + whoGetsStack[1] * 50, 30, 30)
                }
                if (stackFirst || millis() - mechanicStarted < 32500) {
                    rect(xPosSpreadDisplay - 15, 70, 30, 30)
                    rect(xPosSpreadDisplay - 15, 120, 30, 30)
                    rect(xPosSpreadDisplay - 15, 170, 30, 30)
                    rect(xPosSpreadDisplay - 15, 220, 30, 30)
                }

                fill(0, 0, 100)
                // display a "2" for stack
                if (!stackFirst || millis() - mechanicStarted < 32500) {
                    text("2", xPosStackDisplay - 10, 45 + whoGetsStack[0] * 50)
                    text("2", xPosStackDisplay - 10, 45 + whoGetsStack[1] * 50)
                }

                // display a circle for spread
                if (stackFirst || millis() - mechanicStarted < 32500) {
                    stroke(0, 0, 100)
                    strokeWeight(3)
                    noFill()
                    circle(xPosSpreadDisplay, 85, 20)
                    circle(xPosSpreadDisplay, 135, 20)
                    circle(xPosSpreadDisplay, 185, 20)
                    circle(xPosSpreadDisplay, 235, 20)
                }
            }

            // display the shadow cleave safe direction
            if ((12500 < millis() - mechanicStarted) && (millis() - mechanicStarted < 30000)) {
                noStroke()
                fill(0, 0, 0)
                rect(bossPosX - 20, bossPosY - 60, 40, 40)
                fill(300, 100, 50) // purple-ish color for shadow cleave
                angleMode(DEGREES)
                arc(bossPosX, bossPosY - 40, 30, 30, 225 + cleaveOneSafeDirection*90, 135 + cleaveOneSafeDirection*90)
                angleMode(RADIANS)
            }

            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }

            // display the tether
            let x1 = bossPosX
            let y1 = bossPosY
            let x2
            let y2
            let direction
            switch (tetheredPlayer) {
                case 1:
                    x2 = posX
                    y2 = posY
                    direction = yourFacing
                    break
                case 2:
                    x2 = drgPosX
                    y2 = drgPosY
                    direction = drgFacing
                    break
                case 3:
                    x2 = sgePosX
                    y2 = sgePosY
                    direction = sgeFacing
                    break
                case 4:
                    x2 = warPosX
                    y2 = warPosY
                    direction = warFacing
                    break
            }
            if ((12000 < millis() - mechanicStarted) && (millis() - mechanicStarted < 31000)) {
                stroke(45, 100, 100)
                strokeWeight(1)
                noFill()
                line(x1, y1, x2, y2)
            }

            // make the boss jump
            if (millis() - mechanicStarted > 31000 && !jumpResolved) {
                angleMode(DEGREES)
                bossPosX = x2 + 30*cos(-90 + direction*90)
                bossPosY = y2 + 30*sin(-90 + direction*90)
                print(direction, tetheredPlayer, cos(-90 + direction*90), sin(-90 + direction*90))
                angleMode(RADIANS)
                jumpResolved = true
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 400, 405 + direction*90 + cleaveOneSafeDirection*90,
                                315 + direction*90 + cleaveOneSafeDirection*90, 1500)
                )
                print(bossPosX, bossPosY)
            }

            fill(234, 34, 24)
            noStroke()
            rect(300, 0, 100, height)

            // now automate
            // start with moving players east and west
            if (millis() - mechanicStarted < 1040) {
                // sage needs to go right and up
                sgePosX += 0.92
                sgePosY -= 0.92
                sgeFacing = Direction.TopRight

                // dragoon needs to go left and up
                drgPosX -= 0.92
                drgPosY -= 0.92
                drgFacing = Direction.TopLeft
            } if (millis() - mechanicStarted < 1700) {
                // warrior needs to go left and down
                warPosX -= 0.92
                warPosY += 0.92
                warFacing = Direction.BottomLeft
            } if (millis() - mechanicStarted > 1700 && millis() - mechanicStarted < 2320) {
                // the warrior needs to go a little left
                warPosX -= 1.3
                warFacing = Direction.Left
            } if (millis() - mechanicStarted > 6000 && millis() - mechanicStarted < 7900) {
                // move back in center
                sgePosX -= 1.3
                sgeFacing = Direction.Left
                drgPosX += 1.3
                drgFacing = Direction.Right
                warPosX += 1.3
                warFacing = Direction.Right
            }
            if (millis() - mechanicStarted > 11900 && millis() - mechanicStarted < 12000) {
                // just correct everyone
                sgePosX = 700
                sgePosY = 300
                drgPosX = 700
                drgPosY = 300
                warPosX = 700
                warPosY = 300
            }
            // now move players to correct corner.
            // determine which corner is safe.
            // 1.5 is top-left, 2.5 is top-right, 3.5 is bottom-right, and 4.5 is
            // bottom-left. Same as system for facing
            let safeCorner = (northLineExpandsFirst) ?
                (topLeftCrossExpandsFirst) ?
                    Direction.BottomLeft : // top-left and top means only bottom-left is safe
                    Direction.BottomRight : // top-right and top means only bottom-right is safe
                (topLeftCrossExpandsFirst) ?
                    Direction.TopRight : // top-left and bottom means only top-right is safe
                    Direction.TopLeft // top-right and bottom means only top-left is safe
            if (millis() - mechanicStarted > 12000 && millis() - mechanicStarted < 15000) {
                if (safeCorner === Direction.BottomLeft || safeCorner ===
                    Direction.TopLeft) { // left
                    sgePosX -= 0.92
                    drgPosX -= 1.02
                    warPosX -= 0.82
                } if (safeCorner === Direction.BottomRight || safeCorner ===
                    Direction.TopRight) { // right
                    sgePosX += 0.92
                    drgPosX += 1.02
                    warPosX += 0.82
                } if (safeCorner === Direction.BottomLeft || safeCorner ===
                    Direction.BottomRight) { // bottom
                    sgePosY += 0.92
                    drgPosY += 0.82
                    warPosY += 1.02
                } if (safeCorner === Direction.TopLeft || safeCorner ===
                    Direction.TopRight) { // top
                    sgePosY -= 0.92
                    drgPosY -= 0.82
                    warPosY -= 1.02
                }
                sgeFacing = safeCorner
                drgFacing = safeCorner
                warFacing = safeCorner
            }
            if (millis() - mechanicStarted > 16900 && millis() - mechanicStarted < 17000) {
                // Adjust everyone
                drgPosX = sgePosX
                drgPosY = sgePosY
                warPosX = sgePosX
                warPosY = sgePosY
            }
            // now put everyone in their correct positions
            if (millis() - mechanicStarted > 20000 && millis() - mechanicStarted < 20800) {
                if (safeCorner === Direction.TopLeft) { // top-left
                    drgPosX += 0.92
                    drgPosY -= 0.92
                    sgePosX -= 0.92
                    sgePosY += 0.92
                    warPosX += 0.92
                    warPosY += 0.92
                    warFacing = Direction.BottomRight
                } if (safeCorner === Direction.TopRight) { // top-right
                    drgPosX -= 0.92
                    drgPosY -= 0.92
                    sgePosX += 0.92
                    sgePosY += 0.92
                    warPosX -= 0.92
                    warPosY += 0.92
                    warFacing = Direction.BottomLeft
                } if (safeCorner === Direction.BottomRight) { // bottom-right
                    drgPosX -= 0.92
                    drgPosY += 0.92
                    sgePosX += 0.92
                    sgePosY -= 0.92
                    warPosX -= 0.92
                    warPosY -= 0.92
                    warFacing = Direction.TopLeft
                } if (safeCorner === Direction.BottomLeft) { // bottom-left
                    drgPosX += 0.92
                    drgPosY += 0.92
                    sgePosX -= 0.92
                    sgePosY -= 0.92
                    warPosX += 0.92
                    warPosY -= 0.92
                    warFacing = Direction.TopRight
                }
            }

            // put the tethered person in their correct position
            if (millis() - mechanicStarted > 21000 && millis() - mechanicStarted < 22500) {
                switch (tetheredPlayer) {
                    case 1: // you
                        if (safeCorner === Direction.TopLeft) { // top-left
                            warPosX -= 0.92
                            warPosY -= 0.92
                            warFacing = Direction.TopLeft
                        } if (safeCorner === Direction.TopRight) { // top-right
                            warPosX += 0.92
                            warPosY -= 0.92
                            warFacing = Direction.TopRight
                        } if (safeCorner === Direction.BottomRight) { // bottom-right
                            warPosX += 0.92
                            warPosY += 0.92
                            warFacing = Direction.BottomRight
                        } if (safeCorner === Direction.BottomLeft) { // bottom-left
                            warPosX -= 0.92
                            warPosY += 0.92
                            warFacing = Direction.BottomLeft
                        }
                        break
                    case 2: // dragoon
                        if (safeCorner === Direction.TopLeft) { // top-left
                            drgPosY += 0.92
                            drgFacing = Direction.Down
                            warPosY -= 0.92
                            warFacing = Direction.Up
                        } if (safeCorner === Direction.TopRight) { // top-right
                            drgPosY += 0.92
                            drgFacing = Direction.Down
                            warPosY -= 0.92
                            warFacing = Direction.Up
                        } if (safeCorner === Direction.BottomRight) { // bottom-right
                            drgPosY -= 0.92
                            drgFacing = Direction.Up
                            warPosY += 0.92
                            warFacing = Direction.Down
                        } if (safeCorner === Direction.BottomLeft) { // bottom-left
                            drgPosY -= 0.92
                            drgFacing = Direction.Up
                            warPosY += 0.92
                            warFacing = Direction.Down
                        }
                        break
                    case 3: // sage
                        if (safeCorner === Direction.TopLeft) { // top-left
                            sgePosX += 0.92
                            sgeFacing = Direction.Right
                            warPosX -= 0.92
                            warFacing = Direction.Left
                        } if (safeCorner === Direction.TopRight) { // top-right
                            sgePosX -= 0.92
                            sgeFacing = Direction.Left
                            warPosX += 0.92
                            warFacing = Direction.Right
                        } if (safeCorner === Direction.BottomRight) { // bottom-right
                            sgePosX -= 0.92
                            sgeFacing = Direction.Left
                            warPosX += 0.92
                            warFacing = Direction.Right
                        } if (safeCorner === Direction.BottomLeft) { // bottom-left
                            sgePosX += 0.92
                            sgeFacing = Direction.Right
                            warPosX -= 0.92
                            warFacing = Direction.Left
                        }
                        break
                }
            }

            // put the tethered player in their correct position.
            // move to the intersection
            if (millis() - mechanicStarted > 22500 && millis() - mechanicStarted < 23000) {
                print(safeCorner)
                switch (tetheredPlayer) {
                    case 2: // dragoon
                        if (safeCorner === Direction.TopRight) drgPosX = 575; drgPosY = 175
                        if (safeCorner === Direction.TopLeft) drgPosX = 825; drgPosY = 175
                        if (safeCorner === Direction.BottomLeft) drgPosX = 825; drgPosY = 425
                        if (safeCorner === Direction.BottomRight) drgPosX = 575; drgPosY = 425
                        break
                    case 3: // sage
                        if (safeCorner === Direction.TopRight) sgePosX = 575; sgePosY = 175
                        if (safeCorner === Direction.TopLeft) sgePosX = 825; sgePosY = 175
                        if (safeCorner === Direction.BottomLeft) sgePosX = 825; sgePosY = 425
                        if (safeCorner === Direction.BottomRight) sgePosX = 575; sgePosY = 425
                        break
                    case 4: // warrior
                        if (safeCorner === Direction.TopRight) warPosX = 575; warPosY = 175
                        if (safeCorner === Direction.TopLeft) warPosX = 825; warPosY = 175
                        if (safeCorner === Direction.BottomLeft) warPosX = 825; warPosY = 425
                        if (safeCorner === Direction.BottomRight) warPosX = 575; warPosY = 425
                        break
                }
            }
            break
        case "Azure Auspice":
            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }
    }

    // display you and your party members in your and their respective position
    // after checking for moving
    let directions = []
    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) directions.push(Direction.Left) // A or ← = left
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) directions.push(Direction.Up) // W or ↑ = up
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) directions.push(Direction.Right) // D or → = right
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) directions.push(Direction.Down) // S or ↓ = down
    switch (directions.length) {
        case 1: // move the full 1.3
            if (directions[0] === Direction.Left) posX -= 1.3
            if (directions[0] === Direction.Up) posY -= 1.3
            if (directions[0] === Direction.Right) posX += 1.3
            if (directions[0] === Direction.Down) posY += 1.3
            break
        case 2: // move 0.92 both directions. They still cancel out each other if they're opposite
            if (directions[0] === Direction.Left) posX -= 0.92
            if (directions[0] === Direction.Up) posY -= 0.92
            if (directions[0] === Direction.Right) posX += 0.92
            if (directions[0] === Direction.Down) posX -= 0.92
            if (directions[1] === Direction.Up) posY -= 0.92
            if (directions[1] === Direction.Right) posX += 0.92
            if (directions[1] === Direction.Down) posY += 0.92
            break
        case 3: // move the full 1.3 each direction. Virtually moving 1 of the directions, as 2 are guaranteed to cancel out.
            if (directions[0] === Direction.Left) posX -= 1.3
            if (directions[0] === Direction.Up) posY -= 1.3
            if (directions[0] === Direction.Right) posX += 1.3
            if (directions[0] === Direction.Down) posY += 1.3
            if (directions[1] === Direction.Up) posY -= 1.3
            if (directions[1] === Direction.Right) posX += 1.3
            if (directions[1] === Direction.Down) posY += 1.3
            if (directions[2] === Direction.Right) posX += 1.3
            if (directions[2] === Direction.Down) posY += 1.3
            break
    } if (directions.length > 0) {
        yourFacing = mixDirections(directions)
    }
    image(sgeSymbol, sgePosX - 20, sgePosY - 20, 40, 40)
    image(warSymbol, warPosX - 20, warPosY - 20, 40, 40)
    image(drgSymbol, drgPosX - 20, drgPosY - 20, 40, 40)
    image(rdmSymbol, posX - 20, posY - 20, 40, 40)

    // now display the party
    image(rdmSymbol, 10, 60, 40, 40)
    image(drgSymbol, 10, 110, 40, 40)
    image(sgeSymbol, 10, 160, 40, 40)
    image(warSymbol, 10, 210, 40, 40)

    fill(0, 0, 100)
    textSize(30)
    noStroke()
    text("Party composition:", 5, 25)
    textSize(20)
    textSize(25)
    textSize(30)
    text("YOU", 185, 90)

    // red dot for boss
    strokeWeight(30)
    stroke(0, 100, 100)
    point(bossPosX, bossPosY)

    if ((posX < 432 || posY < 32 ||
        posX > 978 || posY > 578) ||
        ((posX < 42 || posY < 42 ||
        posX > 968 || posY > 568)) &&
        (mechanic === "Triple Kasumi-Giri" || mechanic === "Fleeting Lai-Giri")) {
        partyWiped = true
        causeOfWipe = "You entered the edge \nof the arena."
    }

    if (partyWiped === true) {
        fill(0, 100, 100)
        noStroke()
        text(causeOfWipe, 10, 300)
    }
    print(engagedAt)

    push()
    translate(posX, posY)
    yourFacing.rotateToDirection()
    fill(45, 100, 100)
    noStroke()
    if (!yourFacing.onDiagonal) {
        triangle(20, -10, 20, 10, 40, 0)
    } else { // Display farther away for diagonal facings
        triangle(25, -10, 25, 10, 45, 0)
    }
    pop()

    push()
    translate(drgPosX, drgPosY)
    drgFacing.rotateToDirection()
    fill(45, 100, 100)
    noStroke()
    if (!drgFacing.onDiagonal) {
        triangle(20, -10, 20, 10, 40, 0)
    } else { // Display farther away for diagonal facings
        triangle(25, -10, 25, 10, 45, 0)
    }
    pop()

    push()
    translate(sgePosX, sgePosY)
    sgeFacing.rotateToDirection()
    fill(45, 100, 100)
    noStroke()
    if (!sgeFacing.onDiagonal) {
        triangle(20, -10, 20, 10, 40, 0)
    } else { // Display farther away for diagonal facings
        triangle(25, -10, 25, 10, 45, 0)
    }
    pop()

    push()
    translate(warPosX, warPosY)
    warFacing.rotateToDirection()
    fill(45, 100, 100)
    noStroke()
    if (!warFacing.onDiagonal) {
        triangle(20, -10, 20, 10, 40, 0)
    } else { // Display farther away for diagonal facings
        triangle(25, -10, 25, 10, 45, 0)
    }
    pop()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()

    // if (frameCount > 3000) noLoop()
}

function displayDonut(posX, posY, size) {
    beginShape()
    vertex(400, 0)
    vertex(1000, 0)
    vertex(1000, 600)
    vertex(400, 600)
    beginContour()
    for (let angle = TWO_PI; angle > 0; angle -= 0.1) {
        let x = posX + cos(angle) * size
        let y = posY + sin(angle) * size
        vertex(max(x, 400), y)
    }
    endContour()
    endShape(CLOSE)
}

function mousePressed() {
    if (mouseX > 0 && mouseX < 230 &&
        mouseY > height - 30 && mouseY < height) {
        helper = true
    }

    if (mouseX > 0 && mouseX < 90 &&
        mouseY > 390 && mouseY < 410) {
        mechanic = "Exoflares"
        mechanicStarted = millis()
        swapMovement = random([false, true])
        rotateExaflares = random([false, true])
        stackFirst = random([false, true])
        whoGetsStack = [0, 0]
        whoGetsStack[0] = random([1, 2, 3, 4])
        whoGetsStack[1] = whoGetsStack[0]
        while (whoGetsStack[0] === whoGetsStack[1]) {
            whoGetsStack[1] = random([1, 2, 3, 4])
        }
        whoGetsStack.sort()
        // if the same role gets stack, then we have to swap you and healer
        swap = (whoGetsStack[0] === 1 && whoGetsStack[1] === 2) || (whoGetsStack[0] === 3 && whoGetsStack[1] === 4)
        print(swap)
        exoflares = [
            // Add exoflares on the east and west. They go to the top-left and
            // bottom-right if swapMovement is false, and the top-right and
            // bottom-left if swapMovement is true.
            // Or on north and south!
            new Exaflare((!rotateExaflares) ? 450 : ((swapMovement) ? 620 : 440),
                (rotateExaflares) ? 50 : ((swapMovement) ? 220 : 40), 180, 6500,
                (rotateExaflares) ? 0 : 79, (!rotateExaflares) ? 0 : 79, 0, 1000),
            new Exaflare((!rotateExaflares) ? 950 : ((swapMovement) ? 440 : 620),
                (rotateExaflares) ? 550 : ((swapMovement) ? 40 : 220), 180, 6500,
                (rotateExaflares) ? 0 : -79, (!rotateExaflares) ? 0 : -79, 0, 1000),
            new Exaflare((!rotateExaflares) ? 450 : ((swapMovement) ? 960 : 780),
                (rotateExaflares) ? 50 : ((swapMovement) ? 560 : 380), 180, 6500,
                (rotateExaflares) ? 0 : 79, (!rotateExaflares) ? 0 : 79, 0, 1000),
            new Exaflare((!rotateExaflares) ? 950 : ((swapMovement) ? 780 : 960),
                (rotateExaflares) ? 550 : ((swapMovement) ? 380 : 560), 180, 6500,
                (rotateExaflares) ? 0 : -79, (!rotateExaflares) ? 0 : -79, 0, 1000),
            // These are the cardinal exoflares. They're always in the same
            // orientation.
            new Exaflare(620, 300, 200, 6500, -79, 0, 0, 1000),
            new Exaflare(780, 300, 200, 6500, 79, 0, 0, 1000),
            new Exaflare(700, 380, 200, 6500, 0, 79, 0, 1000),
            new Exaflare(700, 220, 200, 6500, 0, -79, 0, 1000)
        ]

        // These are the spreads and stacks. The first one goes off at 8500ms
        // and the second one goes off at 13500. The slight delay is used so
        // that we can tell whether someone got hit twice with stack or
        // spread.
        AoEs = [
                new SpreadCircle(1, 300, (stackFirst) ? 13470 : 8470),
                new SpreadCircle(2, 300, (stackFirst) ? 13490 : 8490),
                new SpreadCircle(3, 300, (stackFirst) ? 13510 : 8510),
                new SpreadCircle(4, 300, (stackFirst) ? 13530 : 8530),
                new StackCircle(whoGetsStack[0], 300, (stackFirst) ? 8490 : 13490, 2),
                new StackCircle(whoGetsStack[1], 300, (stackFirst) ? 8510 : 13510, 2),
            ]
        posX = 700
        posY = 300
        drgPosX = 700
        drgPosY = 300
        sgePosX = 700
        sgePosY = 300
        warPosX = 700
        warPosY = 300
        bossPosX = -100
        bossPosY = -100
        partyWiped = false
    }
    if (mouseX > 0 && mouseX < 148 &&
        mouseY > 410 && mouseY < 434) {
        mechanic = "Fighting Spirits"
        partyWiped = false
    }
    if (mouseX > 0 && mouseX < 245 &&
        mouseY > 434 && mouseY < 454) {
        mechanic = "Malformed Reincarnation"
        mechanicStarted = millis()
        directionOfBlue = random([1, 2, 3, 4])
        // 1 is top, 2 is right, 3 is bottom, 4 is left
        // we can't have people that are next to each other dropping towers
        // behind the same tower
        rotatePlayers = (directionOfBlue === 1 || directionOfBlue === 3)
        topRightIsBlue = (directionOfBlue === 1 || directionOfBlue === 2)
        topLeftIsBlue = (directionOfBlue === 1 || directionOfBlue === 4)
        bottomRightIsBlue = (directionOfBlue === 2 || directionOfBlue === 3)
        bottomLeftIsBlue = (directionOfBlue === 3 || directionOfBlue === 4)

        blueSoakTowers = []
        orangeSoakTowers = []

        posX = 700
        posY = 500
        drgPosX = 700
        drgPosY = 500
        sgePosX = 700
        sgePosY = 100
        warPosX = 700
        warPosY = 100
        bossPosX = -100
        bossPosY = -100

        // now add the towers, one for each corner
        if (topRightIsBlue) {
            blueSoakTowers.push(
                new SoakTower([240, 100, 100], 910, 90, 65, 16000),
                new SoakTower([240, 100, 100], 770, 230, 65, 14600)
            )
        } else {
            orangeSoakTowers.push(
                new SoakTower([15, 100, 100], 910, 90, 65, 16000),
                new SoakTower([15, 100, 100], 770, 230, 65, 14600)
            )
        }
        if (topLeftIsBlue) {
            blueSoakTowers.push(
                new SoakTower([240, 100, 100], 490, 90, 65, 16000),
                new SoakTower([240, 100, 100], 630, 230, 65, 14600)
            )
        } else {
            orangeSoakTowers.push(
                new SoakTower([15, 100, 100], 490, 90, 65, 16000),
                new SoakTower([15, 100, 100], 630, 230, 65, 14600)
            )
        }
        if (bottomRightIsBlue) {
            blueSoakTowers.push(
                new SoakTower([240, 100, 100], 910, 510, 65, 16000),
                new SoakTower([240, 100, 100], 770, 370, 65, 14600)
            )
        } else {
            orangeSoakTowers.push(
                new SoakTower([15, 100, 100], 910, 510, 65, 16000),
                new SoakTower([15, 100, 100], 770, 370, 65, 14600)
            )
        }
        if (bottomLeftIsBlue) {
            blueSoakTowers.push(
                new SoakTower([240, 100, 100], 490, 510, 65, 16000),
                new SoakTower([240, 100, 100], 630, 370, 65, 14600)
            )
        } else {
            orangeSoakTowers.push(
                new SoakTower([15, 100, 100], 490, 510, 65, 16000),
                new SoakTower([15, 100, 100], 630, 370, 65, 14600)
            )
        }
        droppedTowers = false
        partyWiped = false

        // give out the triples now
        areThereTriples = random([false, true])
        if (areThereTriples) {
            // give the triples to two random players
            triplesGivenTo = [0, 0]
            triplesGivenTo[0] = random([1, 2, 3, 4])
            triplesGivenTo[1] = triplesGivenTo[0]
            while (triplesGivenTo[0] === triplesGivenTo[1]) {
                triplesGivenTo[1] = random([1, 2, 3, 4])
            }

            // now figure out who the triples are not given to
            triplesNotGivenTo = []
            for (let player of [1, 2, 3, 4]) {
                if (!triplesGivenTo.includes(player)) {
                    triplesNotGivenTo.push(player)
                }
            }

            // give the reds to one triple and one non-triple
            majorityRed = [
                random([triplesGivenTo[0], triplesGivenTo[1]]),
                random([triplesNotGivenTo[0], triplesNotGivenTo[1]])
            ]
        } else {
            // no people get triples
            triplesGivenTo = []
            triplesNotGivenTo = [1, 2, 3, 4]

            // give the reds to two random players
            majorityRed = [0, 0]
            majorityRed[0] = random([1, 2, 3, 4])
            majorityRed[1] = majorityRed[0]
            while (majorityRed[0] === majorityRed[1]) {
                majorityRed[1] = random([1, 2, 3, 4])
            }
        }
        print(areThereTriples, triplesGivenTo, triplesNotGivenTo, majorityRed)

        AoEs = []
    } if (mouseX > 0 && mouseX < 175 &&
        mouseY > 454 && mouseY < 478) {
        mechanic = "Triple Kasumi-Giri"
        mechanicStarted = millis()
        posX = 700
        posY = 400
        drgPosX = -100
        drgPosY = -100
        sgePosX = -100
        sgePosY = -100
        warPosX = -100
        warPosY = -100
        bossPosX = 700
        bossPosY = 300
        bossFacing = 1 // always start oriented!

        // each cleave has a color and direction. orange means a point-blank
        // AOE and blue means a donut AOE.
        cleaveOneColor = random(["orange", "blue"])
        cleaveTwoColor = random(["orange", "blue"])
        cleaveThreeColor = random(["orange", "blue"])
        cleaveOneSafeDirection = random([1, 2, 3, 4])
        cleaveTwoSafeDirection = random([1, 2, 3, 4])
        cleaveThreeSafeDirection = random([1, 2, 3, 4])

        firstAoEResolved = false
        secondAoEResolved = false
        thirdAoEResolved = false

        AoEs = []
    } if (mouseX > 0 && mouseX < 155 &&
        mouseY > 478 && mouseY < 502) {
        mechanic = "Fleeting Lai-Giri"
        mechanicStarted = millis()
        jumpResolved = false

        posX = 700
        posY = 410
        drgPosX = 610
        drgPosY = 360
        sgePosX = 790
        sgePosY = 360
        warPosX = 700
        warPosY = 200
        bossPosX = 700
        bossPosY = 300

        circleResolved = false

        topLeftCrossExpandsFirst = random([false, true])
        northLineExpandsFirst = random([false, true])

        stackFirst = random([false, true])
        whoGetsStack = [
            random([1, 2]), // both DPS
            random([3, 4]), // both supports
        ]

        cleaveOneSafeDirection = random([1, 2, 3, 4])

        tetheredPlayer = random([1, 2, 3, 4])

        // growingTimes[0] is when the line first appears. growingTimes[1-3] is
        // when the lines grow. growingTimes[4] is when the lines go off.
        let growingTimesForExpandingFirst = [6000, 10000, 17500, 25000, 31500]
        let growingTimesForExpandingSecond = [6000, 17500, 25000, 32500, 39000]

        AoEs = [
            new FlameLine(400, 175, 1000, 175,
                (northLineExpandsFirst) ? growingTimesForExpandingFirst :
                    growingTimesForExpandingSecond), // north line
            new FlameLine(400, 425, 1000, 425,
                (northLineExpandsFirst) ? growingTimesForExpandingSecond :
                    growingTimesForExpandingFirst), // south line
            new FlameLine(400, 0, 1000, 600,
                (topLeftCrossExpandsFirst) ? growingTimesForExpandingFirst :
                    growingTimesForExpandingSecond), // top-left cross
            new FlameLine(400, 600, 1000, 0,
                (topLeftCrossExpandsFirst) ? growingTimesForExpandingSecond :
                    growingTimesForExpandingFirst), // top-right cross

            // spread and stack circles
            // as usual, we have a slight delay so that we can detect whether
            // someone got hit twice
            new SpreadCircle(1, 50, (stackFirst) ? 40470 : 33270),
            new SpreadCircle(2, 50, (stackFirst) ? 40490 : 33290),
            new SpreadCircle(3, 50, (stackFirst) ? 40510 : 33310),
            new SpreadCircle(4, 50, (stackFirst) ? 40530 : 33330),
            new StackCircle(whoGetsStack[0], 50, (stackFirst) ? 33290 : 40490, 2),
            new StackCircle(whoGetsStack[1], 50, (stackFirst) ? 33310 : 40510, 2),
        ]

        // this won't give away anything: sort the aoEs by their growing time.
        // the first lines are displayed on top of the second lines
        AoEs.sort(sortByGrowingTime)
    } if (mouseX > 0 && mouseX < 120 &&
        mouseY > 499 && mouseY < 519) {
        mechanic = "Azure Auspice"
        mechanicStarted = millis()
        drgPosX = -100
        sgePosX = -100
        warPosX = -100
        bossPosX = -100
        // The 4 lines (north, south, top-left-to-bottom-right, and
        // top-right-to-bottom-left) expand in a random order. We start by
        // initializing them here.
        linesInOrderOfResolvingOrder = [random(["north", "south", "top-left", "top-right"]),
                        random(["north", "south", "top-left", "top-right"]),
                        random(["north", "south", "top-left", "top-right"]),
                        random(["north", "south", "top-left", "top-right"])]
        // now we check for overlap.
        while (linesInOrderOfResolvingOrder[1] === linesInOrderOfResolvingOrder[0]) {
            linesInOrderOfResolvingOrder[1] = random(["north", "south", "top-left", "top-right"])
        } while (linesInOrderOfResolvingOrder[2] === linesInOrderOfResolvingOrder[1] ||
                 linesInOrderOfResolvingOrder[2] === linesInOrderOfResolvingOrder[0]) {
            linesInOrderOfResolvingOrder[2] = random(["north", "south", "top-left", "top-right"])
        } while (linesInOrderOfResolvingOrder[3] === linesInOrderOfResolvingOrder[2] ||
                 linesInOrderOfResolvingOrder[3] === linesInOrderOfResolvingOrder[1] ||
                 linesInOrderOfResolvingOrder[3] === linesInOrderOfResolvingOrder[0]) {
            linesInOrderOfResolvingOrder[3] = random(["north", "south", "top-left", "top-right"])
        }
        print(linesInOrderOfResolvingOrder)
        AoEs = []
        let lineNumber = 1
        for (let line of linesInOrderOfResolvingOrder) {
            switch (line) {
                case "north":
                    // there is a 2.8s or 2800ms delay between each line
                    // resolving. We implement that by adding 2800*lineNumber.
                    // Note that we still have to have all the lines appear
                    // immediately, which is why we have a static 0.
                    AoEs.push(new WaterLine(
                        400, 180, 1000, 180, [
                            0, 2000 + 2800*lineNumber, 4000 + 2800*lineNumber,
                            6000 + 2800*lineNumber, 8000 + 2800*lineNumber
                        ]
                    ))
                    break
                case "south":
                    // Explanation can be found above.
                    AoEs.push(new WaterLine(
                        400, 420, 1000, 420, [
                            0, 2000 + 2800*lineNumber, 4000 + 2800*lineNumber,
                            6000 + 2800*lineNumber, 8000 + 2800*lineNumber
                        ]
                    ))
                    break
                case "top-left":
                    // Explanation can be found above.
                    AoEs.push(new WaterLine(
                        400, 0, 1000, 600, [
                            0, 2000 + 2800*lineNumber, 4000 + 2800*lineNumber,
                            6000 + 2800*lineNumber, 8000 + 2800*lineNumber
                        ]
                    ))
                    break
                case "top-right":
                    // Explanation can be found above.
                    AoEs.push(new WaterLine(
                        400, 600, 1000, 0, [
                            0, 2000 + 2800*lineNumber, 4000 + 2800*lineNumber,
                            6000 + 2800*lineNumber, 8000 + 2800*lineNumber
                        ]
                    ))
                    break
            }
            lineNumber++
        }
    }
}

function sortByGrowingTime(a, b) {
    return b.growingTimes[1] - a.growingTimes[1]
}

function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.visible = false
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}