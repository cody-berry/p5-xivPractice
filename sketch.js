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

let swapMovement // whether the top-right or top-left is originally safe, basically
let stackFirst // do we stack first or spread first?
let whoGetsStack // who got "stack"?
let swap // only used for sage: did both DPS or both supports get it?

let lastHitBy // Keeps track of what and when each character suffered an AoE


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

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    // assign now so that we can position exoflares properly
    swapMovement = random([false, true])
    exoflares = [
        // Add exoflares on the east and west. They go to the top-left and
        // bottom-right if swapMovement is false, and the top-right and
        // bottom-left if swapMovement is true.
        new Exaflare(400, (swapMovement) ? 200 : 0, 200, 6500, 86, 0, 0, 1000),
        new Exaflare(1000, (swapMovement) ? 0 : 200, 200, 6500, -86, 0, 0, 1000),
        new Exaflare(400, (swapMovement) ? 600 : 400, 200, 6500, 86, 0, 0, 1000),
        new Exaflare(1000, (swapMovement) ? 400 : 600, 200, 6500, -86, 0, 0, 1000),
        // These are the cardinal exoflares. They're always in the same
        // orientation.
        new Exaflare(620, 300, 200, 6500, -86, 0, 0, 1000),
        new Exaflare(780, 300, 200, 6500, 86, 0, 0, 1000),
        new Exaflare(700, 380, 200, 6500, 0, 86, 0, 1000),
        new Exaflare(700, 220, 200, 6500, 0, -86, 0, 1000)
    ]
    AoEs = [
        new SpreadCircle(1, 200, 8500),
        new SpreadCircle(2, 200, 8500),
        new SpreadCircle(3, 200, 8500),
        new SpreadCircle(4, 200, 8500)
    ]

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

    // but first update so that people can dodge exoflares!
    if (millis() < 2000) { // get in original position
        drgPosX += (swapMovement) ? -1.3 : 1.3
        drgPosY += 1.3
        warPosX -= (swapMovement) ? -1.3 : 1.3
        warPosY -= 1.3
        sgePosY -= (swap) ? -2 : 2
        if (stackFirst) {
            sgePosY += (swap) ? -0.8 : 0.8
        }
        sgePosX += (swapMovement^swap^stackFirst) ? -1.4 : 1.4
    } if (millis() > 6500 && millis() < 7500) { // move to adjust.
        drgPosX += (swapMovement) ? -1.3 : 1.3
        warPosX -= (swapMovement) ? -1.3 : 1.3
        sgePosX += (swapMovement^swap^stackFirst) ? -1.4 : 1.4
    } if (millis() > 8800 && millis() < 9600) { // more moving to adjust
        drgPosY += 2
        warPosY -= 2
        if (stackFirst) {
            sgePosY -= (swap) ? -2 : 2
        } else {
            sgePosY += (swap) ? -2 : 2
            sgePosX -= (swap^swapMovement) ? -1 : 1
        }
    } if (millis() > 9800 && millis() < 11500 && !stackFirst) {
        drgPosX -= (swapMovement) ? -2 : 2
        warPosX += (swapMovement) ? -2 : 2
        sgePosX -= (swapMovement^swap) ? -2 : 2
    } if (millis() > 11500 && millis() < 12500 && !stackFirst) {
        sgePosY -= (swap) ? -2 : 2
    } if (millis() > 9800 && millis() < 13000 && stackFirst) {
        sgePosX -= (swapMovement^swap^stackFirst) ? -2 : 2
    }

    strokeWeight(3)

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

    // display stacks and spreads (at correct time).
    // the slot for debuff 1 is xPos 105. debuff 2 is xPos 140.
    let xPosStack = (stackFirst) ? 105 : 140
    let xPosSpread = (stackFirst) ? 140 : 105
    if (millis() < 13500) {
        fill(0, 80, 50)
        if (!stackFirst || millis() < 8500) {
            rect(xPosStack - 15, 20 + whoGetsStack[0] * 50, 30, 30)
            rect(xPosStack - 15, 20 + whoGetsStack[1] * 50, 30, 30)
        } if (stackFirst || millis() < 8500) {
            rect(xPosSpread - 15, 70, 30, 30)
            rect(xPosSpread - 15, 120, 30, 30)
            rect(xPosSpread - 15, 170, 30, 30)
            rect(xPosSpread - 15, 220, 30, 30)
        }

        fill(0, 0, 100)
        // display a "2" for stack
        if (!stackFirst || millis() < 8500) {
            text("2", xPosStack - 10, 45 + whoGetsStack[0] * 50)
            text("2", xPosStack - 10, 45 + whoGetsStack[1] * 50)
        }

        // display a circle for spread
        if (stackFirst || millis() < 8500) {
            stroke(0, 0, 100)
            noFill()
            circle(xPosSpread, 85, 20)
            circle(xPosSpread, 135, 20)
            circle(xPosSpread, 185, 20)
            circle(xPosSpread, 235, 20)
        }
    }



    noStroke()

    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) posX -= 2 // A or ← = left
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) posY -= 2 // W or ↑ = up
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) posX += 2 // D or → = right
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) posY += 2 // S or ↓ = down

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

    if (posX < 432 || posY < 32 ||
        posX > 978 || posY > 578) {
        partyWiped = true
        causeOfWipe = "You entered the edge of\nthe arena."
    }

    if (partyWiped === true) {
        fill(0, 100, 100)
        text(causeOfWipe, 10, 300)
    }
    print(engagedAt)

    for (let exoflare of exoflares) {
        exoflare.update()
        exoflare.displayAoE()
    } for (let AoE of AoEs) {
        AoE.update()
        AoE.displayAOE()
    }



    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()

    // if (frameCount > 3000) noLoop()
}

function mousePressed() {
    if (mouseX > 0 && mouseX < 230 &&
        mouseY > height - 30 && mouseY < height) {
        exoflareHelper = true
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