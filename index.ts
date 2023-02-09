import {convert} from "./convert";
import * as fs from "fs/promises";
import * as dotenv from 'dotenv'

dotenv.config()

convert(process.env.TOKEN as string).then((projects: string[]) => {
    let i = 1;
    for (const project of projects) {
        fs.writeFile(`${i++}.md`, project);
    }
});