const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')

// Express stuff

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.listen(process.env.PORT || 8080)
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})
