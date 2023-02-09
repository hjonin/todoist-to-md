import {TodoistApi, Project, Section, Task, Comment} from "@doist/todoist-api-typescript";

const compareTasks = (a: Task | Section | Project, b: Task | Section | Project) => a.order - b.order;

enum NodeType {
    PROJECT,
    SECTION,
    TASK
}

class TodoistNode {
    type: NodeType;
    id: string;
    name: string;
    taskTree: TodoistNode[];
    comments: string[];

    constructor(type: NodeType, id: string, name: string, taskTree: TodoistNode[] = [], comments: string[] = []) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.taskTree = taskTree;
        this.comments = comments;
    }
}

class TodoistToMarkdown {
    private readonly projects: Project[];
    private readonly sections: Section[];
    private readonly tasks: Task[];
    private readonly comments: Comment[];

    private constructor(projects: Project[] = [], sections: Section[] = [], tasks: Task[] = [], comments: Comment[] = []) {
        this.projects = projects;
        this.sections = sections;
        this.tasks = tasks;
        this.comments = comments;
    }

    static async initialize(token: string) {
        const api = new TodoistApi(token);
        const projects: Project[] = await api.getProjects();
        projects.sort(compareTasks);
        const sections: Section[] = await api.getSections();
        sections.sort(compareTasks);
        const tasks: Task[] = await api.getTasks();
        tasks.sort(compareTasks);
        const comments: Comment[] = [];
        for (const project of projects) {
            comments.concat(await api.getComments({taskId: project.id}));
        }
        for (const task of tasks) {
            comments.concat(await api.getComments({taskId: task.id}));
        }
        return new TodoistToMarkdown(projects, sections, tasks, comments);
    }

    private getComments(taskOrProjectId: string) {
        return this.comments.filter(comment => comment.projectId === taskOrProjectId || comment.taskId === taskOrProjectId);
    }

    private createProjectNode(project: Project) {
        const comments = project.commentCount > 0 ? (this.getComments(project.id))
            .map(comment => comment.content) : [];
        return new TodoistNode(NodeType.PROJECT, project.id, project.name, [], comments);
    }

    private createNodeTree(currentTask: Task, allTasks: Task[]) {
        const taskTree: TodoistNode[] = allTasks
            .filter(task => task.parentId === currentTask.id)
            .map(task => this.createNodeTree(task, allTasks));
        const comments = currentTask.commentCount > 0 ? (this.getComments(currentTask.id))
            .map(comment => comment.content) : [];
        return new TodoistNode(NodeType.TASK, currentTask.id, currentTask.content, taskTree, comments);
    }

    private formatNodeTree(currentNode: TodoistNode, indent: number = 0) {
        const formattedIndent: string = currentNode.type === NodeType.TASK ? `${'\t'.repeat(indent)}- [ ]` : '';
        let formattedName: string;
        switch (currentNode.type) {
            case NodeType.PROJECT:
                formattedName = `# ${currentNode.name}`;
                break;
            case NodeType.SECTION:
                formattedName = `## ${currentNode.name}`;
                break;
            default:
                formattedName = currentNode.name;
                break;
        }
        const formattedComments = currentNode.comments.length > 0 ? `_${currentNode.comments?.join(' ')}_` : '';
        const incIndent = currentNode.type === NodeType.TASK ? indent + 1 : indent;
        const formattedSubtasks: string = currentNode.taskTree.map(subTask => this.formatNodeTree(subTask, incIndent)).join('');
        return `${formattedIndent} ${formattedName} ${formattedComments}\n${formattedSubtasks}`;
    }

    convert() {
        let formattedProjects = [];
        let mappedProject: TodoistNode;
        for (const project of this.projects) {
            mappedProject = this.createProjectNode(project);
            mappedProject.taskTree = this.tasks
                .filter(task => task.projectId === project.id && !task.sectionId && !task.parentId)
                .map(task => this.createNodeTree(task, this.tasks));
            const filteredSections = this.sections
                .filter(section => section.projectId === project.id);
            let mappedSection: TodoistNode;
            for (const section of filteredSections) {
                mappedSection = new TodoistNode(NodeType.SECTION, section.id, section.name);
                mappedSection.taskTree = this.tasks
                    .filter(task => task.sectionId === mappedSection.id)
                    .map(task => this.createNodeTree(task, this.tasks));
                mappedProject.taskTree.push(mappedSection);
            }
            formattedProjects.push(this.formatNodeTree(mappedProject));
        }
        return formattedProjects;
    }
}

export async function convert(token: string) {
    return (await TodoistToMarkdown.initialize(token)).convert();
}
