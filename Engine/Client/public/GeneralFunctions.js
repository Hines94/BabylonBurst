const injections = {};

async function FetchInjectAdditionalHTML(name, doc = document) {
    //Prevent multiple injections of same!
    if (injections[name] !== undefined) {
        return;
    }
    injections[name] = true;

    // Fetch and inject the context menu HTML
    const response = await fetch(name + ".html");
    const html = await response.text();
    doc.body.insertAdjacentHTML("beforeend", html);

    // Extract and execute script
    const tempDiv = doc.createElement("div");
    tempDiv.innerHTML = html;
    const scripts = tempDiv.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
        const script = doc.createElement("script");
        if (scripts[i].src) {
            script.src = scripts[i].src; // Handle external scripts
        } else {
            script.textContent = scripts[i].textContent;
        }
        doc.body.appendChild(script);
    }
}

function DefineFunctionIfNotExists(functionName, functionDefinition) {
    if (typeof window[functionName] === "undefined") {
        window[functionName] = functionDefinition;
    }
}
