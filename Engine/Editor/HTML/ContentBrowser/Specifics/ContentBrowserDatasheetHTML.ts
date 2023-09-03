import { AsyncStringLoader } from "@BabylonBurstClient/Utils/StandardAsyncLoaders";
import { ConvertDataBackToCSV } from "@BabylonBurstClient/Utils/DataToCSV";
import { OpenDatasheet, SetupDatasheet as SetupDatasheet } from "../../Datasheets/DatasheetEditor";
import { ContentBrowserItemHTML } from "../ContentBrowserItemHTML";
import { GetFullNameOfObject } from "../ContentItem";

export class ContentBrowserDatasheetHTML extends ContentBrowserItemHTML {
    protected override getContextMenuItems(): {
        name: string;
        callback: () => void;
    }[] {
        return [
            {
                name: "Clone",
                callback: () => {
                    this.createClone();
                },
            },
        ].concat(super.getContextMenuItems());
    }

    protected override async createClone(): Promise<void> {
        await this.loadContentDatasheet();
        super.createClone();
    }

    protected performPrimaryMethod(): void {
        this.openCSVPanel();
    }

    protected async openCSVPanel() {
        if (!this.ourItem.data) {
            await this.loadContentDatasheet();
        }
        OpenDatasheet(JSON.parse(this.ourItem.data), this.ourItem.readableName + "_Datasheet", (newData: any) => {
            //Request save
            this.ourItem.data = JSON.stringify(newData);
            this.ourContentHolder.storageBackend.saveItem(this.ourItem);
        });
    }

    protected override async drawInspectorInfo(): Promise<boolean> {
        if ((await super.drawInspectorInfo()) === false) {
            return false;
        }
        const inspector = this.ourDiv.ownerDocument.getElementById("InspectorPanel") as HTMLElement;

        await this.loadContentDatasheet();

        const ourData = JSON.parse(this.ourItem.data);
        const rows = Object.keys(ourData);
        const cols = Object.keys(ourData[rows[0]]);

        //Size
        const numRows = this.ourDiv.ownerDocument.createElement("p");
        numRows.innerText = "Num Rows: " + rows.length;
        inspector.appendChild(numRows);

        const numCols = this.ourDiv.ownerDocument.createElement("p");
        numCols.innerText = "Num Cols: " + cols.length;
        inspector.appendChild(numCols);

        const sizeString = this.ourDiv.ownerDocument.createElement("p");
        sizeString.innerText = "Total Entries: " + rows.length * cols.length;
        inspector.appendChild(sizeString);

        //Download datasheet as CSV
        const downloadCSV = this.ourDiv.ownerDocument.createElement("button");
        downloadCSV.style.pointerEvents = "all";
        downloadCSV.innerText = "Download CSV";
        downloadCSV.addEventListener("click", () => {
            const blob = new Blob([ConvertDataBackToCSV(JSON.parse(this.ourItem.data), "ID")], { type: "text/csv" });
            const downloadUrl = URL.createObjectURL(blob);

            const link = this.ourDiv.ownerDocument.createElement("a");
            link.href = downloadUrl;
            link.download = this.ourItem.readableName + ".csv";

            // Trigger the download
            link.click();
        });
        inspector.appendChild(downloadCSV);
    }

    protected async loadContentDatasheet() {
        if (this.ourItem.data) {
            return;
        }
        const ourPath = GetFullNameOfObject(this.ourItem).replace(".zip", "");
        const loader = new AsyncStringLoader(ourPath, 0);
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }
}
