import * as dotenv from 'dotenv'
import * as fs from "fs/promises";

import {todoistToMarkdown} from "./todoistToMarkdown";

dotenv.config()

todoistToMarkdown(process.env.TOKEN as string).then((projects: any[]) => {
    let i = 1;
    for (const project of projects) {
        fs.writeFile(`${project.project_name}.md`, project.project_tree);
    }
});