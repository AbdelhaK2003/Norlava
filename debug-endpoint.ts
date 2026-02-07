import fetch from 'node-fetch';

const BASE_URL = 'https://norlava-production.up.railway.app';

console.log("Starting connectivity check...");

async function check(path) {
    const url = `${BASE_URL}${path}`;
    console.log(`\n----------------------------------------`);
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Origin': 'https://norlava.com' }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);

        console.log("Headers:");
        const headers = {};
        for (const [key, value] of res.headers.entries()) {
            console.log(`  ${key}: ${value}`);
            headers[key] = value;
        }

        const text = await res.text();
        console.log("\nBody:");
        console.log(text); // Print FULL body

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    await check('/api/health'); // Should be 200 OK
    await check('/api/auth/login'); // Should be 404/405/500 but WITH headers
}

run();
