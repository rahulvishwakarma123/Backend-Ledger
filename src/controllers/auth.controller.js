const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { sendRegistrationEmail, sendLoginNotification } = require('../utils/mailer');


// const checkReq = async (req, res) => {
//   try {
//     // Your check logic here
//     res.status(200).json({  
//       success: true, 
//       message: "Check endpoint working" 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };



async function userRegister(req, res) {
    try {
        console.log("get the request..");
        const { name, email, password } = req.body;

        // Fixed: await and check for existence correctly
        const isExists = await userModel.findOne({ email });
        if (isExists) { // Fixed logic: if user exists, return error
            return res.status(422).json({
                success: false,
                message: "User already exists"
            });
        }

        const user = await userModel.create({
            name,
            email,
            password
        });

        const userId = user._id;
        const token = jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: "3d" });

        // Send registration email (don't await to avoid blocking response)
        sendRegistrationEmail(email, name).catch(err => {
            console.error('Failed to send registration email:', err);
        });

        // Set the token into the cookie
        res.cookie("token", token);

        // Send the response
        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
                // Don't send password back!
            },
            token: token
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

async function userLogin(req, res) {
    try {
        const { email, password } = req.body;

        // Fixed: Select password field properly
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email or Password is incorrect."
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Email or Password is Invalid."
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.SECRET_KEY,
            { expiresIn: "3d" }
        );

        // Send login notification email (don't await to avoid blocking)
        sendLoginNotification(user.email, user.name, req).catch(err => {
            console.error('Failed to send login notification:', err);
        });

        // Set cookie
        res.cookie("token", token);

        // Send response
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

module.exports = {
    userRegister,
    userLogin
};
