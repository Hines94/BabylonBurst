import { ShowToastNotification } from "./HTMLToastItem";
import { LoadHTMLTemplateToNewWindow } from "./TemplateLoader";

const existingWindowItems: { [name: string]: Window } = {};
var confirmOverriden = false;

function FindWindowConfirm(check: string, originalCheck: (check: string) => boolean): boolean {
    const keys = Object.keys(existingWindowItems);
    for (var i = 0; i < keys.length; i++) {
        const wind = existingWindowItems[keys[i]];
        if (!wind.closed && wind.document.hasFocus()) {
            return wind.confirm(check);
        }
    }
    return originalCheck(check);
}

("EditorSections/DatasheetDisplayer");

//TODO: Create option without ability to change/save?
export function OpenNewWindow(windowName: string, templateName: string, titleName: string) {
    if (existingWindowItems[windowName] && !existingWindowItems[windowName].closed) {
        existingWindowItems[windowName].focus();
        ShowToastNotification("Existing Instance Found");
        return undefined;
    }
    const Displayer = LoadHTMLTemplateToNewWindow(templateName, windowName);
    existingWindowItems[windowName] = Displayer.window;
    Displayer.window.document.write(`
        <title>${titleName}</title>
    `); //TODO: Icon?
    window.addEventListener("beforeunload", function () {
        if (Displayer.window) {
            Displayer.window.close();
        }
    });

    if (!confirmOverriden) {
        const originalConfirm = window.confirm;
        window.confirm = function (msg) {
            return FindWindowConfirm(msg, originalConfirm);
        };
        confirmOverriden = true;
    }

    return Displayer;
}
