const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        required: [true, "Account must be associated with user"],
        index: true
    },
    status:{
        type:String,
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message: `status can be ACTIVE, FROZEN or CLOSED.`,
            defalt: "ACTIVE"
        }
    },
    currency:{
        type:String,
        required:[true, "currency must be required for account creation"],
        default: "INR"
    }
},{
    timestamps:true
})

// compound index
accountSchema.index({user:1, status:1})

const Account = mongoose.model("account", accountSchema );

module.exports = Account