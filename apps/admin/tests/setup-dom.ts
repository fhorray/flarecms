import { GlobalWindow } from 'happy-dom';
const window = new GlobalWindow();

// Make sure global variables match what React Testing Library expects
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;
global.Event = window.Event;
global.KeyboardEvent = window.KeyboardEvent;
global.MouseEvent = window.MouseEvent;
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
