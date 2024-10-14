_PRIORITY CRITICAL_
- [ ] Autofill name inputs with player.displayName (cardgames.io)
- [ ] Dockerfile
- [ ] Review if nested children hitpoints are fixed in SDK, otherwise we cannot support the screen being a child
- [ ] Detect links to https://decentraland.org/play/?position=106%2C50 to execute sdk7 teleport instead
- [ ] Detect embedded youtuve to open as external li (or can I play a plane with texture with video ? https://rapidapi.com/aidangig/api/youtube-to-mp4 ?)
- [ ] Continue README

_PRIORITY MAJOR_
- [ ] Video or documentation how to deploy your own server.
- [ ] //TODO only do if it navgigates
- [ ] Send/set updates in portions of then screen: pixelmatch, blink-diff, resemblejs or own optimized algo, e.g. first checking different between 10 px points
  -> always 2 planes, 1 for portion change, other for previous state, unless whole screen is changed.
- [ ] Add usage statistics ? with database connection option ?
- [ ] Review encoding binary, option of pupetteeer takeScreenshot, or try own encoding.


_PRIORITY MEDIUM_
- [ ] Cache textures when scrolling, optimizations
- [ ] Version matching server/client -> show warning otherwise

_PRIORITY MINOR_
- [ ] Review if to control locked use server side
- [ ] Add sound effects (remote resources?)


_MAYBE_
- [ ] Detect password input to allow show a danger message to the user but allow text input
- [ ] mousedown-> hover, mouseup -> release/click
- [ ] Try to inject script to show effect on clicks when DOMElement (a,button,etc.) with mouse listener is clicked
- [ ] Rust server using rust-headless-chrome
- [ ] Try https://v0.dev/

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
- [x] alternative approach: loop of screenshots
- [x] fix decentralnad.org create tab
- [x] why decentraland.org events page is not fully captured
- [x] evaluate alternatives: Chrome DevTools Protocol ,Headless Chrome with HTTP API, selenium, playwright
- [x] avoid open external link for users not using the browser
- [x] Manage several rooms - [x] Review: Allow more than 1 instance.
- [x] To avoid repeated requests for same state, possible solution: Hash images?
- [x] Fix different sizes and positions of the screen
- [x] Fix different rotations of the screen
- [x] When disconnected: hide page or show overlay
- [x] Review reconnection
- [x] Isolated test of a big vertical screenshot as texture with UV -> test-scenes/test-uv
- [x] It's not possible: Try base64 socket transfer and use as texture
- [x] Refactor into a component
- [x] Review if it should include top and bottom bar within width/height: NO
- [x] Use 1 plane for back+topBar+bottomBar + logo in back "Virtual Browser powered by Decentraland DAO"
- [x] Make it a SDK component library
- [x] Publish the library in npm
- [x] Add Home button + history b/f (remote srpitesheet?)
- [x] Add scroll bar with buttons
- [x] Netscape navigator appearance: in spritesheet, customizable.
- [x] Add a logs / monitoring page or modify the one from colyseus/fork