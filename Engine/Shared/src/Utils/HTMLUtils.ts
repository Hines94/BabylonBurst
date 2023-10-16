
export type innerOuterPanelReturn = {innerPanel:HTMLDivElement,outerPanel:HTMLDivElement,button:HTMLButtonElement};

export function GenerateInnerOuterPanelWithMinimizer(doc:Document):innerOuterPanelReturn {
    const outerPanel = doc.createElement("div");
    outerPanel.style.position = "relative";
    const innerPanel = doc.createElement("div");
    const closer = doc.createElement("button");
    closer.innerText = " _ ";
    closer.style.borderRadius = "2px";
    closer.style.padding = "5px";
    closer.style.paddingRight = "10px";
    closer.style.paddingLeft = "10px";
    closer.addEventListener("click",()=>{
        if(innerPanel.classList.contains("hidden")) {
            innerPanel.classList.remove("hidden");
        } else {
            innerPanel.classList.add("hidden");
        }
    })
    const closerContainer = doc.createElement("div");
    closerContainer.style.position = "absolute";
    closerContainer.style.right = "10px";
    closerContainer.style.top = "10px";
    closerContainer.style.padding = "5px";
    closerContainer.appendChild(closer);
    outerPanel.appendChild(closerContainer);
    outerPanel.appendChild(innerPanel);
    innerPanel.innerText = "test";
    return {innerPanel:innerPanel,outerPanel:outerPanel,button:closer};
}