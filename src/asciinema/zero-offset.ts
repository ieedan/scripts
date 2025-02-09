import fs from "node:fs";
import color from 'chalk'

const args = process.argv.slice(2);

const originalFile = args[0];
const newFile = args[1];

console.info(`Reading from ${color.cyan(originalFile)}`);

const file = fs.readFileSync(originalFile).toString();

const lines = file.split("\n");

let offsetBy = 0;

for (let i = 0; i < lines.length; i++) {
	if (i === 0) continue;
	if (lines[i].trim() === "") continue;

	if (i === 1) {
		offsetBy = parseTime(lines[i]);
	}

	lines[i] = editTime(lines[i], offsetBy);
}

console.info(`Writing to ${color.cyan(newFile)}`);

fs.writeFileSync(newFile, lines.join("\n"));

function editTime(line: string, offset: number) {
	const time = parseTime(line);

	return `[${time - offset},${line.slice(2 + time.toString().length)}`;
}

function parseTime(line: string) {
	const comma = line.indexOf(",");

	return parseFloat(line.slice(1, comma));
}
