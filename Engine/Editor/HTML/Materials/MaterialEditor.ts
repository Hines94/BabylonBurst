import { ShowToastNotification } from "@BabylonBurstClient/HTML/HTMLToastItem";
import { OpenNewWindow } from "@BabylonBurstClient/HTML/HTMLWindowManager";
import { GetMaterialDescriptions } from "@BabylonBurstClient/Materials/EngineMaterialDescriptions"
import { MateralDescription } from "@BabylonBurstClient/Materials/MaterialDescription";
import { bindEditorMaterialParamSetupCallbacks } from "./EditorMaterialParamSetups";
import { encode } from "@msgpack/msgpack";

//TODO: Create option without ability to change/save?
export async function OpenMaterial(originalData: any, materialName: string, callback: (newData: any) => void) {
    bindEditorMaterialParamSetupCallbacks();
    const friendlyName = materialName;
    const Displayer = OpenNewWindow(materialName, "EditorSections/MaterialDisplayer", "Material " + friendlyName);
    if (!Displayer) {
        return;
    }
    const displayerElement = await Displayer.loadingElement;
    displayerElement.querySelector("#MaterialName").innerHTML = "Material Instance: " + friendlyName;
    const modifyData = SetupMaterial(displayerElement, originalData,callback);
    const saveButton = displayerElement.querySelector("#MaterialSave");
    saveButton.addEventListener("click", () => {
        console.log(modifyData)
        callback(encode(modifyData));
        ShowToastNotification("Saved Material", 3000, Displayer.window.document);
    });
}
function SetupMaterial(displayerElement: HTMLDivElement, originalData: any, callback: (newData: any) => void) : any {
    const newData = JSON.parse(JSON.stringify(originalData));
    const materialDescription = GetMaterialDescriptions();

    //Setup datalist
    const datalist = displayerElement.ownerDocument.createElement("datalist");
    datalist.id = "_MaterialShaderOptions_";
    materialDescription.forEach(m=>{
        const opt = datalist.ownerDocument.createElement("option");
        opt.value = m.constructor.name;
        datalist.appendChild(opt);
    })
    displayerElement.appendChild(datalist);

    //Setup already selected shader?
    const existing = materialDescription.find((val:MateralDescription)=>val.constructor.name === originalData["MaterialShaderType"]);
    if(existing) {
        SetupForShader(existing,displayerElement,newData);
    }
    
    //Setup shader input
    const shaderSelect = displayerElement.querySelector('#MaterialShaderType') as HTMLInputElement;
    shaderSelect.value = newData["MaterialShaderType"];
    shaderSelect.addEventListener('change',()=>{
        const selected = shaderSelect.value;
        const option = Array.from(datalist.querySelectorAll('option')).find(opt => opt.value === selected);
        if(option) {
            SetupForShader(materialDescription.find((val:MateralDescription)=>val.constructor.name === selected),displayerElement,newData);
            ShowToastNotification("Changed Shader: " + selected, 3000, displayerElement.ownerDocument);
            newData["MaterialShaderType"] = selected;
        }
    })
    return newData;
}

function SetupForShader(shader:MateralDescription, displayerElement:HTMLDivElement, newData:any) {
    const dataTable = displayerElement.querySelector("#data-table");
    while(dataTable.firstChild){
        dataTable.firstChild.remove();
    }
    
    const params = shader.GetPossibleMaterialParameters();
    const paramNames = Object.keys(params);
    paramNames.forEach(p=>{
        const row = displayerElement.ownerDocument.createElement("tr");
        dataTable.appendChild(row);
        const name = displayerElement.ownerDocument.createElement("td");
        name.innerText = p;
        row.appendChild(name);

        const editorData = displayerElement.ownerDocument.createElement("td");
        params[p].SetupEditorInputValue(editorData,newData,p);
        row.appendChild(editorData);
    })
}

