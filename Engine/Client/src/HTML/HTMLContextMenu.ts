export interface ContextMenuItem {
    name: string;
    fontSize?: string;
    callback: () => void;
}

export function ShowContextMenu(event: Event, items: ContextMenuItem[], doc: Document): boolean {
    //@ts-ignore
    return showContextMenu(event, items, doc);
}
