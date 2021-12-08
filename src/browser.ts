/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import * as tableland from './main'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).tableland = tableland  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

console.log("The 'tableland' object is available");

// export default tableland;