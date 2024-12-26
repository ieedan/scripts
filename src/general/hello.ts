// this is just here for testing purposes

import readline from "node:readline";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const askQuestion = (query): Promise<string> => {
	return new Promise((resolve) => {
		rl.question(query, (answer) => {
			resolve(answer);
		});
	});
};

const main = async () => {
	const args = process.argv.slice(2);

	let n = args[0];

	if (!n) {
		n = await askQuestion("What is your name? ");
	}

	console.log(`Hello ${n}`);

	process.exit(0);
};

main();
