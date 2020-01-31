const test = () => {
  process.stderr.write('loading greenworks\n')
  console.log('loading greenworks');
  let greenworks;

  try {
    greenworks = require('./greenworks');
  } catch (e) {
    console.log('Error on requiring greenworks', e);
    return;
  }

  if (!greenworks) {
    console.log('No greenworks found');
  } else {
    try {
      greenworks.init();
      console.log('Steam API initialized successfully.');
    } catch (e) {
      console.log('Error on initializing steam API.', e);

      /*
      console.log('Cloud enabled: ' + greenworks.isCloudEnabled());
      console.log('Cloud enabled for user: ' + greenworks.isCloudEnabledForUser());

      greenworks.on('steam-servers-connected', function () {
        console.log('connected');
      });
      greenworks.on('steam-servers-disconnected', function () {
        console.log('disconnected');
      });
      greenworks.on('steam-server-connect-failure', function () {
        console.log('connected failure');
      });
      greenworks.on('steam-shutdown', function () {
        console.log('shutdown');
      });

      greenworks.saveTextToFile('test_file.txt', 'test_content',
        function () {
          console.log('Save text to file successfully');
        },
        function (err) {
          console.log('Failed on saving text to file');
        });

      greenworks.readTextFromFile('test_file.txt', function (message) {
        console.log('Read text from file successfully.');
      }, function (err) {
        console.log('Failed on reading text from file');
      });

      greenworks.getCloudQuota(
        function () {
          console.log('Getting cloud quota successfully.');
        },
        function (err) {
          console.log('Failed on getting cloud quota.');
        });
      // The ACH_WIN_ONE_GAME achievement is available for the sample (id:480) game
      greenworks.activateAchievement('ACH_WIN_ONE_GAME',
        function () {
          console.log('Activating achievement successfully');
        },
        function (err) {
          console.log('Failed on activating achievement.');
        });

      greenworks.getNumberOfPlayers(
        function (a) {
          console.log('Number of players ' + a);
        },
        function (err) {
          console.log('Failed on getting number of players');
        });

      console.log('Numer of friends: ' +
                  greenworks.getFriendCount(greenworks.FriendFlags.Immediate));
      var friends       = greenworks.getFriends(greenworks.FriendFlags.Immediate);
      var friends_names = [];
      for (var i = 0; i < friends.length; ++i)
        friends_names.push(friends[ i ].getPersonaName());
      console.log('Friends: [' + friends_names.join(',') + ']');
       */
    }
  }
};

module.exports = test;
