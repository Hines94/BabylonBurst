(function() {
    if(window.___htmlInjectionsForGame___ !== undefined) {
        return;
    }

    window.___htmlInjectionsForGame___ = {};

    window.FetchInjectAdditionalHTML = async function(requestHTML, doc = document) {
        //Prevent multiple injections of same!
        if (___htmlInjectionsForGame___[requestHTML] !== undefined) {
            return;
        }
        ___htmlInjectionsForGame___[requestHTML] = true;

        // Fetch and inject the context menu HTML
        const response = await fetch(requestHTML + ".html");
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

    window.DefineFunctionIfNotExists = function(functionName, functionDefinition) {
        if (typeof window[functionName] === "undefined") {
            window[functionName] = functionDefinition;
        }
    }
})();

