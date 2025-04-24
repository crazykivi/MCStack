// terminalCapture.js

const originalLog = console.log;

function captureTerminal(broadcastFunction) {
  console.log = (...args) => {
    const message = args.join(" ");
    originalLog(...args);
    broadcastFunction(message);
  };
}

module.exports = captureTerminal;