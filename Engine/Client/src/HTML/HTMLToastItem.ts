export function ShowToastNotification(message: string, durationMs = 2000, doc = document, textColor = "white") {
    var toast = doc.getElementById("toast");
    if (!toast) {
        return;
    }
    toast.textContent = message;
    toast.classList.add("visible");
    toast.style.color = textColor;

    setTimeout(function () {
        toast.classList.remove("visible");
    }, durationMs);
}
