const app = require('./src/app');
const port = 3000;
require("dotenv").config();

const connectDB = require("./src/config/db");

connectDB(); 




app.listen(port, () =>{
    console.log("port is running on ", port)
})