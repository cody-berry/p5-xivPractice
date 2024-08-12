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

/**
 *  @author Cody
 *  @date 2024.01.09
 */



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

let debuffDirection
let orbOnePosition
let orbTwoPosition
let possibility // there are 8 different possibilities for where the orbs spawn
let yourDebuffNumber
let bossBuffNumber
let yourRotationClockwise
let bossRotationClockwise
let yourRotationWentOff
let firstOrbWentOff
let secondOrbWentOff
let gotHitByFirstOrb
let gotHitBySecondOrb
let gotHitByTether

let heightForNoTextDescent
let heightForTextDescent
let counterClockwiseWidth
let clockwiseWidth
let exaflareWidth
let fightingSpiritsWidth
let malformedReincarnationWidth
let tripleKasumiGiriWidth
let fleetingLaiGiriWidth
let azureAuspiceWidth
let analysisWidth
let alarmPheremonesWidth
let counterClockwiseYPos
let clockwiseYPos
let exaflareYPos
let fightingSpiritsYPos
let malformedReincarnationYPos
let tripleKasumiGiriYPos
let fleetingLaiGiriYPos
let azureAuspiceYPos
let analysisYPos
let alarmPheremonesYPos
let padding

let logWindowRow6
let logWindowRow5
let logWindowRow4
let logWindowRow3
let logWindowRow2
let logWindowRow1

let inRectangleAoE
let inEdgeOfArena

let doneWithMechanic

let boardRotationDegrees = 0
let angleDiffFromMouse = 0

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
    let cnv = createCanvas(1000, 700)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)

    frameRate(62) // keep everything consistent!

    lastHitBy = {
        1: ["None", 0],
        2: ["None", 0],
        3: ["None", 0],
        4: ["None", 0]
    }

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    mechanic = "Analysis"
    mechanicStarted = millis()
    // everyone except for you starts off the map
    drgPosX = -100
    sgePosX = -100
    warPosX = -100
    bossPosX = -100

    // sometimes the arrows cover east and west, other times north and south
    rotatePlayers = random([false, true])

    // test persisting rect
    AoEs = (rotatePlayers) ? [ // N&S
        new PersistingRectangleAOE(420, 20, 112, 112, 0, 60000),
        new PersistingRectangleAOE(532, 20, 112, 112, 6100, 60000),
        new PersistingRectangleAOE(644, 20, 112, 112, 7200, 60000),
        new PersistingRectangleAOE(756, 20, 112, 112, 8300, 60000),
        new PersistingRectangleAOE(868, 20, 112, 112, 9400, 60000),
        new PersistingRectangleAOE(868, 132, 112, 112, 10500, 60000),
        new PersistingRectangleAOE(756, 132, 112, 112, 11600, 60000),
        new PersistingRectangleAOE(644, 132, 112, 112, 12700, 60000),
        new PersistingRectangleAOE(532, 132, 112, 112, 13800, 60000),
        new PersistingRectangleAOE(420, 132, 112, 112, 14900, 60000),

        new PersistingRectangleAOE(868, 468, 112, 112, 0, 60000),
        new PersistingRectangleAOE(756, 468, 112, 112, 6100, 60000),
        new PersistingRectangleAOE(644, 468, 112, 112, 7200, 60000),
        new PersistingRectangleAOE(532, 468, 112, 112, 8300, 60000),
        new PersistingRectangleAOE(420, 468, 112, 112, 9400, 60000),
        new PersistingRectangleAOE(420, 356, 112, 112, 10500, 60000),
        new PersistingRectangleAOE(532, 356, 112, 112, 11600, 60000),
        new PersistingRectangleAOE(644, 356, 112, 112, 12700, 60000),
        new PersistingRectangleAOE(756, 356, 112, 112, 13800, 60000),
        new PersistingRectangleAOE(868, 356, 112, 112, 14900, 60000)
    ] : [ // E&W
        new PersistingRectangleAOE(420, 468, 112, 112, 0, 60000),
        new PersistingRectangleAOE(420, 356, 112, 112, 6100, 60000),
        new PersistingRectangleAOE(420, 244, 112, 112, 7200, 60000),
        new PersistingRectangleAOE(420, 132, 112, 112, 8300, 60000),
        new PersistingRectangleAOE(420, 20, 112, 112, 9400, 60000),
        new PersistingRectangleAOE(532, 20, 112, 112, 10500, 60000),
        new PersistingRectangleAOE(532, 132, 112, 112, 11600, 60000),
        new PersistingRectangleAOE(532, 244, 112, 112, 12700, 60000),
        new PersistingRectangleAOE(532, 356, 112, 112, 13800, 60000),
        new PersistingRectangleAOE(532, 468, 112, 112, 14900, 60000),

        new PersistingRectangleAOE(868, 20, 112, 112, 0, 60000),
        new PersistingRectangleAOE(868, 132, 112, 112, 6100, 60000),
        new PersistingRectangleAOE(868, 244, 112, 112, 7200, 60000),
        new PersistingRectangleAOE(868, 356, 112, 112, 8300, 60000),
        new PersistingRectangleAOE(868, 468, 112, 112, 9400, 60000),
        new PersistingRectangleAOE(756, 468, 112, 112, 10500, 60000),
        new PersistingRectangleAOE(756, 356, 112, 112, 11600, 60000),
        new PersistingRectangleAOE(756, 244, 112, 112, 12700, 60000),
        new PersistingRectangleAOE(756, 132, 112, 112, 13800, 60000),
        new PersistingRectangleAOE(756, 20, 112, 112, 14900, 60000)
    ]

    // random debuff direction
    debuffDirection = random(
        [Direction.Up, Direction.Right, Direction.Down, Direction.Left])

    // there are 8 possibilities:
    // 1:
    // →O  ↓
    //     ←
    //
    // →  O
    // ↑   ←
    // 2: same as 1, but with the SE orb 1 square to the right
    // 3: same as 1, except the orb that triggers immediately is on the
    //    opposite side of the board
    // 4: same as 2, except the orb that triggers immediately is on the
    //    opposite side of the board
    // 5: same as 1, but rotated 90º
    // 6: same as 2, but rotated 90º
    // 7: same as 3, but rotated 90º
    // 8: same as 4, but rotated 90º
    // 1, 2, 3, and 4 only trigger with rotatePlayers
    // 5, 6, 7, and 8 only trigger with !rotatePlayers

    if (rotatePlayers) {
        possibility = random([1, 2, 3, 4])
        if (possibility === 1) {
            orbOnePosition = [588, 76]
            orbTwoPosition = [812, 412]
        } if (possibility === 2) {
            orbOnePosition = [588, 76]
            orbTwoPosition = [924, 412]
        } if (possibility === 3) {
            orbOnePosition = [812, 524]
            orbTwoPosition = [588, 188]
        } if (possibility === 4) {
            orbOnePosition = [812, 524]
            orbTwoPosition = [476, 188]
        }
    } else {
        possibility = random([5, 6, 7, 8])
        if (possibility === 5) {
            orbOnePosition = [924, 188]
            orbTwoPosition = [588, 412]
        } if (possibility === 6) {
            orbOnePosition = [924, 188]
            orbTwoPosition = [588, 524]
        } if (possibility === 7) {
            orbOnePosition = [476, 412]
            orbTwoPosition = [812, 188]
        } if (possibility === 8) {
            orbOnePosition = [476, 412]
            orbTwoPosition = [812, 76]
        }
    }

    cleaveOneSafeDirection = random(
        [Direction.Up, Direction.Right, Direction.Down, Direction.Left])

    yourDebuffNumber = random([3, 5])
    bossBuffNumber = random([3, 5])
    yourRotationClockwise = random([true, false])
    bossRotationClockwise = random([true, false])
    yourRotationWentOff = false
    bossRotationWentOff = false
    gotHitByFirstOrb = false
    gotHitBySecondOrb = false
    gotHitByTether = false
    angleMode(RADIANS)

    textFont(variableWidthFont, 20)
    padding = 4

    heightForNoTextDescent = textAscent() + 4
    heightForTextDescent = textAscent() + 4 + textDescent()/2

    counterClockwiseWidth = textWidth("Rotate counterclockwise 90º") + 5
    clockwiseWidth = textWidth("Rotate clockwise 90º") + 5
    exaflareWidth = textWidth("Exaflares") + padding*2
    // fightingSpiritsWidth = textWidth("Fighting Spirits") + padding*2
    // malformedReincarnationWidth = textWidth("Malformed Reincarnation") + padding*2
    tripleKasumiGiriWidth = textWidth("Triple Kasumi-Giri") + padding*2
    // fleetingLaiGiriWidth = textWidth("Fleeting Lai-Giri") + padding*2
    azureAuspiceWidth = textWidth("Azure Auspice") + padding*2
    analysisWidth = textWidth("Analysis") + padding*2
    alarmPheremonesWidth = textWidth("Alarm Pheremones") + padding*2

    counterClockwiseYPos = 300
    clockwiseYPos = 340
    exaflareYPos = 380
    // fightingSpiritsYPos = exaflareYPos + heightForNoTextDescent + 5
    // malformedReincarnationYPos = fightingSpiritsYPos + heightForTextDescent + 5
    tripleKasumiGiriYPos = exaflareYPos + heightForNoTextDescent + 5
    // fleetingLaiGiriYPos = tripleKasumiGiriYPos + heightForTextDescent + 5
    azureAuspiceYPos = tripleKasumiGiriYPos + heightForTextDescent + 5
    analysisYPos = azureAuspiceYPos + heightForTextDescent + 5
    alarmPheremonesYPos = analysisYPos + heightForTextDescent + 5


    // opening statements
    logWindowRow6 = {"text": "Movement abilities are restricted.", "color": [0, 80, 80]}
    logWindowRow5 = {"text": "Use W, A, S, and D to move.", "color": [72, 80, 80]}
    logWindowRow4 = {"text": "Click on part of the microscope to change" +
            " facing.", "color": [72, 80, 80]}
    logWindowRow3 = {"text": "Click on any mechanic button to change to it.", "color": [72, 80, 80]}
    logWindowRow2 = {"text": "Feel free to execute mechanics incorrectly to" +
            " test!", "color": [144, 80, 80]}
    logWindowRow1 = {"text": "Loading Analysis...", "color": [0, 0, 100]}

    // the board rotation degrees is an arriving number
    boardRotationDegrees = new ArrivingNumber(5, 50)
    boardRotationDegrees.pos = 0
    boardRotationDegrees.target = 0

    textSize(14)
}

