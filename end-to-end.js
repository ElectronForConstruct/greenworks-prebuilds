const nwDownload = require('./nwjsDownloader');

nwDownload('0.42.0', 'x64').then(out => {
    console.log(out);
    if (out.stdout.includes('Error on initializing steam API. Error: Steam initialization failed. Steam is not running.')) {
        console.log('it\'s working!');
        return true;
    } else {
        console.log('it failed!');
    }
});
