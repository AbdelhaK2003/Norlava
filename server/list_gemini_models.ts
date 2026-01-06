import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';

async function listModels() {
    const log: string[] = [];
    const write = (msg: string) => {
        console.log(msg);
        log.push(msg);
    };

    write("🔑 API Key: " + (process.env.GEMINI_API_KEY ? "Present" : "MISSING"));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    try {
        write("\n🔍 Fetching available models...\n");

        // listModels is not directly available on GoogleGenerativeAI instance in this version
        // We will rely on the manual test below
        write("Skipping listModels() (Not supported in this SDK version)");

    } catch (error: any) {
        write("❌ Error listing models:");
        write(error.message);

        write("\n🔧 Trying alternative models...\n");

        const modelsToTry = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'models/gemini-pro',
            'models/gemini-1.5-flash'
        ];

        for (const modelName of modelsToTry) {
            try {
                write(`Testing: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                write(`  ✅ ${modelName} WORKS!`);
                write(`     Response: ${response.text().substring(0, 50)}...`);
                write('');
            } catch (err: any) {
                write(`  ❌ ${modelName} failed`);
                write(`     ${err.message.substring(0, 100)}`);
                write('');
            }
        }
    }

    writeFileSync('server/model_list_output.txt', log.join('\n'));
    write("\n💾 Output saved to server/model_list_output.txt");
}

listModels();
