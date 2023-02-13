import {TodoistApi} from "@doist/todoist-api-typescript";

export enum ItemType {
    PROJECT,
    SECTION,
    TASK
}

class TodoistItem {
    type: ItemType;
    id: string;
    name: string;
    parentId: string | null;
    order: number;
    commentCount: number;

    constructor(type: ItemType, id: string, name: string, parentId: string | null, order = 0, commentCount = 0) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.order = order;
        this.commentCount = commentCount;
    }
}

export class TodoistNode extends TodoistItem {
    children: TodoistNode[];

    constructor(type: ItemType, id: string, name: string, parentId: string | null, children: TodoistNode[]) {
        super(type, id, name, parentId);
        this.children = children;
    }
}

export class TodoistComment {
    id: string;
    content: string;
    parentId: string;

    constructor(id: string, content: string, parentId: string) {
        this.id = id;
        this.content = content;
        this.parentId = parentId;
    }
}

const itemCompare = (a: TodoistItem, b: TodoistItem) => a.order - b.order;

export const createTree = (currentNode: TodoistNode, allNodes: TodoistNode[]): TodoistNode => {
    const children = [];
    for (const child of allNodes.filter(item => item.parentId == currentNode.id)) {
        children.push(createTree(child, allNodes));
    }
    return new TodoistNode(currentNode.type, currentNode.id, currentNode.name, currentNode.parentId, children);
}

export const formatTree = (currentNode: TodoistNode, comments: TodoistComment[], indent: number = 0): string => {
    const formattedIndent: string = currentNode.type === ItemType.TASK ? `${'\t'.repeat(indent)}- [ ] ` : '';
    let formattedName: string;
    switch (currentNode.type) {
        case ItemType.PROJECT:
            formattedName = `# ${currentNode.name}`;
            break;
        case ItemType.SECTION:
            formattedName = `## ${currentNode.name}`;
            break;
        default:
            formattedName = currentNode.name;
            break;
    }
    const currentComments = comments
        .filter(comment => comment.parentId == currentNode.id)
        .map(comment => comment.content);
    const formattedComments = currentComments.length > 0 ? `_${currentComments.join(' ')}_` : '';
    const incIndent = currentNode.type === ItemType.TASK ? indent + 1 : indent;
    const formattedChildren: string = currentNode.children
        .map(child => formatTree(child, comments, incIndent)).join('');
    return `${formattedIndent}${formattedName} ${formattedComments}\n${formattedChildren}`;
}

class TodoistToMarkdown {
    private readonly projects: TodoistItem[];
    private readonly sections: TodoistItem[];
    private readonly tasks: TodoistItem[];
    private readonly comments: TodoistComment[];

    private constructor(projects: TodoistItem[] = [], sections: TodoistItem[] = [], tasks: TodoistItem[] = [], comments: TodoistComment[] = []) {
        this.projects = projects;
        this.sections = sections;
        this.tasks = tasks;
        this.comments = comments;
    }

    static async initialize(token: string) {
        const api = new TodoistApi(token);
        const projects: TodoistItem[] = (await api.getProjects())
            .map(project => new TodoistItem(ItemType.PROJECT, project.id, project.name, project.parentId || null, project.order, project.commentCount));
        projects.sort(itemCompare);
        const sections: TodoistItem[] = (await api.getSections())
            .map(section => new TodoistItem(ItemType.SECTION, section.id, section.name, section.projectId, section.order));
        sections.sort(itemCompare);
        const tasks: TodoistItem[] = (await api.getTasks())
            .map(task => new TodoistItem(ItemType.TASK, task.id, task.content, task.parentId || task.sectionId || task.projectId || null, task.order, task.commentCount));
        tasks.sort(itemCompare);
        const comments: TodoistComment[] = [];
        for (const project of projects) {
            if (project.commentCount > 0) {
                comments.concat((await api.getComments({projectId: project.id}))
                    .map(comment => new TodoistComment(comment.id, comment.content, project.id)));
            }
        }
        for (const task of tasks) {
            if (task.commentCount > 0) {
                comments.concat((await api.getComments({taskId: task.id}))
                    .map(comment => new TodoistComment(comment.id, comment.content, task.id)));
            }
        }
        return new TodoistToMarkdown(projects, sections, tasks, comments);
    }

    convert() {
        const allItems = this.projects.concat(this.sections).concat(this.tasks)
            .map(item => item as TodoistNode);
        let projectTrees = [];
        const rootProjects = this.projects.filter(project => project.parentId == null)
            .map(item => item as TodoistNode);
        for (const rootProject of rootProjects) {
            const projectTree = createTree(rootProject, allItems);
            const projectTreeStr = formatTree(projectTree, this.comments);
            projectTrees.push({'project_name': rootProject.name, 'project_tree': projectTreeStr});
        }
        return projectTrees;
    }
}

export async function todoistToMarkdown(token: string) {
    return (await TodoistToMarkdown.initialize(token)).convert();
}
