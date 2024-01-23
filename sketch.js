/**
 *  @author Cody
 *  @date 2024.01.09
 *
 */

let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

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

function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')

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
        // Or on north and south!
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
        new SpreadCircle(1, 300, (stackFirst) ? 13470 : 8470),
        new SpreadCircle(2, 300, (stackFirst) ? 13490 : 8490),
        new SpreadCircle(3, 300, (stackFirst) ? 13510 : 8510),
        new SpreadCircle(4, 300, (stackFirst) ? 13530 : 8530),
        new StackCircle(whoGetsStack[0], 300, (stackFirst) ? 8490 : 13490, 2),
        new StackCircle(whoGetsStack[1], 300, (stackFirst) ? 8510 : 13510, 2),
    ]
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
    if (mouseX > 0 && mouseX < 90 &&
        mouseY > 390 && mouseY < 410) fill(0, 0, 15)
    rect(-10, 390, 100, 20)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 148 &&
        mouseY > 410 && mouseY < 434) fill(0, 0, 15)
    rect(-10, 410, 158, 24)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 245 &&
        mouseY > 434 && mouseY < 454) fill(0, 0, 15)
    rect(-10, 434, 255, 20)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 175 &&
        mouseY > 454 && mouseY < 478) fill(0, 0, 15)
    rect(-10, 454, 185, 24)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 155 &&
        mouseY > 478 && mouseY < 502) fill(0, 0, 15)
    rect(-10, 478, 165, 24)
    fill(0, 0, 25)

    fill(0, 0, 100)
    noStroke()
    textSize(20)
    text("Exoflares", 0, 408)
    text("Fighting Spirits", 0, 428)
    text("Malformed Reincarnation", 0, 452)
    text("Triple Kasumi-Giri", 0, 472)
    text("Fleeting Lai-Giri", 0, 496)

    stroke(0, 0, 0)


    // display a wooden chess board, basically
    // (with red, green, or wood stuff on outside and a purple entrance on at the bottom)
    if (mechanic === "Exoflares" || mechanic === "Fighting Spirits" || mechanic === "Malformed Reincarnation") { // Gorai
        fill(0, 80, 75)
        rect(400, 0, 600, 600)
        stroke(300, 50, 50)
        line(650, 600, 750, 600)
        fill(20, 50, 40)
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
    } if (mechanic === "Triple Kasumi-Giri" || mechanic === "Fleeting Lai-Giri") { // Moko
        // start with the background
        let rowHeight = 600/19
        let columnWidth = 30
        fill(0, 0, 50)
        rect(400, 0, 600, 600)
        stroke(0, 0, 0)
        for (let yIncrements = 1; yIncrements < 20; yIncrements++) {
            if ([1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18].includes(yIncrements)) {
                line(400, rowHeight*yIncrements, 1000, rowHeight*yIncrements) // straight line across
            } else { // many fragmented lines across
                line(400 + columnWidth, rowHeight * yIncrements, 400 + columnWidth * 3, rowHeight * yIncrements)
                line(400 + columnWidth * 5, rowHeight * yIncrements, 400 + columnWidth * 7, rowHeight * yIncrements)
                line(400 + columnWidth * 9, rowHeight * yIncrements, 400 + columnWidth * 11, rowHeight * yIncrements)
                line(400 + columnWidth * 13, rowHeight * yIncrements, 400 + columnWidth * 15, rowHeight * yIncrements)
                line(400 + columnWidth * 17, rowHeight * yIncrements, 400 + columnWidth * 19, rowHeight * yIncrements)
            }
            if ([1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17].includes(yIncrements)) { // display vertical connectors
                line(400 + columnWidth, rowHeight * yIncrements, 400 + columnWidth, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 3, rowHeight * yIncrements, 400 + columnWidth * 3, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 4, rowHeight * yIncrements, 400 + columnWidth * 4, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 5, rowHeight * yIncrements, 400 + columnWidth * 5, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 7, rowHeight * yIncrements, 400 + columnWidth * 7, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 8, rowHeight * yIncrements, 400 + columnWidth * 8, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 9, rowHeight * yIncrements, 400 + columnWidth * 9, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 11, rowHeight * yIncrements, 400 + columnWidth * 11, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 12, rowHeight * yIncrements, 400 + columnWidth * 12, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 13, rowHeight * yIncrements, 400 + columnWidth * 13, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 15, rowHeight * yIncrements, 400 + columnWidth * 15, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 16, rowHeight * yIncrements, 400 + columnWidth * 16, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 17, rowHeight * yIncrements, 400 + columnWidth * 17, rowHeight * (yIncrements + 1))
                line(400 + columnWidth * 19, rowHeight * yIncrements, 400 + columnWidth * 19, rowHeight * (yIncrements + 1))
            }
        }

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

    // red dot at the top for boss
    strokeWeight(30)
    stroke(0, 100, 100)
    point(bossPosX, bossPosY)

    // display you and your party members in your and their respective position
    // after checking for moving
    let directions = []
    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) directions.push(1) // A or ← = left/1
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) directions.push(2) // W or ↑ = up/2
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) directions.push(3) // D or → = right/3
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) directions.push(4) // S or ↓ = down/4
    switch (directions.length) {
        case 1: // move the full 1.3
            if (directions[0] === 1) posX -= 1.3
            if (directions[0] === 2) posY -= 1.3
            if (directions[0] === 3) posX += 1.3
            if (directions[0] === 4) posY += 1.3
            break
        case 2: // move 0.92 both directions. They still cancel out each other if they're opposite
            if (directions[0] === 1) posX -= 0.92
            if (directions[0] === 2) posY -= 0.92
            if (directions[0] === 3) posX += 0.92
            if (directions[0] === 4) posY += 0.92
            if (directions[1] === 1) posX -= 0.92
            if (directions[1] === 2) posY -= 0.92
            if (directions[1] === 3) posX += 0.92
            if (directions[1] === 4) posY += 0.92
            break
        case 3: // move the full 1.3 each direction. Virtually moving 1 of the directions, as 2 are guaranteed to cancel out.
            if (directions[0] === 1) posX -= 1.3
            if (directions[0] === 2) posY -= 1.3
            if (directions[0] === 3) posX += 1.3
            if (directions[0] === 4) posY += 1.3
            if (directions[1] === 1) posX -= 1.3
            if (directions[1] === 2) posY -= 1.3
            if (directions[1] === 3) posX += 1.3
            if (directions[1] === 4) posY += 1.3
            if (directions[2] === 1) posX -= 1.3
            if (directions[2] === 2) posY -= 1.3
            if (directions[2] === 3) posX += 1.3
            if (directions[2] === 4) posY += 1.3
            break
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

    switch (mechanic) {
        case "Exoflares":
            // update so that people can dodge exoflares!
            if (millis() > mechanicStarted + 3500 && millis() < mechanicStarted + 5100) {
                sgePosY -= (swap) ? -1.35 : 1.35
                sgePosX -= (swapMovement ^ swap) ? -1.25 : 1.25
            }
            if (millis() > mechanicStarted + 5100 && millis() < mechanicStarted + 5500 && !stackFirst) {
                sgePosY -= (swap) ? -1.35 : 1.35
                sgePosX -= (swapMovement ^ swap) ? -1.25 : 1.25
            }
            if (millis() > mechanicStarted + 5500 && millis() < mechanicStarted + 6800 && !stackFirst) {
                if (rotateExaflares) {
                    sgePosY -= (swap) ? -1.3 : 1.3
                } else {
                    sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                }
            }
            if (millis() > mechanicStarted + 4900 && millis() < mechanicStarted + 6500) {
                warPosY -= 1.3
                warPosX -= (swapMovement) ? -1.3 : 1.3
                drgPosY += 1.3
                drgPosX += (swapMovement) ? -1.3 : 1.3
            }
            if (millis() > mechanicStarted + 7500 && millis() < mechanicStarted + 8500 && !stackFirst) {
                if (rotateExaflares) {
                    sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                } else {
                    sgePosY -= (swap) ? -1.3 : 1.3
                }
            }
            if (millis() > mechanicStarted + 8500 && millis() < mechanicStarted + 9800 && stackFirst) {
                sgePosX -= (swapMovement ^ swap) ? -1.3 : 1.3
                sgePosY -= (swap) ? -1.3 : 1.3
            }
            if (millis() > mechanicStarted + 8500 && millis() < mechanicStarted + 10000) {
                warPosY -= 1.3
                warPosX -= (swapMovement) ? -1.3 : 1.3
                drgPosY += 1.3
                drgPosX += (swapMovement) ? -1.3 : 1.3
            }
            if (millis() > mechanicStarted + 10000 && millis() < mechanicStarted + 13500 && stackFirst) {
                if (!rotateExaflares) {
                    warPosX += (swapMovement) ? -1.3 : 1.3
                    drgPosX -= (swapMovement) ? -1.3 : 1.3
                } else {
                    warPosY += 1.3
                    drgPosY -= 1.3
                }
            }

            strokeWeight(3)

            // display stacks and spreads (at correct time).
            // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140.
            let xPosStack = (stackFirst) ? 105 : 140
            let xPosSpread = (stackFirst) ? 140 : 105
            if (millis() < mechanicStarted + 13500) {
                fill(0, 80, 50)
                if (!stackFirst || millis() < mechanicStarted + 8500) {
                    rect(xPosStack - 15, 20 + whoGetsStack[0] * 50, 30, 30)
                    rect(xPosStack - 15, 20 + whoGetsStack[1] * 50, 30, 30)
                }
                if (stackFirst || millis() < mechanicStarted + 8500) {
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

                // display a circle for spread
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

            for (let exoflare of exoflares) {
                exoflare.update()
                exoflare.displayAoE()
            }

            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }

            strokeWeight(1)
            stroke(0, 0, 0)


            // make it so that you can't see the corner exaflare stidcking out
            fill(234, 34, 24)
            noStroke()
            rect(350, 0, 50, height)
            break
        case "Malformed Reincarnation":
            for (let soakTower of blueSoakTowers) {
                soakTower.update()
                soakTower.displayTower()
            }
            for (let soakTower of orangeSoakTowers) {
                soakTower.update()
                soakTower.displayTower()
            }

            // display the rodential and odder debuffs
            for (let player of [1, 2, 3, 4]) {
                let yPos = 45 + player*50
                if (triplesGivenTo.includes(player)) {
                    if (majorityRed.includes(player)) { // drop blue, soak red-red-red
                        stroke(240, 100, 100)
                        noFill()
                        strokeWeight(2)
                        if (millis() - mechanicStarted < 10000) {
                            circle(70, yPos - 15, 20) // drop blue
                        } else {
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
                                print(playerPosX, playerPosY, player)
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
                                print(playerPosX, playerPosY, player)
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
                                print(playerPosX, playerPosY, player)
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
                                print(playerPosX, playerPosY, player)
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
                }
            } if (millis() - mechanicStarted > 0 && millis() - mechanicStarted < 4000 && rotatePlayers) {
                if (triplesGivenTo.includes(2)) { // 2 is the dragoon
                    drgPosY += 0.92
                    drgPosX += 0.92
                } else {
                    drgPosY -= 0.86
                    drgPosX -= 0.92
                }
            } if (millis() - mechanicStarted > 5500 && millis() - mechanicStarted < 6500) {
                // now we want to drop our tower
                if (rotatePlayers) {
                    drgPosY += (directionOfBlue === 3 ^ majorityRed) ? -1.3 : 1.3
                } else {
                    drgPosX += (directionOfBlue === 2 ^ majorityRed) ? -1.3 : 1.3
                }
            }
            // now we need to soak our towers
            // start with the first
            if (millis() - mechanicStarted > 10000 && millis() - mechanicStarted < 13000) {
                if (rotatePlayers) {
                    drgPosY -= (directionOfBlue === 3 ^ majorityRed) ? -0.92 : 0.92
                    drgPosX += (directionOfBlue === 2 ^ majorityRed) ? -0.5 : 0.5
                } else {
                    drgPosX -= (directionOfBlue === 2 ^ majorityRed) ? -1 : 1
                    drgPosY -= (directionOfBlue === 3 ^ majorityRed) ? -0.5 : 0.5
                }
            } if (millis() - mechanicStarted > 14600 && millis() - mechanicStarted < 16000) {
                if (rotatePlayers) {
                    drgPosY -= (directionOfBlue === 3 ^ majorityRed) ? -0.92 : 0.92
                    drgPosX -= (directionOfBlue === 2 ^ majorityRed) ? -0.92 : 0.92
                } else {
                    drgPosX -= (directionOfBlue === 2 ^ majorityRed) ? -0.92 : 0.92
                    drgPosY += (directionOfBlue === 3 ^ majorityRed) ? -0.92 : 0.92
                }
            } if (millis() - mechanicStarted > 16000 && millis() - mechanicStarted < 17000) {
                if (rotatePlayers) {
                    drgPosY += (directionOfBlue === 3 ^ majorityRed) ? -1.3 : 1.3
                } else {
                    drgPosX += (directionOfBlue === 2 ^ majorityRed) ? -1.3 : 1.3
                }
            }
            break
        case "Triple Kasumi-Giri":
            // add ring that represents facing
            stroke(0, 0, 100)
            strokeWeight(1)
            noFill()
            circle(bossPosX, bossPosY, 160) // note: this is 320 diameter, not 320 radius
            fill(0, 0, 100)
            noStroke()
            if (bossFacing === 1) { // up
                triangle(bossPosX - 10, bossPosY - 80, bossPosX + 10, bossPosY - 80, bossPosX, bossPosY - 96)
            } if (bossFacing === 2) { // right
                triangle(bossPosX + 80, bossPosY - 10, bossPosX + 80, bossPosY + 10, bossPosX + 96, bossPosY)
            } if (bossFacing === 3) { // down
                triangle(bossPosX - 10, bossPosY + 80, bossPosX + 10, bossPosY + 80, bossPosX, bossPosY + 96)
            } if (bossFacing === 4) { // left
                triangle(bossPosX - 80, bossPosY - 10, bossPosX - 80, bossPosY + 10, bossPosX - 96, bossPosY)
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
                // display an arc with the cleaveOneSafeDirection not included (this is filled as a pie segment)
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveOneSafeDirection*90, 135 + cleaveOneSafeDirection*90)
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
                // display an arc with the cleaveTwoSafeDirection not included (this is filled as a pie segment)
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveTwoSafeDirection*90, 135 + cleaveTwoSafeDirection*90)
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
                // display an arc with the cleaveThreeSafeDirection not included (this is filled as a pie segment)
                arc(bossPosX, bossPosY - 30, 25, 25, 225 + cleaveThreeSafeDirection*90, 135 + cleaveThreeSafeDirection*90)
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
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848, 225 + cleaveOneSafeDirection*90 - 90 + bossFacing*90, 135 + cleaveOneSafeDirection*90 - 90 + bossFacing*90, 0)
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
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848, 225 + cleaveTwoSafeDirection*90 - 90 + bossFacing*90, 135 + cleaveTwoSafeDirection*90 - 90 + bossFacing*90, 0)
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
                AoEs.push(
                    new ConeAOE(bossPosX, bossPosY, 848, 225 + cleaveThreeSafeDirection*90 - 90 + bossFacing*90, 135 + cleaveThreeSafeDirection*90 - 90 + bossFacing*90, 0)
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
            if (millis() - mechanicStarted > 2000 && !circleResolved) {
                circleResolved = true
                AoEs.push(
                    new CircleAOE(bossPosX, bossPosY, 160, 0)
                )
                AoEs[AoEs.length - 1].opacity = 5
                AoEs.push(
                    new LineAOE(400, 170, 1000, 170, 130, 4000),
                    new LineAOE(400, 430, 1000, 430, 130, 4000),
                    new LineAOE(400, 0, 1000, 600, 130, 4000),
                    new LineAOE(400, 600, 1000, 0, 130, 4000)
                )
            }

            // display stacks and spreads (at correct time).
            // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140
            if ((10000 < millis() - mechanicStarted) && (millis() - mechanicStarted < 40000)) {
                if (frameCount % 2 === 0) {
                    print((10000 < millis() - mechanicStarted) || (millis() - mechanicStarted < 40000))
                }
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


            for (let AoE of AoEs) {
                AoE.update()
                AoE.displayAoE()
            }

            fill(234, 34, 24)
            noStroke()
            rect(300, 0, 100, height)
    }

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
        text(causeOfWipe, 10, 300)
    }
    print(engagedAt)

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
        swap = (whoGetsStack[0] === 1 && whoGetsStack[1] === 2) || (whoGetsStack[0] === 3 && whoGetsStack[1] === 4)
        print(swap)
        exoflares = [
            // Add exoflares on the east and west. They go to the top-left and
            // bottom-right if swapMovement is false, and the top-right and
            // bottom-left if swapMovement is true.
            // Or on north and south!
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
            triplesGivenTo = [0, 0]
            triplesGivenTo[0] = random([1, 2, 3, 4])
            triplesGivenTo[1] = triplesGivenTo[0]
            while (triplesGivenTo[0] === triplesGivenTo[1]) {
                triplesGivenTo[1] = random([1, 2, 3, 4])
            }
            triplesNotGivenTo = []
            for (let player of [1, 2, 3, 4]) {
                if (!triplesGivenTo.includes(player)) {
                    triplesNotGivenTo.push(player)
                }
            }
            majorityRed = [
                random([triplesGivenTo[0], triplesGivenTo[1]]), // 1 triple and 1 standard are majority red
                random([triplesNotGivenTo[0], triplesNotGivenTo[1]])
            ]
        } else {
            triplesGivenTo = []
            triplesNotGivenTo = [1, 2, 3, 4]
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
        bossFacing = 1 // 1 top, 2 right, 3 bottom, 4 left

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

        AoEs = [
            new FlameLine(400, 175, 1000, 175, [
                (northLineExpandsFirst) ? 6000 : 6000,
                (northLineExpandsFirst) ? 10000 : 17500,
                (northLineExpandsFirst) ? 17500 : 25000,
                (northLineExpandsFirst) ? 25000 : 32500,
                (northLineExpandsFirst) ? 32500 : 40000
            ]),
            new FlameLine(400, 425, 1000, 425, [
                (northLineExpandsFirst) ? 6000 : 6000,
                (northLineExpandsFirst) ? 17500 : 10000,
                (northLineExpandsFirst) ? 25000 : 17500,
                (northLineExpandsFirst) ? 32500 : 25000,
                (northLineExpandsFirst) ? 40000 : 32500
            ]),
            new FlameLine(400, 0, 1000, 600, [
                (topLeftCrossExpandsFirst) ? 6000 : 6000,
                (topLeftCrossExpandsFirst) ? 10000 : 17500,
                (topLeftCrossExpandsFirst) ? 17500 : 25000,
                (topLeftCrossExpandsFirst) ? 25000 : 32500,
                (topLeftCrossExpandsFirst) ? 32500 : 40000
            ]),
            new FlameLine(400, 600, 1000, 0, [
                (topLeftCrossExpandsFirst) ? 6000 : 6000,
                (topLeftCrossExpandsFirst) ? 17500 : 10000,
                (topLeftCrossExpandsFirst) ? 25000 : 17500,
                (topLeftCrossExpandsFirst) ? 32500 : 25000,
                (topLeftCrossExpandsFirst) ? 40000 : 32500
            ]),
            new SpreadCircle(1, 50, (stackFirst) ? 40500 : 33000),
            new SpreadCircle(2, 50, (stackFirst) ? 40500 : 33000),
            new SpreadCircle(3, 50, (stackFirst) ? 40500 : 33000),
            new SpreadCircle(4, 50, (stackFirst) ? 40500 : 33000),
            new StackCircle(whoGetsStack[1], 50, (stackFirst) ? 33000 : 40500),
            new StackCircle(whoGetsStack[2], 50, (stackFirst) ? 33000 : 40500),
        ]

        AoEs.sort(sortByGrowingTime)
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