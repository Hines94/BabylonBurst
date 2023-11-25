import { ConvertDataBackToCSV } from "@BabylonBurstClient/Utils/DataToCSV";
import { OpenDatasheet, SetupDatasheet as SetupDatasheet } from "../../Datasheets/DatasheetEditor";
import { ContentItem } from "../ContentItem";
import { ContentBrowserSpecificItem } from "./ContentBrowserSpecificItemHTML";
import { AsyncStringLoader } from "@BabylonBurstCore/Utils/StandardAsyncLoaders";

export class ContentBrowserDatasheetHTML extends ContentBrowserSpecificItem {
    declare ourItem: ContentItem;

    override getContextMenuItems(): {
        name: string;
        callback: () => void;
    }[] {
        return super.getContextMenuItems().concat([
            {
                name: "Clone",
                callback: () => {
                    this.createClone();
                },
            },
        ]);
    }

    protected cleanupItem(): void {
        throw new Error("Method not implemented.");
    }

    protected override async createClone(): Promise<void> {
        await this.loadContentDatasheet();
    }

    performPrimaryMethod(): void {
        this.openCSVPanel();
    }

    protected async openCSVPanel() {
        if (!this.ourItem.data) {
            await this.loadContentDatasheet();
        }
        OpenDatasheet(JSON.parse(this.ourItem.data), this.ourItem.name + "_Datasheet", (newData: any) => {
            //Request save
            this.ourItem.data = JSON.stringify(newData);
            this.ourItem.SaveItemOut();
        });
    }

    override async drawInspectorInfo(): Promise<void> {
        await super.drawInspectorInfo();
        const inspector = this.ourSelectable.ownerDocument.getElementById("InspectorPanel") as HTMLElement;

        await this.loadContentDatasheet();

        const ourData = JSON.parse(this.ourItem.data);
        const rows = Object.keys(ourData);
        const cols = Object.keys(ourData[rows[0]]);

        //Size
        const numRows = this.ourSelectable.ownerDocument.createElement("p");
        numRows.innerText = "Num Rows: " + rows.length;
        inspector.appendChild(numRows);

        const numCols = this.ourSelectable.ownerDocument.createElement("p");
        numCols.innerText = "Num Cols: " + cols.length;
        inspector.appendChild(numCols);

        const sizeString = this.ourSelectable.ownerDocument.createElement("p");
        sizeString.innerText = "Total Entries: " + rows.length * cols.length;
        inspector.appendChild(sizeString);

        //Download datasheet as CSV
        const downloadCSV = this.ourSelectable.ownerDocument.createElement("button");
        downloadCSV.style.pointerEvents = "all";
        downloadCSV.innerText = "Download CSV";
        downloadCSV.addEventListener("click", () => {
            const blob = new Blob([ConvertDataBackToCSV(JSON.parse(this.ourItem.data), "ID")], { type: "text/csv" });
            const downloadUrl = URL.createObjectURL(blob);

            const link = this.ourSelectable.ownerDocument.createElement("a");
            link.href = downloadUrl;
            link.download = this.ourItem.name + ".csv";

            // Trigger the download
            link.click();
        });
        inspector.appendChild(downloadCSV);
    }

    protected async loadContentDatasheet() {
        if (this.ourItem.data) {
            return;
        }
        const loader = new AsyncStringLoader(this.ourItem.parent.getItemLocation(), this.ourItem.GetSaveName());
        await loader.getWaitForFullyLoadPromise();
        this.ourItem.data = loader.rawData;
    }
}
