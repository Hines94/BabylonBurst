export function ShowNotificationWindow(doc = document): HTMLElement {
    var notification = doc.getElementById("notification");
    if (!notification) {
        return undefined;
    }
    notification.classList.add("visible");
    const inner = notification.querySelector("#notificationInner") as HTMLElement;
    inner.innerHTML = "";
    return inner;
}
