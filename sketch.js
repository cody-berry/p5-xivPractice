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
let exoflareHelper
let AoEs

let soakTowers

let swapMovement // whether the top-right or top-left is originally safe, basically
let stackFirst // do we stack first or spread first?
let whoGetsStack // who got "stack"?
let swap // only used for sage: did both DPS or both supports get it?
let rotateExaflares // the exaflares could be on the north and south or on the east and west

let lastHitBy // Keeps track of what and when each character suffered an AoE

let mechanic // keeps track of what mechanic we're practicing
let mechanicStarted


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

    exoflareHelper = false
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
    if (!exoflareHelper) {
        fill(0, 0, 25)
        if (mouseX > 0 && mouseX < 230 &&
            mouseY > height - 30 && mouseY < height) fill(0, 0, 20)
        noStroke()
        rect(0, height - 30, 230, 30)
        fill(0, 0, 100)
        text("Enable helper", 5, height - 3)
    }

    // add mechanic buttons
    stroke(0, 0, 0)
    fill(0, 0, 25)
    strokeWeight(1)
    if (mouseX > 0 && mouseX < 135 &&
        mouseY > 400 && mouseY < 430) {
        fill(0, 0, 20)
    }
    rect(0, 400, 135, 30)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 125 &&
        mouseY > 430 && mouseY < 490) {
        fill(0, 0, 20)
    }
    rect(0, 430, 135, 60)
    fill(0, 0, 25)
    if (mouseX > 0 && mouseX < 205 &&
        mouseY > 490 && mouseY < 550) {
        fill(0, 0, 20)
    }
    rect(0, 490, 205, 60)

    fill(0, 0, 100)
    text("Exoflares", 0, 427)
    text("Fighting", 0, 457)
    text("Spirits", 0, 487)
    text("Malformed", 0, 517)
    text("Reincarnation", 0, 547)


    // display a wooden chess board, basically
    // #(with red or wood stuff on outside and a purple entrance on at the bottom)
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
                rect(421 + xIncrements*70, 21 + yIncrements*70, 68, 68)
            }
        }
        stroke(0, 0, 0)
        strokeWeight(1)
        line(420 + xIncrements*70, 20, 420 + xIncrements*70, 580) // x line
        line(420, 20 + xIncrements*70, 980, 20 + xIncrements*70) // y line
        noStroke()
    }
    stroke(0, 0, 0)
    strokeWeight(1)
    line(980, 20, 980, 580) // total bottom x line
    line(420, 580, 980, 580) // total right y line

    // red dot at the top for boss
    strokeWeight(30)
    stroke(0, 100, 100)
    point(bossPosX, bossPosY)

    // display you and your party members in your and their respective position
    // after checking for moving
    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) posX -= 1.3 // A or ← = left
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) posY -= 1.3 // W or ↑ = up
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) posX += 1.3 // D or → = right
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) posY += 1.3 // S or ↓ = down
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

    if (mechanic === "Exoflares") {
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

        // display the ready check
        // if (!engaged) {
        //     text("READY CHECK", 10, 300)
        //     // button for "I'm ready!"
        //     fill(120, 50, 50)
        //     if (mouseX > 10 && mouseX < 180 &&
        //         mouseY > 320 && mouseY < 350) fill(120, 50, 40)
        //     rect(10, 320, 180, 30)
        //     fill(0, 0, 100)
        //     text("I'm ready!", 15, 345)
        //     // if you drew aggro, the party wipes!
        //     if (sqrt((posX - bossPosX)**2 + (posY - bossPosY)**2) < 230) {
        //         partyWiped = true
        //         causeOfWipe = "You drew aggro to the\nboss prematurely."
        //         engaged = true
        //     }
        // }

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
    } if (mechanic === "Malformed Reincarnation") {
        for (let soakTower of soakTowers) {
            soakTower.update()
            soakTower.displayTower()
        }
    }


    // display the donut of not being able to see anything
    noStroke()
    let size = (exoflareHelper) ? 320 : 200
    for (let opacity = 0; opacity < 18; opacity += 0.5) {
        fill(0, 0, 0, opacity)
        displayDonut(posX, posY, size)
        size += (exoflareHelper) ? opacity / 2 : opacity / 3
    }

    if (posX < 432 || posY < 32 ||
        posX > 978 || posY > 578) {
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
        exoflareHelper = true
    }

    if (mouseX > 0 && mouseX < 135 &&
        mouseY > 400 && mouseY < 430) {
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
    if (mouseX > 0 && mouseX < 125 &&
        mouseY > 430 && mouseY < 490) {
        mechanic = "Fighting Spirits"
        partyWiped = false
    }
    if (mouseX > 0 && mouseX < 205 &&
        mouseY > 490 && mouseY < 550) {
        mechanic = "Malformed Reincarnation"
        mechanicStarted = millis()
        posX = 450
        posY = 50
        soakTowers = [
            new SoakTower([15, 100, 100], 450, 50, 100, 1000),
            new SoakTower([270, 100, 100], 700, 50, 100, 4000),
            new SoakTower([240, 100, 100], 950, 50, 100, 7000),
            new SoakTower([240, 100, 100], 950, 300, 100, 10000),
            new SoakTower([270, 100, 100], 700, 300, 100, 13000),
            new SoakTower([15, 100, 100], 450, 300, 100, 16000),
            new SoakTower([15, 100, 100], 450, 450, 100, 19000),
            new SoakTower([270, 100, 100], 700, 450, 100, 22000),
            new SoakTower([240, 100, 100], 950, 450, 100, 25000),
        ]
        partyWiped = false
    }
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