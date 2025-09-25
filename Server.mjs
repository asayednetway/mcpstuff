import express from 'express';
const app= express();
app.use(express.json());
import {route} from './Routes/model_route.js';

app.use('/',route)
app.listen(8000,()=>{
    console.log("Server is running on port 8000");
});

export {app};