// display an arrow at a specified location in a specified direction
function displayArrow(x, y, direction) {
    push()
    translate(x, y)
    direction.rotateToDirection()
    rect(-25, -10, 40, 20) // arrow base
    triangle(5, 20, 30, 0, 5, -20) // arrow head
    noStroke()
    rect(0, -9, 10, 18) // get rid of extra stroke
    pop()
}

function drawRotationSymbol(x, y, disappearsWhen, isClockwise) {
    let millisUntilDisappears = disappearsWhen - millis()
    if (millisUntilDisappears > 0 && millisUntilDisappears < 10000) {
        stroke(20, 100, 40)
        strokeWeight(2)
        noFill()

        // outer circle
        push()
        translate(x, y)
        circle(0, 0, 50)

        // now the lines
        // a small rotation as well
        // the linesn rotate with some sign as well
        push()
        angleMode(DEGREES)
        if (8300 < millisUntilDisappears && millisUntilDisappears < 9000) {
            rotate(map(millisUntilDisappears, 9000, 8300, 0, isClockwise ? 90 : -90))
        } else if (6300 < millisUntilDisappears && millisUntilDisappears < 7000) {
            rotate(map(millisUntilDisappears, 7000, 6300, 0, isClockwise ? 90 : -90))
        } else if (4300 < millisUntilDisappears && millisUntilDisappears < 5000) {
            rotate(map(millisUntilDisappears, 5000, 4300, 0, isClockwise ? 90 : -90))
        } else if (2300 < millisUntilDisappears && millisUntilDisappears < 3000) {
            rotate(map(millisUntilDisappears, 3000, 2300, 0, isClockwise ? 90 : -90))
        } else if (300 < millisUntilDisappears && millisUntilDisappears < 1000) {
            rotate(map(millisUntilDisappears, 1000, 300, 0, isClockwise ? 90 : -90))
        }
        if ((7500 < millisUntilDisappears && millisUntilDisappears < 8300) ||
            (5500 < millisUntilDisappears && millisUntilDisappears < 6300) ||
            (3500 < millisUntilDisappears && millisUntilDisappears < 4300) ||
            (1500 < millisUntilDisappears && millisUntilDisappears < 2300) ||
            (0 < millisUntilDisappears && millisUntilDisappears < 300))
            rotate(isClockwise ? 90 : -90)
        angleMode(RADIANS)
        line(-17, -17, 17, 17)
        line(-17, 17, 17, -17)

        if (abs(millisUntilDisappears - 7500) < 300) {
            stroke(20, 100, 40, map(abs(millisUntilDisappears - 7500), 0, 300, 0, 100))
        } else if (abs(millisUntilDisappears - 5500) < 300) {
            stroke(20, 100, 40, map(abs(millisUntilDisappears - 5500), 0, 300, 0, 100))
        } else if (abs(millisUntilDisappears - 3500) < 300) {
            stroke(20, 100, 40, map(abs(millisUntilDisappears - 3500), 0, 300, 0, 100))
        } else if (abs(millisUntilDisappears - 1500) < 300) {
            stroke(20, 100, 40, map(abs(millisUntilDisappears - 1500), 0, 300, 0, 100))
        } else if (abs(millisUntilDisappears) < 300) {
            stroke(20, 100, 40, map(abs(millisUntilDisappears), 0, 300, 0, 100))
        }
        line(-7, -7, 0, -15)
        line(7, -7, 0, -15)
        pop()


        // add a triangle where it's going to rotate if it's V
        stroke(240, 50, 50)
        fill(240, 50, 50)
        triangle(isClockwise ? 27 : -27, -3, isClockwise ? 27 : -27, 3, isClockwise ? 32 : -32, 0)

        // add 3 triangles where it's going to rotate if it's III
        stroke(30, 50, 50)
        fill(30, 50, 50)
        triangle(isClockwise ? -33 : 33, 3, isClockwise ? -27 : 27, 3, isClockwise ? -30 : 30, -3)
        triangle(isClockwise ? -3 : 3, 27, isClockwise ? -3 : 3, 33, isClockwise ? -8 : 8, 30)

        // and the number of seconds until it's done
        if (millisUntilDisappears < 5000) {
            let secondsUntilDisappears = ceil((millisUntilDisappears)/1000)
            let millisUntilSecondsChange = millisUntilDisappears - secondsUntilDisappears*1000 + 1000
            print(millisUntilSecondsChange)
            stroke(0, 0, 100, map(
                millisUntilSecondsChange, 1000, 0, 300, -100
            ))
            strokeWeight(6)
            // if it's 1, 3, or 5, there's a dot in the middle
            if (secondsUntilDisappears % 2 === 1) {
                point(0, 0)
            }
            // if it's 2+, there's 2 dots at the bottom-left and
            // bottom-right corners
            if (secondsUntilDisappears > 1) {
                point(-12, 12)
                point(12, -12)
            }

            // if it's 4+, there's 2 dotsd at the other corners
            if (secondsUntilDisappears > 3) {
                point(12, 12)
                point(-12, -12)
            }
        }
        pop()
    }
}

