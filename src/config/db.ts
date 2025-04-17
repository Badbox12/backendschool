import * as mongoose from "mongoose"
import * as pc from 'picocolors'

export const connectDB = async () =>{
    try {
        const MONGO_URI = Bun.env.MONGO_URI;
        if (!MONGO_URI) throw new Error("MONGO_URI is undefined");
        if(MONGO_URI !== undefined){
            const conn = await mongoose.connect(MONGO_URI, {
                autoIndex: true,
               
            })
            console.log(
                pc.cyan(
                  `Success: MongoDB Connected: ${conn.connection.host}:${conn.connection.port} - [${conn.connection.name}]`
                )
              )
        }
    } catch (err: any) {
        console.error(pc.red(`Error: ${err.message}`))
    process.exit(1)
    }
}