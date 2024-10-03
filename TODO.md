_PRIORITY CRITICAL_
- [ ] FIX: Handle url changes during infinite scroll: cancel previous takeScreenshots process and start over. 
- [ ] REVIEW: After making click on marketplace from governance, I still see an api call to governance screenshot

_PRIORITY MAJOR_
- [ ] waitForNetworkIdle add timeout with error handling
- [ ] Allow to navigate history forward/back ¿ keys 1 & 2 ?
- [ ] Add scroll bar
- [ ] Detect when a link opens a new tab -> ¿ openExternalLink ?
- [ ] Refactor into a component

_PRIORITY MEDIUM_
- [ ] Handle infinite scroll
- [ ] Lock use for user for 30 seconds ? -> Say in satus bar who is using
- [ ] Prepare a production deployment so people can test it

_COMPLETED_
- [x] Add spinner loading
- [x] Add top status bar with room.state.url (black/white text)
- [x] Add bottom status bar with other room state data (back/white text)
- [x] For now to avoid infinite scroll issue, set a maximum scroll screenshots