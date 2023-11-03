import { AsyncImageDescription } from "@engine/AsyncAssets";
import { AsyncArrayBufferLoader } from "@engine/Utils/StandardAsyncLoaders";
import { decode } from "@msgpack/msgpack";



export async function SetupLoadedHTMLUI(element:HTMLElement) {
    console.log("TODO: Load in linked HTML Elements")

    const UIElements = element.querySelectorAll('div[data-uipath]');
    
    for(var i = 0; i < UIElements.length;i++) {
        const div = UIElements[i];
        const path = div.getAttribute('data-uipath');
        const filename = div.getAttribute('data-uifilename');
        
        const loader = new AsyncArrayBufferLoader(path,filename);
        await loader.getWaitForFullyLoadPromise();
        const data = decode(loader.rawData);
        div.innerHTML = data as string;
        //tODO: Recursive load on this?
      };


    //Load images
    element.querySelectorAll('div[data-bgpath]').forEach(div => {
        const path = div.getAttribute('data-bgpath');
        const filename = div.getAttribute('data-bgfilename');
        const hasAlpha = div.getAttribute('data-bghasalpha') === 'true';
        
        const asyncImage = new AsyncImageDescription(path,filename,hasAlpha);
        asyncImage.SetupDivAsImage(div as HTMLDivElement);
      });
}