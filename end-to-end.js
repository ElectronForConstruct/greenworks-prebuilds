const electronDownload = require('./electronDownloader');

electronDownload('5.0.1', 'x64').then(out => {
    console.log(out);
    if (out.stdout.includes('Error on initializing steam API. Error: Steam initialization failed. Steam is not running.')) {
        console.log('it\'s working!');
        return true;
    } else {
        console.log('it failed!');
    }
});
