const User = require('../model/User');
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
require('dotenv').config()

const signup = async (req, res, next) => {
    const {name, email, password} = req.body
    let existingUser;

    try {
        existingUser = await User.findOne({email: email})
    } catch (error) {
        return res.status(404).json(error)
    }

    if(existingUser) {
        return res.status(409).json({message: "user already exist"})
    }

    const hashPassword = bcrypt.hashSync(password)

    const user = new User({
        name,
        email,
        password : hashPassword,
    })

    try {
        await user.save()
    } catch (error) {
        return res.status(500).json(error)
    }
    return res.status(201).json({message: user})
}

const login = async (req, res, next) => {
    const {email, password} = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (error) {
        return res.status(404).json(error)
    }

    if(!existingUser) {
        return res.status(404).json({ message: "user not found"})
    }

    const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
    if(!isPasswordCorrect){
        return res.status(400).json({ message: "invalid password or email"})
    }
    const token = jwt.sign({id : existingUser._id}, process.env.JWT_SECRET_KEY, {
        // expiresIn: "1hr"
        expiresIn: "30s"
    })
    
    res.cookie(String(existingUser._id), token, {
        path: '/',
        expires: new Date(Date.now() + 1000 * 30),
        httpOnly: true,
        sameSite: 'lax'
    })

    return res.status(200).json({ message: "Successfully LogIn", user: existingUser, token})
}

const verifyToken = (req, res, next) => {
    const cookie = req.headers.cookie;
    if(!cookie){
        return res.status(404).json({ message: "No Token Found"})
    }
    const token = cookie.split("=")[1]

    // const headers = req.headers[`authorization`]
    // const token = headers.split(" ")[1];
    if(!token){
        return res.status(404).json({ message: "No Token Found"})
    }
    jwt.verify(String(token), process.env.JWT_SECRET_KEY, (err, user) => {
        if(err) {
            return res.status(400).json({ message: "invalid Token"})
        }
        req.id = user.id
    })
    next()
}

const getUser = async (req, res, next) => {
    const userId = req.id;
    let user;
    try {
        user = await User.findById(userId, "-password");
    } catch (error) {
        return res.status(500).json(error)
    }
    if(!user) {
        return res.status(404).json({message: "user dose not exist"})
    }
    res.status(200).json({user})
}

exports.signup = signup
exports.login = login
exports.verifyToken = verifyToken
exports.getUser = getUser