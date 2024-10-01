- Fix Colyseus typescript errors
- When doing click, the scroll is not immediate, then first click fails to navigate.
  solutions:  
  - **when scene scrolls, do the same on server**
  - map all links and positions on the page
  - delay click event
  - Try to do immediate scroll

