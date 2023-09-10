import { decode } from "@msgpack/msgpack";
import { OpenMaterial } from "../../Materials/MaterialEditor";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { GetFullNameOfObject } from "../ContentItem";
import { AsyncArrayBufferLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";

export class ContentBrowserMaterialHTML extends ContentBrowserItemHTML {


    protected performPrimaryMethod(): void {
        this.openMaterial();
    }

    async openMaterial() {
        await this.loadContentMaterial();
        OpenMaterial(decode(this.ourItem.data), this.ourItem.readableName, (newData: any) => {
            //Request save
            this.ourItem.data = newData;
            this.ourContentHolder.storageBackend.saveItem(this.ourItem);
        });
    }

    protected async loadContentMaterial() {
        if (this.ourItem.data) {
            return;
        }
        const ourPath = GetFullNameOfObject(this.ourItem).replace(".zip", "");
        const loader = new AsyncArrayBufferLoader(ourPath, 0);
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }
}
