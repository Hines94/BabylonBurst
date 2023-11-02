export function LoadHTMLTemplateToNewWindow(
    templateName: string,
    windowName: string
): { loadingElement: Promise<HTMLDivElement>; window: Window } {
    const popout = window.open("", windowName, "fullscreen=yes,toolbar=no,menubar=no,location=no");
    popout.document.write("<div id='TemplateBase'></div>");
    popout.moveTo(0, 0);
    popout.resizeTo(screen.width * 0.9, screen.height * 0.9);
    return {
        loadingElement: LoadHTMLUITemplate(templateName, popout.document.getElementById("TemplateBase") as HTMLElement),
        window: popout,
    };
}

/** Load a UI template from server and use it to generate a new HTML ui for us */
export async function LoadHTMLUITemplate(
    templateName: string,
    owningElement: HTMLElement = document.getElementById("GameUI")
): Promise<HTMLDivElement> {
    if (!owningElement) {
        console.error("No owning element for template " + templateName);
    }
    //Load element
    const response = await fetch(`HTMLTemplates/${templateName}.html`);
    if (!response.ok) {
        console.error("Error loading: '" + templateName + "' HTML template : " + response.statusText);
    }
    const template = await response.text();
    if (template.includes("___INDEXPAGE___")) {
        console.error(
            `Fetched index page! Likely problem with template: ${templateName}. Fetch response: ${response.url}`
        );
        return undefined;
    }
    //Create temp container to hold instance
    const tempContainer = owningElement.ownerDocument.createElement("div");
    tempContainer.innerHTML = template;
    //Add to our game UI overlay
    owningElement.appendChild(tempContainer);

    const scripts = tempContainer.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
        const script = owningElement.ownerDocument.createElement("script");
        script.textContent = scripts[i].textContent;
        owningElement.ownerDocument.body.appendChild(script);
    }
    return tempContainer;
}
