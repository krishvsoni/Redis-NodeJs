import express, { Express } from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const client = createClient();
client.on("error",(err) => console.log("Error", err));
client.on("connect", () => console.log("Connected to Redis"));

app.post('/submit', async (req,res) => {
    const problemId = req.body.problemId;
    const code =  req.body.code;
    const language = req.body.language;

    try{
        await client.lPush('problems',JSON.stringify({problemId, code, language}));
        res.status(200).send('Submission successful');
    } catch(err){
        console.error("Redis Error", err);
        res.status(500).send('Submission failed');
    }

})

 async function startServer(){
    try{
        await client.connect();
        console.log('Connected to Redis');
        app.listen(3000,() => {
            console.log('Server running on port 3000');
        });
    } catch(err){
        console.error('Redis Connection Error', err);
    }
 }

 startServer();