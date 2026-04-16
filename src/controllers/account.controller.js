const accountModel = require('../models/accounts.model')

async function createAccountController(req, res) {
    user = req.user;
    account = await accountModel.create({
        user: user._id
    })
    res.status(201).json({
        account
    })
}

module.exports = {createAccountController}