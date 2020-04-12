const path = require('path');
const { uploadAsset } = require('./utils/gh');

uploadAsset(path.join(__dirname, 'index.js'), 'test.js', { id: '22085213' })
  .then((res) => {
    console.log('res', res);
  }).catch((e) => {
    console.log('e', e.response);
    console.log('e', e.request.options.headers);
  });
