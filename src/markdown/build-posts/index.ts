import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import Shiki from "@shikijs/markdown-it";
import { parseFrontmatter } from "./markdown";
import { Post } from "./types";

const POSTS_DIRECTORY = "./src/lib/blog/posts";
const CHANGE_DEBOUNCE = 50;
const OUT_FILE = "./posts.js";

const watch = process.argv.includes("--watch");

let postsDirectory = POSTS_DIRECTORY;
let changeDebounce = CHANGE_DEBOUNCE;
let outFile = OUT_FILE;

for (let i = 0; i < process.argv.length; i++) {
	if (process.argv[i] === "--posts-directory") {
		postsDirectory = process.argv[i + 1];
	}

	if (process.argv[i] === "--change-debounce") {
		changeDebounce = parseInt(process.argv[i + 1]);
	}

	if (process.argv[i] === "--out-file") {
		outFile = process.argv[i + 1];
	}
}

const md = MarkdownIt();

const main = async () => {
	md.use(
		await Shiki({
			themes: {
				light: "ayu-dark",
				dark: "ayu-dark",
			},
		})
	);

	build().then((cache) => {
		let timeout: NodeJS.Timeout;

		if (watch) {
			console.log("info: Watching for changes...");
			fs.watch(postsDirectory, {}, (e, file) => {
				if (!file?.endsWith(".md")) return;

				clearTimeout(timeout);

				timeout = setTimeout(async () => {
					console.log(`${e} to ${file}`);
					cache = await build(file, cache);
				}, changeDebounce);
			});
		}
	});
};

const build = async (changed: string | undefined = undefined, cache: Map<string, Post> = new Map()) => {
	const start = Date.now();

	const posts: Map<string, Post> = cache;

	const files = fs.readdirSync(postsDirectory);
	for (const file of files) {
		// skip this file if it is already in the cache
		if (changed !== undefined && file !== changed && posts.has(file)) continue;

		if (!file.endsWith(".md")) continue;

		const fileContent = fs.readFileSync(path.join(postsDirectory, file)).toString();

		const [meta, content] = parseFrontmatter(fileContent);

		if (!meta.title) {
			console.log(`error: Couldn't add post because ${file} didn't include a 'title' in the front-matter. ❌`);
			continue;
		}

		const slug = encodeURIComponent(meta.title as string);

		const htmlContent = md.render(content);

		let action = "Added";

		if (posts.has(file)) {
			action = "Updated";
		}

		posts.set(file, { meta, content: htmlContent, slug });

		console.log(`info: ${action} post ${file}`);
	}

	const postsFile = fileTemplate(
		Array.from(posts.values()).sort((a, b) => Date.parse(b.meta.date as string) - Date.parse(a.meta.date as string))
	);

	fs.writeFileSync(outFile, postsFile);

	const end = Date.now();

	console.log(`info: Wrote posts to ${outFile} in ${end - start}ms ✔️ `);

	return posts;
};

const fileTemplate = (posts: Post[]) => {
	return `const posts = ${JSON.stringify(posts, null, "\t")};

export { posts };
    `;
};

// run program
main();