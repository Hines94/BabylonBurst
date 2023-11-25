import { AsyncAssetLoader, AsyncDataType } from "@BabylonBurstCore/AsyncAssets";

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text: string): string[][] {
    let p = "",
        row = [""],
        ret = [row],
        i = 0,
        r = 0,
        s = !0,
        l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if ("," === l && s) l = row[++i] = "";
        else if ("\n" === l && s) {
            if ("\r" === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [(l = "")];
            i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
}

export class AsyncCSVLoader extends AsyncAssetLoader {
    data: { [id: string]: { [key: string]: string } } = {};

    GetDataLoadType(): AsyncDataType {
        return AsyncDataType.string;
    }

    async onAsyncDataLoaded(cachedResponse: any): Promise<null> {
        const data = CSVtoArray(cachedResponse);

        if (data.length < 2) {
            console.error("CSV data had less than 2 rows!");
            return null;
        }
        if (data[0].length < 2) {
            console.error("CSV had no stat values in it!");
            return null;
        }

        //Populate item names
        for (var row = 1; row < data.length; row++) {
            if (data[row][0] !== "") {
                this.data[data[row][0]] = {};
            }
        }

        //Populate data for each row
        const rowNames = data[0];
        for (var i = 1; i < rowNames.length; i++) {
            for (var row = 1; row < data.length; row++) {
                if (data[row][0] === "") {
                    continue;
                }
                this.data[data[row][0]][rowNames[i]] = data[row][i];
            }
        }

        return null;
    }
}
