import * as dotenv from 'dotenv';
import * as fs from "fs/promises";

import {todoistToMarkdown} from "../../index";

dotenv.config({ path: `${__dirname}/.env` })

todoistToMarkdown(process.env.TOKEN as string).then((projects: any[]) => {
    for (const project of projects) {
        fs.writeFile(`${__dirname}/${project.project_name}.md`, project.project_tree);
    }
});
