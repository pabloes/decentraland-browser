_PRIORITY CRITICAL_
- [ ] alternative approach: loop of screenshots
- [ ] fix decentralnad.org create tab
- [ ] why decentraland.org events page is not fully captured
- [ ] evaluate alternatives: Chrome DevTools Protocol ,Headless Chrome with HTTP API, selenium, playwright
- [ ] Isolated test of a big vertical screenshot as texture with UV

_PRIORITY MAJOR_
- [ ] Manage several rooms
- [ ] Each room will manage a tab instead of a browser instance? and the browser will always be open with the server, -> but then how focus at same time? -> queue and rounds?
- [ ] To avoid repeated requests for same state, possible solution: Hash images?

_PRIORITY MEDIUM_
- [ ] Allow to navigate history forward/back ¿ keys 1 & 2 ?
- [ ] Refactor into a component
- [ ] Add scroll bar
- [ ] Add sound effects
- [ ] Try to inject script to show effect on clicks when DOMElement (a,button,etc.) with mouse listener is clicked
- [ ] Improve infinite scroll handling
 
- [ ] Review if to control locked use server side
- [ ] Add a logs / monitoring page or modify the one from colyseus/fork
- [ ] Rust server using rust-headless-chrome

_PRIORITY MINOR_
- [ ] Detect links to https://decentraland.org/play/?position=106%2C50 to execute sdk7 teleport instead
- [ ] Detect embedded youtuve to open as external li (or can I play a plane with texture with video ? https://rapidapi.com/aidangig/api/youtube-to-mp4 ?)

_MAYBE_
- [ ] mousedown-> hover, mouseup -> release/click

_COMPLETED_
- [x] Add spinner loading
- [x] Add top status bar with room.state.url (black/white text)
- [x] Add bottom status bar with other room state data (back/white text)
- [x] For now to avoid infinite scroll issue, set a maximum scroll screenshots
- [x] FIX: Handle url changes during infinite scroll: cancel previous takeScreenshots process and start over. 
- [x] REVIEW: What happens if after a click, fullHeight changes?
- [x] REVIEW: After making click on marketplace from governance, I still see an api call to
    governance screenshot
- [x] Do screenshots at intervals? add date to screenshots?
- [x] Detect when a link opens a new tab -> openExternalLink
- [x] Lock use for user for 30 seconds ? -> Say in satus bar who is using with a timer
- [x] Implement colyseus reconnection
- [x] -> Or better, make it automatic interval -> Add a reconnect/restart button (for when something fails in server, etc.)
- [x] Prepare a production deployment so people can test it
- [x] Review why I cannot access "explore" link (events) on the production test: same for marketplace
- [x] refactor into await tryfn(()=>await waitForNetworkIdle)