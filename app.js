const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const router = require("./routes/user-routes")
const cookieParser = require('cookie-parser')
dotenv.config()


const app = express()
app.use(cookieParser())
app.use(express.json())

app.use('/api', router)

mongoose.connect(process.env.MONGO_URL).then(() => {
    app.listen(process.env.PORT, () => {
        console.log("app is running")
    })
}).catch((err) => console.log(err))

