const Database = require('../database').Database;
const queries  = require('../queries');
const fs       = require('fs');

// Connect to Montreux database
const driver = new Database();

// Sleep definition
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
};

// Option functions
function getArtistOptions(artist) {
    // Make options queries
    return queries.makeMusicBrainzQuery(artist, false);
}

// Details function
function generateCsv(file, index, callback) {

    let slice = artists.slice(index, index + 100);

    // Get options for each artist
    if(slice.length) {

        console.log(`Processing artists from ${index} to ${index + 100}.`);

        Promise.all(artists.slice(index, index + 100).map(artist => getArtistOptions(artist.name, false))).then(responses => {

            // Parse each response and enrich artist
            responses = responses.map(response => JSON.parse(response));

            responses.forEach((response, i) => {

                let j = i + index;

                artists[j].musicbrainzId = response.artists.length ? response.artists[0].id : '';
                artists[j].musicbrainzName = response.artists.length ? response.artists[0].name : '';
                artists[j].musicbrainzBirthDate = (response.artists.length && !!response.artists[0]['life-span'] && !!response.artists[0]['life-span'].begin) ? response.artists[0]['life-span'].begin : '';

                file.write(Object.values(artists[j]).map(artist => `"${artist}"`).join(',') + '\n');

            });

            sleep(5000).then(() => {
                generateCsv(file, index + 100, callback);
            });

        });
    } else callback();

}

// Get all artists and extract names
let artists = Object.values(driver.artists).map(artist => {

    // Get artist details
    let artistDetails = driver.artistDetails(artist.name);

    return {
        name: artist.name,
        firstName: artist.firstName,
        lastName: artist.lastName,
        stageName: !!artist.stageName ? artist.stageName : '',
        genres: artistDetails.genres.join('; '),
        dates: artistDetails.exhibitions.map(exhibition => exhibition.split(', ')[0]).join('; '),
        places: artistDetails.exhibitions.map(exhibition => exhibition.split(', ')[1]).join('; '),
        instruments: artistDetails.instruments.join('; '),
        musicbrainzId: '',
        musicbrainzName: '',
        musicbrainzBirthDate: ''
    }
});

// Create csv file
let file = fs.createWriteStream('artists.csv', {
    flags: 'w' // 'a' means appending (old data will be preserved)
});

// Generate header
file.write(Object.keys(artists[0]).join(',') + '\n');

// generate CSV
generateCsv(file, 0, () => {
    console.log('Done');
});