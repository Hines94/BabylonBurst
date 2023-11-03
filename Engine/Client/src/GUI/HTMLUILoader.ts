import { AsyncImageDescription } from "@engine/AsyncAssets";
import { AsyncArrayBufferLoader } from "@engine/Utils/StandardAsyncLoaders";
import { decode } from "@msgpack/msgpack";

export async function SetupLoadedHTMLUI(element: HTMLElement) {
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
        const UIElements = ele.querySelectorAll("div[data-uipath]");
        for (var i = 0; i < UIElements.length; i++) {
            const div = UIElements[i];
            if ((div as any).loadedIn !== undefined) {
                continue;
            }
            const path = div.getAttribute("data-uipath");
            const filename = div.getAttribute("data-uifilename");

            const loader = new AsyncArrayBufferLoader(path, filename);
            await loader.getWaitForFullyLoadPromise();
            const data = decode(loader.rawData);
            div.innerHTML = data as string;
            //Recursive load
            await setupElementUI(div as HTMLElement);
        }
    }
}
