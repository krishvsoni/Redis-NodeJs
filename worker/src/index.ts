import { createClient, RedisClientType } from 'redis';
import fs from 'fs';

interface Submission {
    problemId: string;
    code: string;
    language: string;
}

interface RedisSubmission {
    key: string;
    element: string;
}

const client: RedisClientType = createClient();

async function processSubmission(submission: string) {
    const { problemId, code, language }: Submission = JSON.parse(submission);

    console.log(`Processing submission for problemId ${problemId}...`);
    console.log(`Code: ${code}`);
    console.log(`Language: ${language}`);

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Finished processing submission for problemId ${problemId}.`);
}

async function startWorker() {
    try {
        await client.connect();
        console.log("Worker connected to Redis.");

        while (true) {
            try {
                const submission = await client.brPop("problems", 0) as unknown as RedisSubmission;
                await processSubmission(submission.element);
            } catch (error) {
                console.error("Error processing submission:", error);
                // @ts-ignore
                fs.appendFile('error.log', `${new Date().toISOString()} - Error processing submission: ${error.message}\n`, (err) => {
                    if (err) console.error('Failed to write to log file:', err);
                });

                try {
                    const submission = await client.brPop("problems", 0) as unknown as RedisSubmission;
                    await client.lPush("problems", submission.element);
                } catch (pushError) {
                    console.error("Failed to requeue the submission:", pushError);
                }
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startWorker();
