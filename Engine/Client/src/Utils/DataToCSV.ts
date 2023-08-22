function arrayToCSV(data: string[][], delimiter = ","): string {
    return data
        .map(row => {
            return row
                .map(cell => {
                    if (cell.includes(delimiter) || cell.includes("\n") || cell.includes('"')) {
                        return '"' + cell.replace(/"/g, '""') + '"';
                    }
                    return cell;
                })
                .join(delimiter);
        })
        .join("\n");
}

export function ConvertDataBackToCSV(data: { [id: string]: { [key: string]: string } }, titleRowName: string): string {
    const RowNames = Object.keys(data);
    var keyNames = Object.keys(data[RowNames[0]]);
    keyNames = keyNames.filter(a => {
        return a !== titleRowName;
    });
    //Create title row
    const titleRow = [];
    titleRow.push(titleRowName);
    for (var i = 0; i < keyNames.length; i++) {
        titleRow.push(keyNames[i]);
    }
    //Create all data rows
    const allRows = [titleRow];
    for (var i = 0; i < RowNames.length; i++) {
        const dataRow = [];
        const itemName = RowNames[i];
        dataRow.push(itemName);
        for (var c = 0; c < keyNames.length; c++) {
            const keyName = keyNames[c];
            if (data[itemName][keyName] === undefined) {
                console.warn("Item " + itemName + " does not have key for " + keyName);
            }
            dataRow.push(data[itemName][keyName]);
        }
        allRows.push(dataRow);
    }
    return arrayToCSV(allRows);
}
