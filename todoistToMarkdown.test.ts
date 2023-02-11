import {describe, expect, test} from '@jest/globals';

import {TodoistNode, ItemType, createTree, formatTree, TodoistComment} from './todoistToMarkdown';

const n1 = new TodoistNode(ItemType.PROJECT, '1', 'n1', null, []);
const n2 = new TodoistNode(ItemType.SECTION, '2', 'n2', null, []);
const n3 = new TodoistNode(ItemType.TASK, '3', 'n3', null, []);
const n4 = new TodoistNode(ItemType.TASK, '4', 'n4', null, []);

const c1 = new TodoistComment('1', 'Hello World!', n3.id);

describe('todoistToMarkdown module', () => {
    test('create empty tree', () => {
        // TODO
    });
    test('create tree with 1 node among 1 node', () => {
        expect(createTree(n1, [n1])).toStrictEqual(new TodoistNode(ItemType.PROJECT, '1', 'n1', null, []));
    });
    test('create tree with 1 node and 1 child among 2 nodes', () => {
        n2.parentId = n1.id;
        n3.parentId = null;
        expect(createTree(n1, [n1, n2])).toStrictEqual(new TodoistNode(ItemType.PROJECT, '1', 'n1', null, [n2]));
    });
    test('create tree with 1 node and 2 children among 2 nodes', () => {
        n2.parentId = n1.id;
        n3.parentId = n1.id;
        expect(createTree(n1, [n1, n2, n3])).toStrictEqual(new TodoistNode(ItemType.PROJECT, '1', 'n1', null, [n2, n3]));
    });
    test('create tree with 1 node and 1 child among 3 nodes', () => {
        n2.parentId = null;
        n3.parentId = n1.id;
        expect(createTree(n1, [n1, n2, n3])).toStrictEqual(new TodoistNode(ItemType.PROJECT, '1', 'n1', null, [n3]));
    });
    test('format empty tree', () => {
        // TODO
    });
    test('format tree with 1 node of type PROJECT', () => {
        expect(formatTree(n1, [])).toBe("# n1 \n");
    });
    test('format tree with 1 node of type SECTION', () => {
        expect(formatTree(n2, [])).toBe("## n2 \n");
    });
    test('format tree with 1 node of type TASK', () => {
        expect(formatTree(n3, [])).toBe("- [ ] n3 \n");
    });
    test('format tree with 1 PROJECT and 1 sub SECTION and 1 sub TASK and 1 sub sub TASK', () => {
        n2.parentId = n1.id;
        n3.parentId = n2.id;
        n4.parentId = n3.id;
        const n5 = createTree(n1, [n1, n2, n3, n4]);
        expect(formatTree(n5, [])).toBe("# n1 \n## n2 \n- [ ] n3 \n\t- [ ] n4 \n");
    });
    test('format tree with 1 node of type TASK and 1 comment', () => {
        expect(formatTree(n3, [c1])).toBe("- [ ] n3 _Hello World!_\n");
    });
});