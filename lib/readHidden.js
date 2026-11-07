function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      return reject(new Error('This command requires an interactive terminal to enter passwords securely.'));
    }

    let value = '';
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    const restore = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
    };
    const onData = chunk => {
      const key = chunk.toString('utf8');
      if (key === '\u0003') {
        restore();
        reject(new Error('Operation cancelled.'));
      } else if (key === '\r' || key === '\n') {
        restore();
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else if (!key.startsWith('\u001b')) {
        value += key;
      }
    };
    input.on('data', onData);
  });
}

module.exports = { readHidden };