function draw() {
    background(234, 34, 24)


    // add helper toggle
    if (!helper) {
        textSize(30)
        fill(0, 0, 25)
        if (mouseX > width - 205 && mouseX < width &&
            mouseY > height - 100 && mouseY < height - 70) fill(0, 0, 20)
        noStroke()
        rect(width - 205, height - 100, width, 30)
        fill(0, 0, 100)
        text("Enable helper", width - 205, height - 73)
    }

    // add mechanic buttons
    // each one has rounded corners and is separated

    fill(0, 0, 25)
    stroke(0, 0, 100)
    strokeWeight(1)
    textSize(20)

    // exaflares
    if (mouseX > padding && mouseX < exaflareWidth + 5 &&
        mouseY > exaflareYPos && mouseY < exaflareYPos + heightForNoTextDescent)
        fill(0, 0, 15)
    rect(padding + 1, exaflareYPos, exaflareWidth, heightForNoTextDescent, 5)

    // // fighting spirits
    // fill(0, 0, 25)
    // if (mouseX > padding && mouseX < fightingSpiritsWidth + 5 &&
    //     mouseY > fightingSpiritsYPos && mouseY < fightingSpiritsYPos
    //     + heightForTextDescent) fill(0, 0, 15)
    // rect(padding + 1, fightingSpiritsYPos, fightingSpiritsWidth, heightForTextDescent, 5)

    // // malformed reincarnation
    // fill(0, 0, 25)
    // if (mouseX > padding && mouseX < malformedReincarnationWidth + 5 &&
    //     mouseY > malformedReincarnationYPos && mouseY < malformedReincarnationYPos
    //     + heightForNoTextDescent) fill(0, 0, 15)
    // rect(padding + 1, malformedReincarnationYPos, malformedReincarnationWidth, heightForNoTextDescent, 5)

    // triple kasumi-giri
    fill(0, 0, 25)
    if (mouseX > padding && mouseX < tripleKasumiGiriWidth + 5 &&
        mouseY > tripleKasumiGiriYPos && mouseY < tripleKasumiGiriYPos
        + heightForTextDescent) fill(0, 0, 15)
    rect(padding + 1, tripleKasumiGiriYPos, tripleKasumiGiriWidth, heightForTextDescent, 5)

    // // fleeting lai-giri
    // fill(0, 0, 25)
    // if (mouseX > padding && mouseX < fleetingLaiGiriWidth + 5 &&
    //     mouseY > fleetingLaiGiriYPos && mouseY < fleetingLaiGiriYPos
    //     + heightForTextDescent) fill(0, 0, 15)
    // rect(padding + 1, fleetingLaiGiriYPos, fleetingLaiGiriWidth, heightForTextDescent, 5)

    fill(0, 0, 25)
    // azure auspice
    if (mouseX > padding && mouseX < azureAuspiceWidth + 5 &&
        mouseY > azureAuspiceYPos && mouseY < azureAuspiceYPos + heightForTextDescent)
        fill(0, 0, 15)
    rect(padding + 1, azureAuspiceYPos, azureAuspiceWidth, heightForTextDescent, 5)

    // analysis
    fill(0, 0, 25)
    if (mouseX > padding && mouseX < analysisWidth + 5 &&
        mouseY > analysisYPos && mouseY < analysisYPos + heightForTextDescent) fill(0, 0, 15)
    rect(padding + 1, analysisYPos, analysisWidth, heightForTextDescent, 5)

    // alarm pheremones
    fill(0, 0, 25)
    if (mouseX > padding && mouseX < alarmPheremonesWidth + 5 &&
        mouseY > alarmPheremonesYPos && mouseY < alarmPheremonesYPos + heightForTextDescent) fill(0, 0, 15)
    rect(padding + 1, alarmPheremonesYPos, alarmPheremonesWidth, heightForNoTextDescent, 5)

    // also add a few rotation buttons
    // counterclockwise
    fill(0, 0, 25)
    if (mouseX > padding && mouseX < counterClockwiseWidth + 5 &&
        mouseY > counterClockwiseYPos && mouseY < counterClockwiseYPos + heightForNoTextDescent)
        fill(0, 0, 15)
    rect(padding + 1, counterClockwiseYPos, counterClockwiseWidth, heightForNoTextDescent, 5)

    // clockwise
    fill(0, 0, 25)
    if (mouseX > padding && mouseX < clockwiseWidth + 5 &&
        mouseY > clockwiseYPos && mouseY < clockwiseYPos + heightForNoTextDescent)
        fill(0, 0, 15)
    rect(padding + 1, clockwiseYPos, clockwiseWidth, heightForNoTextDescent, 5)

    fill(0, 0, 100)
    noStroke()
    text("Rotate counterclockwise 90º", padding * 2 + 1, counterClockwiseYPos + textAscent() - 1)
    text("Rotate clockwise 90º", padding * 2 + 1, clockwiseYPos + textAscent() - 1)
    text("Exaflares", padding * 2 + 1, exaflareYPos + textAscent() - 1)
    // text("Fighting Spirits", padding*2 + 1, fightingSpiritsYPos + textAscent())
    // text("Malformed Reincarnation", padding*2 + 1, malformedReincarnationYPos + textAscent() - 1)
    text("Triple Kasumi-Giri", padding * 2 + 1, tripleKasumiGiriYPos + textAscent())
    // text("Fleeting Lai-Giri", padding*2 + 1, fleetingLaiGiriYPos + textAscent())
    text("Azure Auspice", padding * 2 + 1, azureAuspiceYPos + textAscent())
    text("Analysis", padding * 2 + 1, analysisYPos + textAscent())
    text("Alarm Pheremones", padding * 2 + 1, alarmPheremonesYPos + textAscent())


    push()

    // translate to the center of the board
    translate(700, 300)

    // if the mouse is pressed, then set the arriving number's target to that
    if (mouseIsPressed &&
        mouseX > 400 && mouseX < 1000 &&
        mouseY > 0 && mouseY < 700) {
        if (angleDiffFromMouse === 0) {
            angleDiffFromMouse = degrees(atan2(mouseY - 300, mouseX - 700)) + 90 - boardRotationDegrees.target
        }
        boardRotationDegrees.target = degrees(atan2(mouseY - 300, mouseX - 700)) + 90 - angleDiffFromMouse
        boardRotationDegrees.target = boardRotationDegrees.target % 360
    } else {
        // otherwise, set it to the nearest corner
        if (boardRotationDegrees.target % 360 > 45 && boardRotationDegrees.target % 360 < 135) boardRotationDegrees.target = 90
        if (boardRotationDegrees.target % 360 > 135 && boardRotationDegrees.target % 360 < 225) boardRotationDegrees.target = 180
        if (boardRotationDegrees.target % 360 > 225 && boardRotationDegrees.target % 360 < 315) boardRotationDegrees.target = 270
        if (boardRotationDegrees.target % 360 < 45 || boardRotationDegrees.target % 360 > 315) boardRotationDegrees.target = 0
        angleDiffFromMouse = 0
    }

    // update the arriving number, then rotate to it
    boardRotationDegrees.arrive()
    boardRotationDegrees.update()
    rotate(radians(boardRotationDegrees.pos))

    // display a wooden chess board, basically
    // (with red stuff on the outside and a purple entrance on at the bottom)
    if (mechanic === "Exoflares" || mechanic === "Fighting Spirits" || mechanic === "Malformed Reincarnation") { // Gorai
        // draw the red stuff on the outside
        fill(0, 80, 75)
        rect(-300, -300, 600, 600)

        // display the purple entrance
        stroke(300, 50, 50)
        strokeWeight(2)
        line(-50, 300, 50, 300)
        fill(20, 50, 40)

        // now display the chess board
        noStroke()
        rect(-280, -280, 560, 560)
        // display the darker parts of the chess board (just a little darker)
        for (let xIncrements = 0; xIncrements < 8; xIncrements++) {
            for (let yIncrements = 0; yIncrements < 8; yIncrements++) {
                if ((xIncrements + yIncrements) % 2 === 0) {
                    fill(20, 50, 38)
                    rect(-279 + xIncrements * 70, -279 + yIncrements * 70, 68, 68)
                }
            }
            stroke(0, 0, 0)
            strokeWeight(1)
            line(-280 + xIncrements * 70, -280, -280 + xIncrements * 70, 280) // x line
            line(-280, -280 + xIncrements * 70, 280, -280 + xIncrements * 70) // y line
            noStroke()
        }
        stroke(0, 0, 0)
        strokeWeight(1)
        line(280, -280, 280, 280) // total bottom x line
        line(-280, 280, 280, 280) // total right y line
    }
    if (mechanic === "Triple Kasumi-Giri" || mechanic === "Fleeting Lai-Giri" || mechanic === "Azure Auspice") { // Moko
        let rowHeight = 600 / 19 // there are 19 rows and 20 columns
        let columnWidth = 600 / 20
        fill(0, 0, 50)
        rect(-300, -300, 600, 600)

        // display the purple entrance
        stroke(300, 50, 50)
        strokeWeight(2)
        line(-50, 300, 50, 300)

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

                line(-300, -300 + rowHeight * yIncrements, 300, -300 + rowHeight * yIncrements) // straight line across
            } else { // many fragmented lines across
                line(-300 + columnWidth, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 3, -300 + rowHeight * yIncrements)
                line(-300 + columnWidth * 5, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 7, -300 + rowHeight * yIncrements)
                line(-300 + columnWidth * 9, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 11, -300 + rowHeight * yIncrements)
                line(-300 + columnWidth * 13, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 15, -300 + rowHeight * yIncrements)
                line(-300 + columnWidth * 17, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 19, -300 + rowHeight * yIncrements)
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
                line(-300 + columnWidth, -300 + rowHeight * yIncrements,
                    -300 + columnWidth, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 3, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 3, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 4, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 4, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 5, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 5, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 7, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 7, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 8, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 8, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 9, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 9, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 11, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 11, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 12, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 12, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 13, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 13, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 15, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 15, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 16, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 16, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 17, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 17, -300 + rowHeight * (yIncrements + 1))
                line(-300 + columnWidth * 19, -300 + rowHeight * yIncrements,
                    -300 + columnWidth * 19, -300 + rowHeight * (yIncrements + 1))
            }
        }

        // we draw a low-opacity border that covers 2 columns and a little less
        // than 2 rows on each side
        fill(120, 80, 50, 20)
        noStroke()
        beginShape()
        vertex(-300, -300)
        vertex(-300, 300)
        vertex(300, 300)
        vertex(300, -300)
        beginContour()
        vertex(-300 + columnWidth * 2, -300 + rowHeight * 2 - 3)
        vertex(700 - columnWidth * 2, -300 + rowHeight * 2 - 3)
        vertex(700 - columnWidth * 2, 300 - rowHeight * 2 + 3)
        vertex(-300 + columnWidth * 2, 300 - rowHeight * 2 + 3)
        endContour()
        endShape()
    }
    if (mechanic === "Analysis") { // Lala background
        // there are 5 rows and 5 columns, and all we really need to do is
        // display that in the 560 width and 560 height that we have after
        // making the outside unsafe. Each square has a size of 560/5 = 112.
        // first we just display a blue background for the unsafe section, and
        // then we draw the stone board on top
        fill(180, 100, 70)
        noStroke()
        rect(-300, -300, 600, 600)
        fill(20, 20, 20)
        rect(-280, -280, 560, 560)

        // display the purple entrance
        stroke(300, 50, 50)
        strokeWeight(2)
        line(-50, 300, 50, 300)
        fill(20, 50, 40)

        // now we display the lines
        stroke(0, 0, 0)
        strokeWeight(3)
        let squareSize = 112
        // vertical first
        for (let xPos = -280; xPos < 300; xPos += squareSize) {
            line(xPos, -280, xPos, 280)
        }
        // then horizontal
        for (let yPos = -280; yPos < 300; yPos += squareSize) {
            line(-280, yPos, 280, yPos)
        }

        // display the persisting rects
        let previouslyInRectangleAoE = inRectangleAoE
        inRectangleAoE = false
        for (let AoE of AoEs) {
            AoE.displayAoE()
        }
        if (inRectangleAoE && !previouslyInRectangleAoE) {
            logWindowRow6 = logWindowRow5
            logWindowRow5 = logWindowRow4
            logWindowRow4 = logWindowRow3
            logWindowRow3 = logWindowRow2
            logWindowRow2 = logWindowRow1
            logWindowRow1 = {
                "text": "You are in a persisting rectangle AoE.",
                "color": [0, 80, 80]
            }
        }
        if (!inRectangleAoE && previouslyInRectangleAoE) {
            logWindowRow6 = logWindowRow5
            logWindowRow5 = logWindowRow4
            logWindowRow4 = logWindowRow3
            logWindowRow3 = logWindowRow2
            logWindowRow2 = logWindowRow1
            logWindowRow1 = {
                "text": "You left the persisting rectangle AoE(s).",
                "color": [144, 80, 80]
            }
        }
    }
    if (mechanic === "Alarm Pheremones") { // Arcadion M2S background
        // display the death donut as just a square, but then add a grey
        // circle for the base of the board ond top of it
        fill(240, 50, 50)
        square(-300, -300, 600)
        fill(0, 0, 40)
        circle(0, 0, 560)

        // add 4 lines going through the center at cardinals and intercards
        stroke(0, 0, 100)
        line(-280, 0, 280, 0)
        line(0, -280, 0, 280)
        line(-280 * sin(radians(45)), -280 * sin(radians(45)),
            280 * sin(radians(45)), 280 * sin(radians(45)))
        line(280 * sin(radians(45)), -280 * sin(radians(45)),
            -280 * sin(radians(45)), 280 * sin(radians(45)))
    }

    // display N, S, W, and E
    textSize(15)

    // red color for north
    fill(0, 100, 100)
    noStroke()
    text("N", textWidth("N") / 2, -300 + textAscent())

    // creamy color for east, south, and west
    fill(45, 20, 100)
    text("E", 300 - textWidth("E") - 5, textAscent() / 2)
    text("S", -textWidth("S") / 2, 298)
    text("W", -298, textAscent() / 2)

    textSize(30)
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
            rect(-350, -300, 50, height)

            // now if you performed the mechanic correctly you can pass
            if (doneWithMechanic === false && millis() - mechanicStarted > 15000 && !partyWiped) {
                doneWithMechanic = true
                logWindowRow6 = logWindowRow5
                logWindowRow5 = logWindowRow4
                logWindowRow4 = logWindowRow3
                logWindowRow3 = logWindowRow2
                logWindowRow2 = logWindowRow1
                logWindowRow1 = {
                    "text": `You executed the mechanic perfectly.`,
                    "color": [144, 80, 80]
                }
            }
            break
        case "Triple Kasumi-Giri":
            // add the ring that represents facing
            stroke(0, 0, 100)
            strokeWeight(1)
            noFill()
            circle(bossPosX - 700, bossPosY - 300, 160) // note: this is 160 diameter, not 160 radius
            fill(0, 0, 100)
            noStroke()

            // along with the triangle pointing the way that the boss is facing
            if (bossFacing === 1) { // up
                triangle(bossPosX - 710, bossPosY - 380, bossPosX - 690,
                    bossPosY - 380, bossPosX - 700, bossPosY - 396)
            }
            if (bossFacing === 2) { // right
                triangle(bossPosX - 620, bossPosY - 310, bossPosX - 620,
                    bossPosY - 290, bossPosX - 604, bossPosY - 300)
            }
            if (bossFacing === 3) { // down
                triangle(bossPosX - 710, bossPosY - 220, bossPosX - 690,
                    bossPosY - 220, bossPosX - 700, bossPosY - 204)
            }
            if (bossFacing === 4) { // left
                triangle(bossPosX - 780, bossPosY - 310, bossPosX - 780,
                    bossPosY - 290, bossPosX - 796, bossPosY - 300)
            }

            // first cleave
            // note: the AoE opacity always starts at 0, meaning that if it's
            // meant to resolve immediately, we have to set the opacity to
            // something other than 0
            if (millis() - mechanicStarted > 8500 && !firstAoEResolved) {
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
                        225 + cleaveOneSafeDirection * 90 - 90 + bossFacing * 90,
                        135 + cleaveOneSafeDirection * 90 - 90 + bossFacing * 90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2 from
                // the direction of the cleave
                bossFacing = (cleaveOneSafeDirection + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            // second cleave
            if (millis() - mechanicStarted > 11500 && !secondAoEResolved) {
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
                        225 + cleaveTwoSafeDirection * 90 - 90 + bossFacing * 90,
                        135 + cleaveTwoSafeDirection * 90 - 90 + bossFacing * 90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2 from
                // the direction of the cleave
                bossFacing = (cleaveTwoSafeDirection + bossFacing - 1 + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            // third cleave
            if (millis() - mechanicStarted > 15500 && !thirdAoEResolved) {
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
                        225 + cleaveThreeSafeDirection * 90 - 90 + bossFacing * 90,
                        135 + cleaveThreeSafeDirection * 90 - 90 + bossFacing * 90, 0)
                )
                AoEs[AoEs.length - 1].opacity = 10

                // face away from the cleave. Always plus 2 or minus 2 from
                // the direction of the cleave
                bossFacing = (cleaveThreeSafeDirection + bossFacing - 1 + 2) % 4
                if (bossFacing === 0) bossFacing = 4
            }

            // display the AoEs from the cleave and the circle/donut
            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }
            break
        case "Azure Auspice":
            // since there's no other people involved and there's no special
            // symbols, unlike in Triple Kasumi-Giri, we can just display all
            // the AoEs and boom, done.
            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }
            break
        case "Analysis":
            // display your "shield"
            // it's just a bright 270º arc around you with the safe spot
            // being the empty spot
            push()
            translate(posX - 700, posY - 300)
            yourFacing.rotateToDirection()
            debuffDirection.rotateToDirection()
            stroke(0, 0, 100)
            noFill()
            strokeWeight(10)
            angleMode(DEGREES)
            arc(0, 0, 80, 80, 135, 45)
            angleMode(RADIANS)
            pop()


            // timings:
            // the initial arrows are activated at 5s
            // the rectangle AoEs will move to the second arrows at 9.4s
            // they will move to the third arrows at 10.5s

            // now display the arrows
            // N&S (!rotatePlayers): NE pointing S and SW pointing N
            // timings:
            // the initial arrows are activated at 5s
            // the rectangle AoEs will move to the second arrows at 9.4s
            // they will move to the third arrows at 10.5s

            // now display the arrows
            // N&S (!rotatePlayers): NE pointing S and SW pointing N
            if (!rotatePlayers) {
                // initial ones at the corners
                if (millis() - mechanicStarted < 5000) {
                    // NE pointing S
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(224, -224, Direction.Down)

                    // SW pointing N
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-224, 224, Direction.Up)
                }

                // then it comes around to SE pointing W and NW pointing E
                if (millis() - mechanicStarted < 9400) {
                    // SE pointing W
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(224, 224, Direction.Left)

                    // NW pointing E
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-224, -224, Direction.Right)
                }

                // one cell after that, we get more N/S things
                if (millis() - mechanicStarted < 10500) {
                    // SE pointing N
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(112, 224, Direction.Up)

                    // NW pointing S
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-112, -224, Direction.Down)
                }
            }
            // E&W (rotatePlayers): NW pointing E and SE pointing W
            if (rotatePlayers) {
                // initial ones at the corners
                if (millis() - mechanicStarted < 5000) {
                    // SE pointing W
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(224, 224, Direction.Left)

                    // NW pointing E
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-224, -224, Direction.Right)
                }

                // then it comes around to NE pointing S and SW pointing N
                if (millis() - mechanicStarted < 9400) {
                    // NE pointing S
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(224, -224, Direction.Down)

                    // SW pointing N
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-224, 224, Direction.Up)
                }

                // one cell after that, we get more E/W things
                if (millis() - mechanicStarted < 10500) {
                    // NE pointing W
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(224, -112, Direction.Left)

                    // SW pointing E
                    fill(0, 0, 0)
                    stroke(0, 0, 50)
                    strokeWeight(2)
                    displayArrow(-224, 112, Direction.Right)
                }
            }

            // display the orbs
            // the first goes off at 6.1s, and the second goes off at
            // 13.8s/14.9s (13.8s if possibility is odd)
            stroke(0, 0, 50)
            strokeWeight(30)
            if (millis() - mechanicStarted < 6100) {
                point(orbOnePosition[0] - 700, orbOnePosition[1] - 300)
                if (helper) {
                    // check if angle is correct
                    angleMode(DEGREES)
                    let safeSpot = new Direction(
                        yourFacing.angle + debuffDirection.angle
                    )
                    let angleFromOrb = atan2(
                        orbOnePosition[1] - posY, orbOnePosition[0] - posX
                    )
                    let angleDiff = safeSpot.angle % 360 - angleFromOrb % 360

                    // if check was failed, make it a red line
                    stroke(120, 100, 100)
                    if ((angleDiff + 360) % 360 < 225 || (angleDiff + 360) % 360 > 315) {
                        stroke(0, 100, 100)
                    }
                    strokeWeight(3)
                    line(posX - 700, posY - 300, orbTwoPosition[0] - 700, orbTwoPosition[1] - 300)
                    angleMode(RADIANS)
                }
            } else {
                if (!firstOrbWentOff) {
                    firstOrbWentOff = true
                    // check if angle is correct
                    angleMode(DEGREES)
                    let safeSpot = new Direction(
                        yourFacing.angle + debuffDirection.angle
                    )
                    let angleFromOrb = atan2(
                        orbOnePosition[1] - posY, orbOnePosition[0] - posX
                    )
                    let angleDiff = safeSpot.angle % 360 - angleFromOrb % 360

                    // if check was failed, the party wiped!
                    if ((angleDiff + 360) % 360 < 225 || (angleDiff + 360) % 360 > 315) {
                        partyWiped = true
                        causeOfWipe = "You got hit by the first orb."
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You got hit by the first orb.",
                            "color": [0, 80, 80]
                        }
                        gotHitByFirstOrb = true
                    } else {
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You didn't get hit by the first orb.",
                            "color": [144, 80, 80]
                        }
                    }
                    angleMode(RADIANS)
                }

                // also display a check mark or x mark over your head temporarily
                stroke(gotHitByFirstOrb ? 0 : 120, 100, 80, map(
                    millis() - mechanicStarted, 6100, 8100, 600, 0
                ))
                strokeWeight(4)
                // display an X or a check mark
                if (gotHitByFirstOrb) {
                    line(posX - 710, posY - 360, posX - 690, posY - 340)
                    line(posX - 710, posY - 340, posX - 690, posY - 360)
                } else {
                    line(posX - 710, posY - 348, posX - 703, posY - 340)
                    line(posX - 703, posY - 340, posX - 690, posY - 360)
                }
            }

            if (millis() - mechanicStarted < 13800 ||
                (millis() - mechanicStarted < 14900 && possibility % 2 === 0)) {
                stroke(0, 0, 50)
                strokeWeight(30)
                point(orbTwoPosition[0] - 700, orbTwoPosition[1] - 300)
                if (helper) {
                    // check if angle is correct
                    angleMode(DEGREES)
                    let safeSpot = new Direction(
                        yourFacing.angle + debuffDirection.angle
                    )
                    let angleFromOrb = atan2(
                        orbTwoPosition[1] - posY, orbTwoPosition[0] - posX
                    )
                    let angleDiff = safeSpot.angle % 360 - angleFromOrb % 360

                    // if check was failed, make it a red line
                    stroke(120, 100, 100)
                    if ((angleDiff + 360) % 360 < 225 || (angleDiff + 360) % 360 > 315) {
                        stroke(0, 100, 100)
                    }
                    strokeWeight(3)
                    line(posX - 700, posY - 300, orbTwoPosition[0] - 700, orbTwoPosition[1] - 300)
                    angleMode(RADIANS)
                }
            } else {
                if (!secondOrbWentOff) {
                    secondOrbWentOff = true
                    // check if angle is correct
                    angleMode(DEGREES)
                    let safeSpot = new Direction(
                        yourFacing.angle + debuffDirection.angle
                    )
                    let angleFromOrb = atan2(
                        orbTwoPosition[1] - posY, orbTwoPosition[0] - posX
                    )
                    let angleDiff = safeSpot.angle % 360 - angleFromOrb % 360

                    // if check was failed, the party wiped!
                    if ((angleDiff + 360) % 360 < 225 || (angleDiff + 360) % 360 > 315) {
                        partyWiped = true
                        causeOfWipe = "You got hit by the second orb."
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You got hit by the second orb.",
                            "color": [0, 80, 80]
                        }
                        gotHitBySecondOrb = true
                    } else {
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You didn't get hit by the second orb.",
                            "color": [144, 80, 80]
                        }
                    }
                    angleMode(RADIANS)
                }

                // also display a check mark or x mark over your head temporarily
                stroke(gotHitBySecondOrb ? 0 : 120, 100, 80, map(
                    millis() - mechanicStarted, 14900, 16900, 600, 0
                ))
                strokeWeight(4)
                // display an X or a check mark
                if (gotHitBySecondOrb) {
                    line(posX - 710, posY - 360, posX - 690, posY - 340)
                    line(posX - 710, posY - 340, posX - 690, posY - 360)
                } else {
                    line(posX - 710, posY - 348, posX - 703, posY - 340)
                    line(posX - 703, posY - 340, posX - 690, posY - 360)
                }
            }

            // show a Blight semi-telegraph
            // from 6s to 11s
            if (6000 < millis() - mechanicStarted &&
                millis() - mechanicStarted < 11000) {
                push()
                cleaveOneSafeDirection.rotateToDirection()
                fill(20, 100, 50, 10)
                stroke(20, 100, 50)
                strokeWeight(3)
                angleMode(DEGREES)
                arc(0, 0, 848, 848, 135, 45)
                angleMode(RADIANS)

                // then add some dainty red lines as an outline
                line(0, 0, 848, 848)
                line(0, 0, -848, 848)
                pop()
            }
            // from 11s to 12s, show a fading cone AoE
            if (11000 < millis() - mechanicStarted &&
                millis() - mechanicStarted < 12000) {
                push()
                cleaveOneSafeDirection.rotateToDirection()
                fill(0, 100, 50, map(millis() - mechanicStarted,
                    11000, 12000, 100, 0)) // map the millis to the opacity
                noStroke()
                angleMode(DEGREES)
                arc(0, 0, 848, 848, 135, 45)
                angleMode(RADIANS)
                pop()
            }


            drawRotationSymbol(0, -60, mechanicStarted + 10900, bossRotationClockwise)
            drawRotationSymbol(posX - 700, posY - 360, mechanicStarted + 19900, yourRotationClockwise)
            if (millis() - mechanicStarted > 10900) {
                if (!bossRotationWentOff) {
                    bossRotationWentOff = true

                    // rotate
                    // avoid modifying the direction itself
                    cleaveOneSafeDirection = new Direction(cleaveOneSafeDirection.angle)
                    cleaveOneSafeDirection.angle +=
                        ((bossRotationClockwise) ? 90 : -90) * bossBuffNumber
                }
            }
            if (millis() - mechanicStarted > 19950) {
                if (!yourRotationWentOff) {
                    yourRotationWentOff = true

                    // rotate
                    debuffDirection = new Direction(debuffDirection.angle)
                    debuffDirection.angle +=
                        ((yourRotationClockwise) ? 90 : -90) * yourDebuffNumber

                    // then make the tether go off
                    // check if angle is correct
                    angleMode(DEGREES)
                    let safeSpot = new Direction(
                        yourFacing.angle + debuffDirection.angle
                    )
                    let angleFromOrb = atan2(
                        300 - posY, 700 - posX
                    )
                    let angleDiff = safeSpot.angle % 360 - angleFromOrb % 360

                    // if check was failed, the party wiped!
                    if ((angleDiff + 360) % 360 < 225 || (angleDiff + 360) % 360 > 315) {
                        partyWiped = true
                        causeOfWipe = "You got hit by the tether."
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You got hit by the tether.",
                            "color": [0, 80, 80]
                        }
                    } else {
                        logWindowRow6 = logWindowRow5
                        logWindowRow5 = logWindowRow4
                        logWindowRow4 = logWindowRow3
                        logWindowRow3 = logWindowRow2
                        logWindowRow2 = logWindowRow1
                        logWindowRow1 = {
                            "text": "You didn't get hit by the tether.",
                            "color": [144, 80, 80]
                        }
                    }
                    angleMode(RADIANS)
                }
            }


            // now if you performed the mechanic correctly you can pass
            if (doneWithMechanic === false && millis() - mechanicStarted > 21000 && !partyWiped) {
                doneWithMechanic = true
                logWindowRow6 = logWindowRow5
                logWindowRow5 = logWindowRow4
                logWindowRow4 = logWindowRow3
                logWindowRow3 = logWindowRow2
                logWindowRow2 = logWindowRow1
                logWindowRow1 = {
                    "text": `You executed the mechanic perfectly.`,
                    "color": [144, 80, 80]
                }
            }

            break
        case "Alarm Pheremones":
            for (let AoE of AoEs) {
                try {
                    AoE.update()
                    AoE.displayAoE()
                } catch {
                }
            }
            break
    }

    // display you and your party members in your and their respective position
    // after checking for moving
    let directions = []
    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) directions.push(Direction.Left) // A or ← = left
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) directions.push(Direction.Up) // W or ↑ = up
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) directions.push(Direction.Right) // D or → = right
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) directions.push(Direction.Down) // S or ↓ = down

    // we'll need to store this to rotate the direction
    let posXDiff = 0
    let posYDiff = 0
    switch (directions.length) {
        case 1: // move the full 1.3
            if (directions[0] === Direction.Left) posXDiff -= 1.25
            if (directions[0] === Direction.Up) posYDiff -= 1.25
            if (directions[0] === Direction.Right) posXDiff += 1.25
            if (directions[0] === Direction.Down) posYDiff += 1.25
            break
        case 2: // move 0.92 both directions. They still cancel out each other if they're opposite
            if (directions[0] === Direction.Left) posXDiff -= 0.88
            if (directions[0] === Direction.Up) posYDiff -= 0.88
            if (directions[0] === Direction.Right) posXDiff += 0.883
            if (directions[1] === Direction.Up) posYDiff -= 0.88
            if (directions[1] === Direction.Right) posXDiff += 0.88
            if (directions[1] === Direction.Down) posYDiff += 0.88
            break
        case 3: // move the full 1.3 each direction. Virtually moving 1 of the directions, as 2 are guaranteed to cancel out.
            if (directions[0] === Direction.Left) posXDiff -= 1.25
            if (directions[0] === Direction.Up) posYDiff -= 1.25
            if (directions[1] === Direction.Up) posYDiff -= 1.25
            if (directions[1] === Direction.Right) posXDiff += 1.25
            if (directions[2] === Direction.Right) posXDiff += 1.25
            if (directions[2] === Direction.Down) posYDiff += 1.25
            break
    }
    if (directions.length > 0) {
        yourFacing = mixDirections(directions)

        // we modify the directions differently based on the board rotation angle
        if (315 < boardRotationDegrees.target % 360 || boardRotationDegrees.target % 360 < 45) {
            posX += posXDiff
            posY += posYDiff
            yourFacing = new Direction(yourFacing.angle)
        }
        if (45 < boardRotationDegrees.target % 360 && boardRotationDegrees.target % 360 < 135) {
            posX += posYDiff
            posY -= posXDiff
            yourFacing = new Direction(yourFacing.angle - 90)
        }
        if (135 < boardRotationDegrees.target % 360 && boardRotationDegrees.target % 360 < 225) {
            posX -= posXDiff
            posY -= posYDiff
            yourFacing = new Direction(yourFacing.angle - 180)
        }
        if (225 < boardRotationDegrees.target % 360 && boardRotationDegrees.target % 360 < 315) {
            posX -= posYDiff
            posY += posXDiff
            yourFacing = new Direction(yourFacing.angle - 270)
        }
    }
    image(sgeSymbol, sgePosX - 720, sgePosY - 320, 40, 40)
    image(warSymbol, warPosX - 720, warPosY - 320, 40, 40)
    image(drgSymbol, drgPosX - 720, drgPosY - 320, 40, 40)
    image(rdmSymbol, posX - 720, posY - 320, 40, 40)

    // red dot for boss
    strokeWeight(30)
    stroke(0, 100, 100)
    point(bossPosX - 700, bossPosY - 300)

    push()
    translate(posX - 700, posY - 300)
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
    translate(drgPosX - 700, drgPosY - 300)
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
    translate(sgePosX - 700, sgePosY - 300)
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
    translate(warPosX - 700, warPosY - 300)
    warFacing.rotateToDirection()
    fill(45, 100, 100)
    noStroke()
    if (!warFacing.onDiagonal) {
        triangle(20, -10, 20, 10, 40, 0)
    } else { // Display farther away for diagonal facings
        triangle(25, -10, 25, 10, 45, 0)
    }
    pop()
    pop()

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

    // and debuffs (in the static section)
    switch (mechanic) {
        case "Exoflares":
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
            break
        case "Malformed Reincarnation":
            // display the rodential and odder debuffs, as well as the tower-dropping
            // ones
            for (let player of [1, 2, 3, 4]) {
                // each player is displayed on a different y-coordinate
                let yPos = 45 + player * 50
                if (triplesGivenTo.includes(player)) {
                    if (majorityRed.includes(player)) { // drop blue, soak red-red-red
                        stroke(240, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop blue
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
            break
        case "Triple Kasumi-Giri":
            // Each cleave has a color and a direction. The direction is the
            // open section of the cleave symbol. If the color is orange, you
            // must be out the hitbox. If it's blue, then you must be in the
            // hitbox.

            // display the symbols for each cleave
            if (millis() - mechanicStarted > 0 && millis() - mechanicStarted < 2000) { // cleave #1
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
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveOneSafeDirection * 90,
                    135 + cleaveOneSafeDirection * 90)
                angleMode(RADIANS)
            }
            if (millis() - mechanicStarted > 2500 && millis() - mechanicStarted < 4500) { // cleave #2
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
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveTwoSafeDirection * 90,
                    135 + cleaveTwoSafeDirection * 90)
                angleMode(RADIANS)
            }
            if (millis() - mechanicStarted > 5000 && millis() - mechanicStarted < 7000) { // cleave #2
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
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveThreeSafeDirection * 90,
                    135 + cleaveThreeSafeDirection * 90)
                angleMode(RADIANS)
            }
            break
        case "Fleeting Lai-Giri":
            // display stacks and spreads (at correct time).
            // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140
            // the debuffs only appear at 10000. The first debuff resolves at
            // 32500 millis and the second resolves at 40000 millis.
            if ((10000 < millis() - mechanicStarted) && (millis() - mechanicStarted < 40000)) {
                let xPosStackDisplay = (stackFirst) ? 105 : 140
                let xPosSpreadDisplay = (stackFirst) ? 140 : 105
                fill(0, 80, 50)
                // display stack and spread rectangles
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
                fill(300, 100, 30) // purple-ish color for shadow cleave
                angleMode(DEGREES)
                arc(bossPosX, bossPosY - 40, 30, 30, 225 + cleaveOneSafeDirection * 90, 135 + cleaveOneSafeDirection * 90)
                angleMode(RADIANS)
            }
            break
        case "Analysis":
            // display your rotation number debuff
            fill(180, 100, 30)
            rect(120, 60, 40, 40)
            stroke(0, 0, 70)
            strokeWeight(2)
            // III: display top/bottom lines, then 3 lines in the middle
            if (yourDebuffNumber === 3) {
                line(130, 65, 150, 65)
                line(130, 80, 150, 80)
                line(133, 65, 133, 80)
                line(140, 65, 140, 80)
                line(147, 65, 147, 80)
            } else {
                // V: display top/bottom lines, then a V shape in the imddle
                line(132, 65, 148, 65)
                line(132, 80, 148, 80)
                line(135, 65, 140, 80)
                line(145, 65, 140, 80)
            }

            // display the boss's one
            fill(180, 100, 30)
            noStroke()
            rect(340, 310, 40, 40)
            stroke(0, 0, 70)
            strokeWeight(2)
            // III: display top/bottom lines, then 3 lines in the middle
            if (bossBuffNumber === 3) {
                line(350, 315, 370, 315)
                line(350, 330, 370, 330)
                line(353, 315, 353, 330)
                line(360, 315, 360, 330)
                line(367, 315, 367, 330)
            } else {
                // V: display top/bottom lines, then a V shape in the middle
                line(352, 315, 368, 315)
                line(352, 330, 368, 330)
                line(355, 315, 360, 330)
                line(365, 315, 360, 330)
            }

            // display debuff direction over a very-dark brown background
            fill(20, 100, 20)
            noStroke()
            rect(60, 60, 40, 40)

            // display arcs for each direction
            fill(20, 100, 40) // up
            if (230 < debuffDirection.angle % 360 && debuffDirection.angle % 360 < 310) {
                fill(180, 100, 90)
            }
            angleMode(DEGREES)
            arc(80, 78, 28, 28, 225, 315)

            fill(20, 100, 40) // right
            if ((320 < debuffDirection.angle % 360 && debuffDirection.angle % 360 < 360) ||
                (0 <= debuffDirection.angle % 360 && debuffDirection.angle % 360 < 40)) {
                fill(180, 100, 90)
            }
            arc(82, 80, 28, 28, -45, 45)

            fill(20, 100, 40) // down
            if (50 < debuffDirection.angle % 360 && debuffDirection.angle % 360 < 130) {
                fill(180, 100, 90)
            }
            arc(80, 82, 28, 28, 45, 135)

            fill(20, 100, 40) // left
            if (140 < debuffDirection.angle % 360 && debuffDirection.angle % 360 < 220) {
                fill(180, 100, 90)
            }
            arc(78, 80, 28, 28, 135, 225)
            angleMode(RADIANS)

            // now since we drew filled arcs, draw a circle in the middle
            fill(20, 100, 20)
            circle(80, 80, 15)

            // note: we drew filled arcs so that it wouldn't have rounded edges
            break
    }

    // to the right of the buttons is a microscope displaying your facing
    // add microscope "handle"
    fill(20, 100, 30)
    noStroke()
    rect(350, 190, 50, 20) // wood handle
    // then just add a few steel dots
    fill(240, 8, 40)
    rect(350, 190, 10, 20)
    circle(370, 200, 10)
    circle(390, 200, 10)

    // then the microscope glass
    stroke(70, 50, 50)
    strokeWeight(2)
    noFill()
    circle(300, 200, 100)
    image(rdmSymbol, 280, 180, 40, 40)

    push()
    // display your facing
    translate(300, 200)
    yourFacing.rotateToDirection()
    fill(45, 100, 100)
    triangle(25, -10, 25, 10, 45, 0)
    pop()

    // if your mouse is in the microscope, highlight your facing if your self in
    // the microscope would turn to the mouse
    if (sqrt((mouseX - 300) ** 2 + (mouseY - 200) ** 2) < 50) {
        angleMode(DEGREES)
        push()
        translate(300, 200)
        rotate(-atan2(mouseX - 300, mouseY - 200) + 90)
        fill(45, 100, 100, 50)
        triangle(25, -10, 25, 10, 45, 0)
        pop()
        angleMode(RADIANS)
    }

    let inEdgeOfArenaThisFrame = false

    // for Gorai (exoflares, fighting spirits, malformed reincarnation), the
    // board is 560x560, so the death wall is 20 pixels on each side
    if (mechanic === "Exoflares" || mechanic === "Fighting Spirits" || mechanic === "Malformed Reincarnation") {
        if (posX > 980 ||
            posX < 420 ||
            posY > 580 ||
            posY < 20)
            inEdgeOfArenaThisFrame = true
    }

    // for Moko (triple kasumi-giri, fleeting lai-giri, azure auspice), the
    // boar is visible all 600x600, but there is a death wall with 30 pixels
    // on each side
    if (mechanic === "Triple Kasumi-Giri" || mechanic === "Fleeting Lai-Giri" || mechanic === "Azure Auspice") { // Moko
        if (posX > 970 ||
            posX < 430 ||
            posY > 570 ||
            posY < 30)
            inEdgeOfArenaThisFrame = true
    }

    // for Lala (analysis), the board is 560x560, so again the deal wall is
    // 20 pixels on each side
    if (mechanic === "Analysis") {
        if (posX > 980 ||
            posX < 420 ||
            posY > 580 ||
            posY < 20)
            inEdgeOfArenaThisFrame = true
    }

    // for M2S (Honey B. Lovely Alarm Pheremones ), the board is a circle with a
    // radius of 280, so the death wall is a donut with a donut hole radius
    // of 280.
    if (mechanic === "Alarm Pheremones") {
        if (sqrt((posX - 700)**2 + (posY - 300)**2) > 280)
            inEdgeOfArenaThisFrame = true
    }


    // based on whether you're in the edge this frame, toggle inEdgeOfArena
    // and display the appropriate log window message (without spamming)
    if (!inEdgeOfArena && inEdgeOfArenaThisFrame) {
        partyWiped = true
        causeOfWipe = "You entered the edge of the arena."
        inEdgeOfArena = true
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        logWindowRow1 = {"text": "You are in the edge of the arena.", "color": [0, 80, 80]}
    }
    if (inEdgeOfArena && !inEdgeOfArenaThisFrame) {
        inEdgeOfArena = false
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        logWindowRow1 = {"text": "You left the edge of the arena.", "color": [144, 80, 80]}
    }

    if (partyWiped === true) {
        fill(0, 100, 100)
        noStroke()
        textAlign(RIGHT, BOTTOM)
        text(causeOfWipe, width, height)
        textAlign(LEFT, BASELINE)
    }

    // display a mini log window displaying recent messages
    // each row is interpreted as {"text": "some string", "color": [h, s, b]}
    fill(0, 0, 0, 10)
    noStroke()
    rect(5, height - 155, 390, 150, 5)
    fill(0, 0, 0, 20)
    noStroke()
    rect(10, height - 150, 380, 140, 5)
    fill(0, 0, 0, 30)
    noStroke()
    rect(15, height - 145, 370, 130, 5)
    fill(0, 0, 0, 40)
    noStroke()
    rect(20, height - 140, 360, 120, 5)
    fill(0, 0, 100)
    textSize(14)
    if (logWindowRow6) {
        fill(logWindowRow6["color"][0], logWindowRow6["color"][1], logWindowRow6["color"][2])
        text(logWindowRow6["text"], 25, height - 125)
    } if (logWindowRow5) {
        fill(logWindowRow5["color"][0], logWindowRow5["color"][1], logWindowRow5["color"][2])
        text(logWindowRow5["text"], 25, height - 105)
    } if (logWindowRow4) {
        fill(logWindowRow4["color"][0], logWindowRow4["color"][1], logWindowRow4["color"][2])
        text(logWindowRow4["text"], 25, height - 85)
    } if (logWindowRow3) {
        fill(logWindowRow3["color"][0], logWindowRow3["color"][1], logWindowRow3["color"][2])
        text(logWindowRow3["text"], 25, height - 65)
    } if (logWindowRow2) {
        fill(logWindowRow2["color"][0], logWindowRow2["color"][1], logWindowRow2["color"][2])
        text(logWindowRow2["text"], 25, height - 45)
    } if (logWindowRow1) {
        fill(logWindowRow1["color"][0], logWindowRow1["color"][1], logWindowRow1["color"][2])
        text(logWindowRow1["text"], 25, height - 25)
    }

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()

    // if (frameCount > 3000) noLoop()
}

