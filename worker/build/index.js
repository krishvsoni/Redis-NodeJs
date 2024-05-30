"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const fs_1 = __importDefault(require("fs"));
const client = (0, redis_1.createClient)();
function processSubmission(submission) {
    return __awaiter(this, void 0, void 0, function* () {
        const { problemId, code, language } = JSON.parse(submission);
        console.log(`Processing submission for problemId ${problemId}...`);
        console.log(`Code: ${code}`);
        console.log(`Language: ${language}`);
        yield new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Finished processing submission for problemId ${problemId}.`);
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Worker connected to Redis.");
            while (true) {
                try {
                    const submission = yield client.brPop("problems", 0);
                    yield processSubmission(submission.element);
                }
                catch (error) {
                    console.error("Error processing submission:", error);
                    // @ts-ignore
                    fs_1.default.appendFile('error.log', `${new Date().toISOString()} - Error processing submission: ${error.message}\n`, (err) => {
                        if (err)
                            console.error('Failed to write to log file:', err);
                    });
                    try {
                        const submission = yield client.brPop("problems", 0);
                        yield client.lPush("problems", submission.element);
                    }
                    catch (pushError) {
                        console.error("Failed to requeue the submission:", pushError);
                    }
                }
            }
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
        }
    });
}
startWorker();
