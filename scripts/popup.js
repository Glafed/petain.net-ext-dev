import {
  EMessage
} from "./messageActions.js";

document.addEventListener("DOMContentLoaded", () => {

    chrome.runtime.sendMessage({msg: EMessage.CHECK_PETAIN}, (response) => {

      console.log('Response from background:', response);

      if (response) {
        document.getElementById('url').innerText = 'Petain.net is open';
      } else {
        document.getElementById('url').innerText = 'Petain.net is not open';
      }
    });
})