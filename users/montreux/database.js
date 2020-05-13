const request = require('request');

class Database {

    _arrayToObject(array) {
        return array.reduce((obj, item) => {
            obj[item.id] = item;
            return obj
        }, {})
    }

    _removeDuplicates(array) {
        return [...new Set(array)]
    }

    constructor(dump) {

        // Store concerts, songs, persons and locations
        this._concerts = this._arrayToObject(dump.concerts);
        this._songs = this._arrayToObject(dump.songs);
        this._persons = this._arrayToObject(dump.persons);
        this._locations = this._arrayToObject(dump.locations);
        this._genres = this._arrayToObject(dump.genres);
        this._instruments = this._arrayToObject(dump.instruments);

        // Generate concerts schema
        Object.keys(this._concerts).forEach(key => {

            let concert = this._concerts[key];

            concert.location = this._locations[concert.location].name;
            concert.genres = concert.genres.map(genre => this._genres[genre].name);
            concert.songs = concert.songs.map(song => this._songs[song]);
            concert.musicians = concert.musicians.map(musician => {
                return {
                    person: this._persons[musician.person],
                    instruments: musician.instruments.map(instrument => this._instruments[instrument].name)
                }
            })

        });

    }

    concertsFromArtist(artist) {
        // Get all concerts related to the artist
        return Object.values(this._concerts).filter(concert => concert.musicians.map(
            musician => musician.person.name).includes(artist)
        )
    }

    instrumentsFromArtist(artist, filteredConcerts=null) {

        // Get concerts to handle
        let concerts = !!filteredConcerts ? filteredConcerts : this._concerts;
        let instruments = concerts.map(concert => concert.musicians.filter(musician => musician.person.name === artist).map(musician => musician.instruments));

        return this._removeDuplicates([].concat.apply([], instruments[0]));

    }

    artistDetails(artist) {

        // Get artist related concerts
        let concerts = this.concertsFromArtist(artist);

        // Extract songs and genres
        let genres = [].concat.apply([], concerts.map(concert => concert.genres));
        let songs = [].concat.apply([], concerts.map(concert => concert.songs.map(song => song.title)));
        let exhibitions = concerts.map(concert => `${concert.location}, ${concert.date}`);

        // Remove duplicates
        genres = this._removeDuplicates(genres);
        songs = this._removeDuplicates(songs);

        // Get instruments
        let instruments = this.instrumentsFromArtist(artist, concerts);

        return {genres: genres, songs: songs, exhibitions: exhibitions, instruments: instruments};

    }

}

exports.Database = Database;

/*request('https://mjf-database.epfl.ch/exports/d9bc43ed77fc1dfcc405ca8598241a4e', (err, res, body) => {

    let dump = JSON.parse(body);

    // Store concerts, songs, persons and locations
    let concerts = arrayToObject(dump.concerts);
    let songs = arrayToObject(dump.songs);
    let persons = arrayToObject(dump.persons);
    let locations = arrayToObject(dump.locations);
    let genres = arrayToObject(dump.genres);
    let instruments = arrayToObject(dump.instruments);

    // Generate concerts schema
    Object.keys(concerts).forEach(key => {

        let concert = concerts[key];

        concert.location = locations[concert.location].name;
        concert.genres = concert.genres.map(genre => genres[genre].name);
        concert.songs = concert.songs.map(song => songs[song]);
        concert.musicians = concert.musicians.map(musician => {
            return {
                person: persons[musician.person],
                instruments: musician.instruments.map(instrument => instruments[instrument].name)
            }
        })

    });

});*/