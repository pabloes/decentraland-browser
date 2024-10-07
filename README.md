# Decentraland In-world Browser (experimental)

---

## Table of Contents
- [Introduction](#Introduction)
- [Features](#features)

## Introduction
This project is a Decentraland SDK scene that **embeds a web browser within the virtual environment**.
The browser is executed and rendered from a server, then in Decentraland we can see and interact with it, the method is similar to VNC client/server.

![Image showcasing the virtual browser](https://zeroxwork.com/api/images/user-uploaded-images/e797bafd04abd2829ac3938a241233bfd662726e1f1c9102a51b895fdbb6d06a.png)

## Features
- **Shared session**: multiples players can see the same browser state.
- **User Locking**: When someone uses the browser it's locked for that user for 30 seconds.
- **Link detection** When a browser should open a new TAB, instead a dialog will be shown to navigate out of Decentraland.
- **Multiple instances** We can have different
- **Click interactivity** 
- **Changes detection** It notifies when a change in view has hapenned
- **Compression** Images are encoded for faster transfer
- **Url bar**
- **Status bar**
- **Reconnection** if server is down, the browser will connect automatically when server is back up.