function mousePressed() {
    if (mouseX > width - 205 && mouseX < width &&
        mouseY > height - 100 && mouseY < height - 70) {
        helper = true
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        logWindowRow1 = {"text": "Helper enabled.", "color": [144, 80, 80]}
    }
    if (mouseX > padding && mouseX < counterClockwiseWidth + 5 &&
        mouseY > counterClockwiseYPos && mouseY < counterClockwiseYPos + heightForNoTextDescent) {
        boardRotationDegrees.target += 90.00000000
    } if (mouseX > padding && mouseX < clockwiseWidth + 5 &&
        mouseY > clockwiseYPos && mouseY < clockwiseYPos + heightForNoTextDescent) {
        boardRotationDegrees.target += 270.0000000
    }
    if (mouseX > padding && mouseX < exaflareWidth + 5 &&
        mouseY > exaflareYPos && mouseY < exaflareYPos + heightForNoTextDescent) {
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        // log message for reloading mechanic
        if (mechanic === "Exoflares") logWindowRow1 = {"text": "Reloading exoflares...", "color": [0, 0, 100]}
        // log message for switching mechanics
        else logWindowRow1 = {"text": "Switching to exoflares...", "color": [0, 0, 100]}
        doneWithMechanic = false
        mechanic = "Exoflares"
        mechanicStarted = millis()

        // determines whether top-left and bottom-right are safe or top-right
        // and bottom-left are safe.
        swapMovement = random([false, true])

        // are exaflares on N/S or not?
        rotateExaflares = random([false, true])

        // is it stack or spread first?
        stackFirst = random([false, true])

        // determine who gets stack
        whoGetsStack = [0, 0]
        whoGetsStack[0] = random([1, 2, 3, 4])
        whoGetsStack[1] = whoGetsStack[0]
        while (whoGetsStack[0] === whoGetsStack[1]) {
            whoGetsStack[1] = random([1, 2, 3, 4])
        }

        // sort the list at the end so that we don't have complications with
        // defining swap
        whoGetsStack.sort()

        // if the same role gets stack, then we have to swap you and healer
        swap = (whoGetsStack[0] === 1 && whoGetsStack[1] === 2) ||
               (whoGetsStack[0] === 3 && whoGetsStack[1] === 4)
        print(swap)

        exoflares = [
            // Add exoflares on the east and west. They go to the top-left and
            // bottom-right if swapMovement is false, and the top-right and
            // bottom-left if swapMovement is true.
            // Or on north and south if rotateExoflares is true!
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
                new SpreadCircle(1, 250, (stackFirst) ? 13470 : 8470),
                new SpreadCircle(2, 250, (stackFirst) ? 13490 : 8490),
                new SpreadCircle(3, 250, (stackFirst) ? 13510 : 8510),
                new SpreadCircle(4, 250, (stackFirst) ? 13530 : 8530),
                new StackCircle(whoGetsStack[0], 300, (stackFirst) ? 8490 : 13490, 2),
                new StackCircle(whoGetsStack[1], 300, (stackFirst) ? 8510 : 13510, 2),
            ]

        // The boss is off the board and everyone else is at the center
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
    } if (mouseX > padding && mouseX < fightingSpiritsWidth + 5 &&
        mouseY > fightingSpiritsYPos && mouseY < fightingSpiritsYPos
        + heightForTextDescent) { // Has yet to be implemented!
        mechanic = "Fighting Spirits"
        partyWiped = false
    } if (mouseX > padding && mouseX < malformedReincarnationWidth + 5 &&
        mouseY > malformedReincarnationYPos && mouseY < malformedReincarnationYPos
        + heightForNoTextDescent) {
        mechanic = "Malformed Reincarnation"
        mechanicStarted = millis()
        directionOfBlue = random([1, 2, 3, 4])
        // 1 is top, 2 is right, 3 is bottom, 4 is left

        // we can't have people that are next to each other dropping towers
        // behind the same tower color: figure out whether to rotate players

        // figure out which corners are blue
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

        // now add the towers, two for each corner
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
        if (areThereTriples) { // if there are triples...
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

        AoEs = []
    } if (mouseX > padding && mouseX < tripleKasumiGiriWidth + 5 &&
        mouseY > tripleKasumiGiriYPos && mouseY < tripleKasumiGiriYPos
        + heightForTextDescent) {
        doneWithMechanic = false
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        // log message for reloading mechanic
        if (mechanic === "Triple Kasumi-Giri") logWindowRow1 = {"text": "Reloading Triple Kasumi-Giri...", "color": [0, 0, 100]}
        // log message for switching mechanics
        else logWindowRow1 = {"text": "Switching to Triple Kasumi-Giri...", "color": [0, 0, 100]}
        mechanic = "Triple Kasumi-Giri"
        mechanicStarted = millis()

        // the boss starts at the center and you start a little bit below
        // it
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
        bossFacing = 1 // always start oriented north!

        // each cleave has a color and direction. orange means a point-blank
        // AOE and blue means a donut AOE. the direction is the safe direction
        // from the cleave.
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
        partyWiped = false
    } if (mouseX > padding && mouseX < fleetingLaiGiriWidth + 5 &&
        mouseY > fleetingLaiGiriYPos && mouseY < fleetingLaiGiriYPos
        + heightForTextDescent) {
        mechanic = "Fleeting Lai-Giri"
        mechanicStarted = millis()
        jumpResolved = false

        // you, the healer, and the dragoon start behind, and the warrior starts
        // at the top
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

        // which lines expand first?
        topLeftCrossExpandsFirst = random([false, true])
        northLineExpandsFirst = random([false, true])

        // stack or spread first?
        stackFirst = random([false, true])

        whoGetsStack = [ // always given to one of each role
            random([1, 2]), // both DPS
            random([3, 4]), // both supports
        ]

        // what is the safe direction of the cleave?
        cleaveOneSafeDirection = random([1, 2, 3, 4])

        // who is tethered?
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
        partyWiped = false
    } if (mouseX > padding && mouseX < azureAuspiceWidth + 5 &&
        mouseY > azureAuspiceYPos && mouseY < azureAuspiceYPos + heightForTextDescent) {
        doneWithMechanic = false
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        // log message for reloading mechanic
        if (mechanic === "Azure Auspice") logWindowRow1 = {"text": "Reloading Azure Auspice...", "color": [0, 0, 100]}
        // log message for switching mechanics
        else logWindowRow1 = {"text": "Switching to Azure Auspice...", "color": [0, 0, 100]}
        mechanic = "Azure Auspice"
        mechanicStarted = millis()
        // everyone except for you starts off the map
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
        partyWiped = false
    } if (mouseX > padding && mouseX < analysisWidth + 5 &&
        mouseY > analysisYPos && mouseY < analysisYPos + heightForTextDescent) { // Analysis
        doneWithMechanic = false
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        // log message for reloading mechanic
        if (mechanic === "Analysis") logWindowRow1 = {"text": "Reloading Analysis...", "color": [0, 0, 100]}
        // log message for switching mechanics
        else logWindowRow1 = {"text": "Switching to Analysis...", "color": [0, 0, 100]}
        mechanic = "Analysis"
        mechanicStarted = millis()
        // everyone except for you starts off the map
        drgPosX = -100
        sgePosX = -100
        warPosX = -100
        bossPosX = -100

        // sometimes the arrows cover east and west, other times north and south
        rotatePlayers = random([false, true])

        // test persisting rect
        AoEs = (rotatePlayers) ? [ // N&S
            new PersistingRectangleAOE(420, 20, 112, 112, 0, 60000),
            new PersistingRectangleAOE(532, 20, 112, 112, 6100, 60000),
            new PersistingRectangleAOE(644, 20, 112, 112, 7200, 60000),
            new PersistingRectangleAOE(756, 20, 112, 112, 8300, 60000),
            new PersistingRectangleAOE(868, 20, 112, 112, 9400, 60000),
            new PersistingRectangleAOE(868, 132, 112, 112, 10500, 60000),
            new PersistingRectangleAOE(756, 132, 112, 112, 11600, 60000),
            new PersistingRectangleAOE(644, 132, 112, 112, 12700, 60000),
            new PersistingRectangleAOE(532, 132, 112, 112, 13800, 60000),
            new PersistingRectangleAOE(420, 132, 112, 112, 14900, 60000),

            new PersistingRectangleAOE(868, 468, 112, 112, 0, 60000),
            new PersistingRectangleAOE(756, 468, 112, 112, 6100, 60000),
            new PersistingRectangleAOE(644, 468, 112, 112, 7200, 60000),
            new PersistingRectangleAOE(532, 468, 112, 112, 8300, 60000),
            new PersistingRectangleAOE(420, 468, 112, 112, 9400, 60000),
            new PersistingRectangleAOE(420, 356, 112, 112, 10500, 60000),
            new PersistingRectangleAOE(532, 356, 112, 112, 11600, 60000),
            new PersistingRectangleAOE(644, 356, 112, 112, 12700, 60000),
            new PersistingRectangleAOE(756, 356, 112, 112, 13800, 60000),
            new PersistingRectangleAOE(868, 356, 112, 112, 14900, 60000)
        ] : [ // E&W
            new PersistingRectangleAOE(420, 468, 112, 112, 0, 60000),
            new PersistingRectangleAOE(420, 356, 112, 112, 6100, 60000),
            new PersistingRectangleAOE(420, 244, 112, 112, 7200, 60000),
            new PersistingRectangleAOE(420, 132, 112, 112, 8300, 60000),
            new PersistingRectangleAOE(420, 20, 112, 112, 9400, 60000),
            new PersistingRectangleAOE(532, 20, 112, 112, 10500, 60000),
            new PersistingRectangleAOE(532, 132, 112, 112, 11600, 60000),
            new PersistingRectangleAOE(532, 244, 112, 112, 12700, 60000),
            new PersistingRectangleAOE(532, 356, 112, 112, 13800, 60000),
            new PersistingRectangleAOE(532, 468, 112, 112, 14900, 60000),

            new PersistingRectangleAOE(868, 20, 112, 112, 0, 60000),
            new PersistingRectangleAOE(868, 132, 112, 112, 6100, 60000),
            new PersistingRectangleAOE(868, 244, 112, 112, 7200, 60000),
            new PersistingRectangleAOE(868, 356, 112, 112, 8300, 60000),
            new PersistingRectangleAOE(868, 468, 112, 112, 9400, 60000),
            new PersistingRectangleAOE(756, 468, 112, 112, 10500, 60000),
            new PersistingRectangleAOE(756, 356, 112, 112, 11600, 60000),
            new PersistingRectangleAOE(756, 244, 112, 112, 12700, 60000),
            new PersistingRectangleAOE(756, 132, 112, 112, 13800, 60000),
            new PersistingRectangleAOE(756, 20, 112, 112, 14900, 60000)
        ]

        // random debuff direction
        debuffDirection = random(
            [Direction.Up, Direction.Right, Direction.Down, Direction.Left])

        // there are 8 possibilities:
        // 1:
        // →O  ↓
        //     ←
        //
        // →  O
        // ↑   ←
        // 2: same as 1, but with the SE orb 1 square to the right
        // 3: same as 1, except the orb that triggers immediately is on the
        //    opposite side of the board
        // 4: same as 2, except the orb that triggers immediately is on the
        //    opposite side of the board
        // 5: same as 1, but rotated 90º
        // 6: same as 2, but rotated 90º
        // 7: same as 3, but rotated 90º
        // 8: same as 4, but rotated 90º
        // 1, 2, 3, and 4 only trigger with rotatePlayers
        // 5, 6, 7, and 8 only trigger with !rotatePlayers

        if (rotatePlayers) {
            possibility = random([1, 2, 3, 4])
            if (possibility === 1) {
                orbOnePosition = [588, 76]
                orbTwoPosition = [812, 412]
            } if (possibility === 2) {
                orbOnePosition = [588, 76]
                orbTwoPosition = [924, 412]
            } if (possibility === 3) {
                orbOnePosition = [812, 524]
                orbTwoPosition = [588, 188]
            } if (possibility === 4) {
                orbOnePosition = [812, 524]
                orbTwoPosition = [476, 188]
            }
        } else {
            possibility = random([5, 6, 7, 8])
            if (possibility === 5) {
                orbOnePosition = [924, 188]
                orbTwoPosition = [588, 412]
            } if (possibility === 6) {
                orbOnePosition = [924, 188]
                orbTwoPosition = [588, 524]
            } if (possibility === 7) {
                orbOnePosition = [476, 412]
                orbTwoPosition = [812, 188]
            } if (possibility === 8) {
                orbOnePosition = [476, 412]
                orbTwoPosition = [812, 76]
            }
        }

        cleaveOneSafeDirection = random(
            [Direction.Up, Direction.Right, Direction.Down, Direction.Left])

        yourDebuffNumber = random([3, 5])
        bossBuffNumber = random([3, 5])
        yourRotationClockwise = random([true, false])
        bossRotationClockwise = random([true, false])
        yourRotationWentOff = false
        bossRotationWentOff = false
        partyWiped = false

        firstOrbWentOff = false
        secondOrbWentOff = false
        gotHitByFirstOrb = false
        gotHitBySecondOrb = false
        gotHitByTether = false
    } if (mouseX > padding && mouseX < alarmPheremonesWidth + 5 &&
        mouseY > alarmPheremonesYPos && mouseY < alarmPheremonesYPos
        + heightForNoTextDescent) {
        doneWithMechanic = false
        logWindowRow6 = logWindowRow5
        logWindowRow5 = logWindowRow4
        logWindowRow4 = logWindowRow3
        logWindowRow3 = logWindowRow2
        logWindowRow2 = logWindowRow1
        // log message for reloading mechanic
        if (mechanic === "Alarm Pheremones") logWindowRow1 =
            {"text": "Reloading Alarm Pheremones...", "color": [0, 0, 100]}
        // log message for switching mechanics
        else logWindowRow1 = {"text": "Switching to Alarm Pheremones...", "color": [0, 0, 100]}
        partyWiped = false
        mechanic = "Alarm Pheremones"

        // everything except for you and the background starts off the map
        drgPosX = -100000
        drgPosY = -100000
        sgePosX = -100000
        sgePosY = -100000
        warPosX = -100000
        warPosY = -100000
        bossPosX = -100000
        bossPosY = -100000

        AoEs = []

        // then create 16 GroupBees
        let beeAngles = []
        for (let i = 0; i < 16; i++) {
            // the angle is a random of one of 16 angles
            // this helps to prevent overlap
            let angle = random([
                0, PI/8, PI/4, 3*PI/8, PI/2, 5*PI/8, 3*PI/4, 7*PI/8,
                9*PI/8, 5*PI/4, 11*PI/8, 3*PI/2, 13*PI/8, 7*PI/4, 15*PI/8
            ])
            let x = 700 + cos(angle)*290
            let y = 300 + sin(angle)*290

            // the angle is invalid if it is a twenty-eth of the
            // revolution away from another bee
            let angleValid = true
            for (let beeAngle of beeAngles) {
                if (abs(angle - beeAngle) < TWO_PI/20) {
                    angleValid = false
                }
            }

            // if the angle isn't initially valid, keep selecting angles
            // until it is valid
            while (!angleValid) {
                let angle = random([
                    0, PI/8, PI/4, 3*PI/8, PI/2, 5*PI/8, 3*PI/4, 7*PI/8,
                    9*PI/8, 5*PI/4, 11*PI/8, 3*PI/2, 13*PI/8, 7*PI/4, 15*PI/8
                ])
                x = 700 + cos(angle)*290
                y = 300 + sin(angle)*290
                angleValid = true
                for (let beeAngle of beeAngles) {
                    if (abs(angle - beeAngle) < TWO_PI/20) {
                        angleValid = false
                    }
                }
            }

            beeAngles.push(angle)

            AoEs.push(new GroupBee(x, y, angle, i*1000 + 1000))
        }

    } if (sqrt((mouseX - 300)**2 + (mouseY - 200)**2) < 50) {
        // click on the microscope to make you turn to the microscope
        angleMode(DEGREES)
        yourFacing = new Direction(-atan2(mouseX - 300, mouseY - 200) + 90)
        angleMode(RADIANS)
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