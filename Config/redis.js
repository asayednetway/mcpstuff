import {createClient} from 'redis';
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

const redis = createClient({
    url: process.env.REDIS_URL,
});



await redis.connect().then(() => {
    console.log("Connected to Redis");
}).catch((err)=> {
    console.log("Redis connection error: ", err);
})

export  {redis};
