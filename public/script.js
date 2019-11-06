const video = document.getElementById('video')

let FaceLandmarks = {
    jaw: null,
    rightEyeBrow: null,
    leftEyeBrow: null,
    nose: null,
    leftEye: null,
    rightEye: null,
    mouth: null
}

const FaceColors = {
    jaw: '#FF846A', // salmon-ish
    rightEyeBrow: '#B2D374', // green-ish
    leftEyeBrow: '#FCBC43', //orange-ish
    nose: '#379ED5', // blue
    leftEye: '#e5cbbe', // pink
    rightEye: '#F8FF84', // yellow
    mouth: '#A778C8' // purple
}

let capture

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
])

function startVideo() {
    navigator.getUserMedia(
        {
            video: {}
        },
        stream => video.srcObject = stream,
        err => console.error(err)
    )

    video.addEventListener('canplay', () => {
        setInterval(detect, 100)
    })
}

async function detect () {
    await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks()
    .withFaceExpressions()
    .then(detections => {
        if (detections.length) {
            let positionsArr = detections[0].landmarks['_positions']
            FaceLandmarks.jaw = positionsArr.slice(0, 17)
            FaceLandmarks.leftEyeBrow = positionsArr.slice(17, 22)
            FaceLandmarks.rightEyeBrow = positionsArr.slice(22, 27),
            FaceLandmarks.nose = positionsArr.slice(27, 36)
            FaceLandmarks.leftEye = positionsArr.slice(36, 42)
            FaceLandmarks.rightEye = positionsArr.slice(42, 48)
            FaceLandmarks.mouth = positionsArr.slice(48, 68)
        }
    })
}

let cap
let isCrazy = false
let isZoom = false
let isActive = null
let isDrawMode = false

function setup() {
    createCanvas(720, 560)
    startVideo()
    cap = createCapture(VIDEO)
    cap.hide()
}

function keyPressed() {
    if (keyCode === 68)
        isDrawMode = true
    else if (keyCode === 83)
        isDrawMode = false
}

function mousePressed(ev) {
    if (ev.target.tagName === 'BUTTON') {
        isDrawMode = ev.target.id === 'draw-mode' ? true : false
        return
    }
    for (feature in FaceLandmarks) {
        if (feature === 'jaw')
            continue
        let pointsArr = FaceLandmarks[feature]
        let xArr = [], 
            yArr = []
        for (let idx = 0; idx < pointsArr.length; idx++) {
            xArr.push(FaceLandmarks[feature][idx]['_x'])
            yArr.push(FaceLandmarks[feature][idx]['_y'])
        }
    
        let xMin = Math.min(...xArr)
        let xMax = Math.max(...xArr)
        let yMin = Math.min(...yArr)
        let yMax = Math.max(...yArr)
        let cx = width - mouseX
        if (cx < xMax && cx > xMin && mouseY < yMax && mouseY > yMin) {
            isActive = feature
            return
        }
    }
    isCrazy = true
}

function mouseReleased(ev) {
    isCrazy = false
    isActive = null
}

function drawFace() {
    for (feature in FaceLandmarks) {
        let xMin, xMax, yMin, yMax
        if (FaceLandmarks[feature] != null) {
            let pointsArr = []
            if (isCrazy) {
                for(idx = 0; idx < 8; idx++) {
                    pointsArr.push(
                        {
                            '_x': Math.floor(Math.random() * canvas.width * 2),
                            '_y': Math.floor(Math.random() * canvas.height)
                        }
                    )
                }
                strokeWeight(Math.random() * 10)
            } else {
                pointsArr = FaceLandmarks[feature]
                strokeWeight(3)
            }
            noFill()
            stroke(FaceColors[feature])
            beginShape()
            for (let idx = 0; idx < pointsArr.length; idx++) {
                let x1 = pointsArr[idx]['_x']
                let y1 = pointsArr[idx]['_y']
                
                if (!xMin || x1 < xMin[0])
                    xMin = [x1, y1]
                if (!yMin || y1 < yMin[1])
                    yMin = [x1, y1]
                if (!xMax || x1 > xMax[0])
                    xMax = [x1, y1]
                if (!yMax || y1 > yMax[1])
                    yMax = [x1, y1]

                if (isActive)
                    continue

                curveVertex(x1, y1)

                if (!idx || idx === pointsArr.length - 1) {
                    curveVertex(x1, y1)
                }
            }

            if (isActive) {
                if (feature !== isActive) 
                    continue
                let img = cap.get()

                let swidth = Math.ceil(xMax[0] - xMin[0])
                let sheight = Math.ceil(yMax[1] - yMin[1])
                let imgWidth = Math.ceil((swidth / sheight) * height)
                copy(img, 
                    Math.ceil(xMin[0]), 
                    Math.ceil(yMin[1]),
                    swidth,
                    sheight,
                    Math.round((width - imgWidth )/ 2),
                    0,
                    imgWidth,
                    height
                )

                let avgR = 0, 
                    avgG = 0, 
                    avgB = 0

                for (idx = 0; idx < pointsArr.length; idx++) {
                    let x1 = pointsArr[idx]['_x']
                    let y1 = pointsArr[idx]['_y']
                    let rgb = get(x1, y1)
                    avgR += rgb[0]
                    avgG += rgb[1]
                    avgB += rgb[2]
                }

                document.body.style.background = 'none'
                avgR = avgR / pointsArr.length
                avgG = avgG / pointsArr.length
                avgB = avgB / pointsArr.length
                document.body.style.backgroundColor = `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`
                return
            }
            if (feature === 'mouth' || feature === 'rightEye' || feature === 'leftEye') {
                let lastIdx = pointsArr.length - 1
                line(pointsArr[lastIdx]['_x'], pointsArr[lastIdx]['_y'], pointsArr[0]['_x'],pointsArr[0]['_y'])

            }
            endShape()
        }
    }
}

function draw() {
    if (!isDrawMode)
        background('#d5b8d2')
    if (!isZoom) 
        drawFace()
    else {
        let img = cap.get()
        copy(img, 0, 0, canvas.width, canvas.height, 0, 0, cap.width, cap.height)
    }
}
