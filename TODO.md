_PRIORITY CRITICAL_
- [ ] Detect when a link opens a new tab -> ¿ openExternalLink ?
- [ ] Do screenshots at intervals? add date to screenshots?

_PRIORITY MAJOR_
- [ ] waitForNetworkIdle add timeout with error handling
- [ ] Allow to navigate history forward/back ¿ keys 1 & 2 ?
- [ ] Add scroll bar
- [ ] Refactor into a component


_PRIORITY MEDIUM_
- [ ] Handle infinite scroll
- [ ] Lock use for user for 30 seconds ? -> Say in satus bar who is using
- [ ] Prepare a production deployment so people can test it
- [ ] Try to inject script to show effect on clicks when DOMElement (a,button,etc.) with mouse listener is clicked

_COMPLETED_
- [x] Add spinner loading
- [x] Add top status bar with room.state.url (black/white text)
- [x] Add bottom status bar with other room state data (back/white text)
- [x] For now to avoid infinite scroll issue, set a maximum scroll screenshots
- [x] FIX: Handle url changes during infinite scroll: cancel previous takeScreenshots process and start over. 
- [x] REVIEW: What happens if after a click, fullHeight changes?
- [x] REVIEW: After making click on marketplace from governance, I still see an api call to
    governance screenshot