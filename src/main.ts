import { EMessage } from "../scripts/messageActions.js";
import { Client, Activity } from "./discordActivity/index.js";

const PTNETURL: string = "https://petain.net/";
var petainTab: chrome.tabs.Tab | undefined = undefined;

var bIsReady: boolean = false;

var activity_manager = new Client(); 

activity_manager.on('ready', async () => {
    console.log("Ready to send media info");
    bIsReady = true;
})

function isPetainOpen(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
            /*tabs.forEach(tab => {
                console.log("Tab: " + tab.id + " -> " + tab.url + " is active ? " + tab.active);
            })*/

            const tab: chrome.tabs.Tab | undefined = tabs.find(tab => tab.url && tab.url.includes(PTNETURL));
            if (!tab || !tab.url) {
                console.log("isPetainOpen() -> No tab found");
                resolve(false);
                return;
            }
            //console.log("isPetainOpen() -> Tab found: " + tab.url);
            petainTab = tab;
            resolve(true);
        });
    });
}

function isMediaPlaying(): boolean {
    if (!petainTab) return false;
    if (!petainTab.audible) return false;

    return petainTab.audible;
}

async function CheckAndRetrieveMediaInfo(): Promise<void> {

    var bIsOpen: boolean = await isPetainOpen();

    //console.log("CheckAndRetrieveMediaInfo() -> Petain is open: " + bIsOpen);

    if (!bIsOpen) return;

    //console.log("CheckAndRetrieveMediaInfo() -> Petain is playing: " + isMediaPlaying());

    if (!isMediaPlaying()) return;
}

setInterval(CheckAndRetrieveMediaInfo, 5000);

async function HandleMediaInfo(data: any, event: string): Promise<void> {

    console.log("HandleMediaInfo() -> Event: " + event);
    console.log("HandleMediaInfo() -> Data: " + JSON.stringify(data));

    var encoded_image = encodeURI(data.src.replace(data.src.split("/")[5], "cover.jpg"))

    var activity = new Activity("Petain.net", 2)
        .setDetails(data.title)
        .setState(data.artist)
        .setLargeImage(encoded_image,
            data.album)

        .setTimestamps(data.startedAt, data.endAt);

        console.log("HandleMediaInfo() -> Activity: " + JSON.stringify(activity));

    switch (event) {
        case 'play':
            activity_manager.setActivity(activity);
            break;
        case 'pause':
            activity_manager.clearActivity();
            break;
        case 'stop':
            activity_manager.clearActivity();
            break;
    }

}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("[MESSAGE LISTENER] -> Message received: " + message.msg);

    switch (message.msg) {
        case EMessage.CHECK_PETAIN:
            isPetainOpen().then((bIsOpen) => {
                sendResponse(bIsOpen);
            });
            return true;
        case EMessage.MEDIA_INFO:
            console.log("MEDIA_INFO -> Received");
            if(bIsReady) {
                await HandleMediaInfo(message.song_data, message.event);
                sendResponse(true);
            } else sendResponse(false);
            return true;
    }
});
  