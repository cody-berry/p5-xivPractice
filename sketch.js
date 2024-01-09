/**
 *  @author 
 *  @date 2023.
 *
 */

let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let posX = 700
let posY = 300


function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
}


function setup() {
    let cnv = createCanvas(1000, 600)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)
}


function draw() {
    background(234, 34, 24)


    fill(0, 80, 75)
    rect(400, 0, 600, 600)
    fill(20, 50, 40)
    noStroke()
    rect(420, 20, 560, 560)
    for (let xIncrements = 0; xIncrements < 8; xIncrements++) {
        for (let yIncrements = 0; yIncrements < 8; yIncrements++) {
            if ((xIncrements + yIncrements) % 2 === 0) {
                fill(20, 50, 38)
                rect(421 + xIncrements*70, 21 + yIncrements*70, 68, 68)
            }
        }
        stroke(0, 0, 0)
        strokeWeight(1)
        line(420 + xIncrements*70, 20, 420 + xIncrements*70, 580)
        line(420, 20 + xIncrements*70, 980, 20 + xIncrements*70)
        noStroke()
    }
    stroke(0, 0, 0)
    strokeWeight(1)
    line(980, 20, 980, 580)
    line(420, 580, 980, 580)

    stroke(60, 70, 60)
    fill(10, 70, 60)
    strokeWeight(2)
    rect(posX - 15, posY - 15, 30, 30) // display you in your position

    // now display the party
    rect(10, 60, 40, 40)
    rect(10, 110, 40, 40)
    fill(120, 70, 40)
    rect(10, 160, 40, 40)
    fill(240, 70, 40)
    rect(10, 210, 40, 40)

    fill(0, 0, 100)
    textSize(30)
    noStroke()
    text("Party composition:", 5, 25)
    textSize(20)
    text("You", 13, 87)
    textSize(25)
    text("1", posX - 7, posY + 8)
    textSize(30)
    text("#1", 55, 90)
    text("#2", 55, 140)
    text("#3", 55, 190)
    text("#4", 55, 240)

    if ((keyIsDown(65) || keyIsDown(37)) && posX > 416) posX -= 2 // A or ← = left
    if ((keyIsDown(87) || keyIsDown(38)) && posY > 16) posY -= 2 // W or ↑ = up
    if ((keyIsDown(68) || keyIsDown(39)) && posX < 984) posX += 2 // D or → = right
    if ((keyIsDown(83) || keyIsDown(40)) && posY < 584) posY += 2 // S or ↓ = down


    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()

    // if (frameCount > 3000) noLoop()
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