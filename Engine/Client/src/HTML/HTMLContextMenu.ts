export interface ContextMenuItem {
    name: string;
    callback: () => void;
}

export function ShowContextMenu(event: Event, items: ContextMenuItem[], doc: Document): boolean {
    //@ts-ignore
    return showContextMenu(event, items, doc);
}
