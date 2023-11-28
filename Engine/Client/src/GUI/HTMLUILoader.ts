import { AsyncImageDescription } from "@BabylonBurstCore/AsyncAssets";
import { GameEcosystem } from "@BabylonBurstCore/GameEcosystem";
import { AsyncMsgpackLoader } from "@BabylonBurstCore/Utils/StandardAsyncLoaders";

/** Load UI from saved S3 object into a html element */
export async function LoadUIContent(
    awsPath: string,
    filename: string,
    ecosystem: GameEcosystem,
    owningDiv: HTMLElement = undefined,
) {
    var div: HTMLElement;
    if (owningDiv === undefined) {
        div = ecosystem.doc.createElement("div");
        ecosystem.doc.getElementById("GameUI").appendChild(div);
    } else {
        var newdiv = ecosystem.doc.createElement("div");
        owningDiv.appendChild(newdiv);
        div = newdiv;
    }
    const loader = AsyncMsgpackLoader.GetMsgpackLoader(awsPath, filename);
    await loader.getWaitForFullyLoadPromise();
    div.innerHTML = loader.msgpackData as string;
    div.setAttribute("data-uipath", awsPath);
    div.setAttribute("data-uifilename", filename);
    await SetupLoadedHTMLUI(div);
    if (owningDiv !== undefined) {
        owningDiv.innerHTML = div.innerHTML;
        div.remove();
        div = owningDiv;
    }
    return div;
}

const styleScriptsName = "___allBBStyleScripts___";

/** Given an element which has loaded the text content from UI - load this element */
export async function SetupLoadedHTMLUI(element: HTMLElement, bForceReloadStyleFunctions = false) {
    const anyDoc = element.ownerDocument as any;
    if (anyDoc[styleScriptsName] === undefined) {
        anyDoc[styleScriptsName] = {};
    }

    //Force reload all styles? (eg editor when they are changing)
    if (bForceReloadStyleFunctions) {
        const names = Object.keys(anyDoc[styleScriptsName]);
        for (var i = 0; i < names.length; i++) {
            const objName = names[i];
            anyDoc[styleScriptsName][objName].remove();
        }
        anyDoc[styleScriptsName] = {};
    }
    const allStyleScripts = anyDoc[styleScriptsName];

    //Load other UI
    await setupElementUI(element);

    //Load images
    element.querySelectorAll("div[data-bgpath]").forEach(div => {
        const path = div.getAttribute("data-bgpath");
        const filename = div.getAttribute("data-bgfilename");
        const hasAlpha = div.getAttribute("data-bghasalpha") === "true";

        const asyncImage = new AsyncImageDescription(path, filename, hasAlpha);
        asyncImage.SetupDivAsImage(div as HTMLDivElement);
    });

    //Setup an element's UI - recursive loading
    async function setupElementUI(ele: HTMLElement) {
        const eleName = ele.getAttribute("data-uipath") + "_" + ele.getAttribute("data-uifilename");
        if (allStyleScripts[eleName] !== undefined) {
            //Already loaded - remove all non inlined styles/scripts
            const styleAndScriptElements = ele.querySelectorAll(
                "style:not([data-inlineMe='true']), script:not([data-inlineMe='true'])",
            );
            for (var e = 0; e < styleAndScriptElements.length; e++) {
                styleAndScriptElements[e].remove();
            }
        } else {
            //First one - move all styles/scripts
            allStyleScripts[eleName] = ele.ownerDocument.createElement("div");
            const styleAndScriptElements = ele.querySelectorAll(
                "style:not([data-inlineMe='true']), script:not([data-inlineMe='true'])",
            );
            for (var e = 0; e < styleAndScriptElements.length; e++) {
                allStyleScripts[eleName].appendChild(styleAndScriptElements[e]);
            }
            ele.ownerDocument.body.appendChild(allStyleScripts[eleName]);
        }

        const UIElements = ele.querySelectorAll("div[data-uipath]");
        for (var i = 0; i < UIElements.length; i++) {
            const div = UIElements[i];
            if ((div as any).loadedIn !== undefined) {
                continue;
            }
            const path = div.getAttribute("data-uipath");
            const filename = div.getAttribute("data-uifilename");

            const loader = AsyncMsgpackLoader.GetMsgpackLoader(path, filename);
            await loader.getWaitForFullyLoadPromise();
            div.innerHTML = loader.msgpackData as string;
            //Recursive load
            await setupElementUI(div as HTMLElement);
        }
    }
}
