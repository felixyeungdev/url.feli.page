let inputField = document.querySelector("input#input-url");
let outputField = document.querySelector("input#output-url");
let convertButton = document.querySelector("button#convert");
let copyButton = document.querySelector("button#copy");
let historySection = document.querySelector("#history");
let historySectionList = historySection.querySelector(".list");

var converting = false;

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
    short.value = item["shortUrl"];
    itemElement.append(time);
    if (item["title"]) itemElement.append(title);
    itemElement.append(long, short);
    return itemElement;
}

function renderHistory() {
    var webAppHistory = JSON.parse(window.localStorage.history || "[]");
    var extensionHistory = JSON.parse(
        window.localStorage.extensionHistory || "[]"
    );
    var combinedHistory = [...webAppHistory, ...extensionHistory];
    if (combinedHistory.length > 0) {
        historySection.hidden = false;
        historySection.nextElementSibling.hidden = false;
    }
    historySectionList.innerHTML = "";
    combinedHistory.sort((a, b) => {
        const key = "time";
        if (a[key] < b[key]) return 1;
        if (a[key] > b[key]) return -1;
        return 0;
    });
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

convertButton.addEventListener("click", convert);
renderHistory();
