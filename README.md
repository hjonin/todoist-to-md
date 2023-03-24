![Node.js workflow](https://github.com/hjonin/todoist-to-md/actions/workflows/node.js.yml/badge.svg)

Todoist integration to turn your data into Markdown.

## Motivations

Take back control over your Todoist data by turning them into an open file format as Markdown. It'll let you use it then in your favorite note-taking app that supports Markdown, e.g. Joplin.

## Installation

```
npm install todoist-to-md
```

### Usage

You can find an example of saving your Todoist data into Markdown files under [example/to-file](example/to-file).

Run the example:
1. Configure the [.env](example/to-file/.env) file with your Todoist key.
2. ```
    ts-node example/to-file/index.ts
    ```

## Development and testing

Install dependencies:
```
npm install
```

Test:
```
npm test
```

### Publishing

Compile TS files:
```
npm run build
```

Publish:
```
npm version [version]
npm publish
```