let inputField = document.querySelector("input#input-url");
let outputField = document.querySelector("input#output-url");
let convertButton = document.querySelector("button#convert");
let copyButton = document.querySelector("button#copy");
let historySection = document.querySelector("#history");
let historySectionList = historySection.querySelector(".list");

let oldCombinedHistoryJson = "";
var converting = false;

let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createHistoryItem(item) {
    const itemElement = document.createElement("div");
    itemElement.classList.add("history-item");

    const time = document.createElement("p");
    time.classList.add("history-time");
    time.innerText = DateFormat.format.prettyDate(new Date(item["time"]));

    const long = document.createElement("p");
    long.classList.add("long-link");
    long.innerText = item["url"];

    const title = document.createElement("p");
    title.classList.add("link-title");
    title.innerText = item["title"];

    const short = document.createElement("input");
    short.classList.add("short-link");
    short.type = "text";
    short.id = `short-link_${item["shortUrl"].replace(
        "https://url.feli.page/link/",
        ""
    )}`;

    const buttons = document.createElement("div");
    buttons.classList.add("buttons");

    const copyButton = document.createElement("button");
    copyButton.setAttribute("data-clipboard-target", `#${short.id}`);
    copyButton.innerText = "Copy";
    copyButton.addEventListener("click", () =>
        changeInnerTextTemporary(copyButton, "Copied", 2500)
    );
    var clipboard = new ClipboardJS(copyButton);

    const removeButton = document.createElement("button");
    removeButton.innerText = "Remove";
    removeButton.addEventListener("click", () => {
        removeFromHistory(item["shortUrl"], item["from"] == "extension");
        changeInnerTextTemporary(removeButton, "Removing", 25000);
    });

    buttons.append(copyButton, removeButton);

    short.value = item["shortUrl"];
    itemElement.append(time);
    if (item["title"]) itemElement.append(title);
    itemElement.append(long, short, buttons);
    return itemElement;
}

function renderHistory() {
    var webAppHistory = JSON.parse(window.localStorage.history || "[]");
    var extensionHistory = JSON.parse(
        window.localStorage.extensionHistory || "[]"
    );

    webAppHistory = webAppHistory.map((history) => {
        history["from"] = "webApp";
        return history;
    });

    extensionHistory = extensionHistory.map((history) => {
        history["from"] = "extension";
        return history;
    });

    var combinedHistory = [...webAppHistory, ...extensionHistory];
    if (combinedHistory.length > 0) {
        historySection.hidden = false;
        historySection.nextElementSibling.hidden = false;
    } else {
        historySection.hidden = true;
        historySection.nextElementSibling.hidden = true;
    }
    combinedHistory.sort((a, b) => {
        const key = "time";
        if (a[key] < b[key]) return 1;
        if (a[key] > b[key]) return -1;
        return 0;
    });

    let newCombinedHistoryJson = JSON.stringify(combinedHistory);
    if (newCombinedHistoryJson == oldCombinedHistoryJson) return;
    oldCombinedHistoryJson = newCombinedHistoryJson;
    historySectionList.innerHTML = "";
    for (var item of combinedHistory) {
        historySectionList.append(createHistoryItem(item));
    }
}

async function saveToHistory(url, shortUrl, title) {
    var webAppHistory = JSON.parse(window.localStorage.history || "[]");
    webAppHistory.unshift({
        url,
        shortUrl,
        title,
        time: Date.now(),
    });
    window.localStorage.history = JSON.stringify(webAppHistory);
}

async function removeFromHistory(shortUrl, extension = false) {
    if (!extension) {
        var webAppHistory = JSON.parse(window.localStorage.history || "[]");
        webAppHistory = webAppHistory.filter((e) => e["shortUrl"] != shortUrl);
        window.localStorage.history = JSON.stringify(webAppHistory);
    } else {
        var removalList = JSON.parse(
            window.localStorage.extensionHistoryRemoval || "[]"
        );
        removalList.push(shortUrl);
        window.localStorage.extensionHistoryRemoval = JSON.stringify(
            removalList
        );
    }
}

async function convert() {
    if (converting) return;
    converting = true;
    convertButton.disabled = true;
    copyButton.disabled = true;
    let url = inputField.value;
    outputField.value = "Loading";
    outputField.value = await convertURL(url, "");
    convertButton.disabled = false;
    copyButton.disabled = false;
    converting = false;
}

var clipboard = new ClipboardJS(copyButton);
copyButton.addEventListener("click", () =>
    changeInnerTextTemporary(copyButton, "Copied", 2500)
);

async function convertURL(link, title) {
    try {
        let response = await fetch(
            "https://url.feli.page/api/urlShortener?apiKey=feli-page",
            {
                method: "GET",
                headers: {
                    "domain-uri-prefix": "https://url.feli.page/link",
                    "request-link": link,
                    "request-type": "UNGUESSABLE",
                    "social-title": title,
                    "social-description": link,
                },
            }
        );
        let json = await response.json();
        console.log(json);
        if (json["data"] && json["data"]["shortLink"]) {
            await saveToHistory(link, json["data"]["shortLink"], "");
            await renderHistory();
            return json["data"]["shortLink"];
        }
    } catch (error) {}
    return "Error";
}

async function changeInnerTextTemporary(element, text, duration) {
    var originalText = element.innerText;
    element.innerText = text;
    await sleep(duration);
    if (element.innerText == text) element.innerText = originalText;
}

convertButton.addEventListener("click", convert);

renderHistory();
setInterval(renderHistory, 100);
