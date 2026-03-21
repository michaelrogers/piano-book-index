#!/usr/bin/env node
/**
 * Generate book and song entries for:
 * 1. Library of Easy Piano Classics
 * 2. Alfred's Basic Adult All-in-One Level 1
 * 3. Alfred's Basic Adult All-in-One Level 2
 * 4. Alfred's Basic Adult All-in-One Level 3
 *
 * Sources:
 * - YouTube playlist video data from /tmp/new-playlist-videos.json
 * - Amazon product page song lists (hardcoded below)
 * - Hal Leonard product page song list (hardcoded below)
 *
 * Usage: node scripts/generate-new-books.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function makeSongId(bookId, title) {
  const prefix = bookId.replace(/alfred-adult-aio-/, 'aio').replace(/library-of-easy-piano-classics/, 'lepc');
  return `${prefix}-${slugify(title)}`;
}

function makeSong(bookId, title, composer, genre, pageNumber, difficulty, notes = '') {
  return {
    id: makeSongId(bookId, title),
    title,
    composer: composer || 'Traditional',
    arranger: bookId.startsWith('alfred-adult-aio') ? 'Palmer, Manus, Lethco' : null,
    genre,
    bookId,
    pageNumber: pageNumber || null,
    difficulty,
    youtubeLinks: [],
    notes
  };
}

// ──────────────────────────────────────────────
// New Book Definitions
// ──────────────────────────────────────────────
const NEW_BOOKS = [
  {
    id: 'library-of-easy-piano-classics',
    title: 'Library of Easy Piano Classics',
    series: null,
    seriesLevel: null,
    bookType: 'companion',
    publisher: 'Music Sales America',
    isbn: '978-0825612848',
    coverImage: '/covers/library-of-easy-piano-classics.jpg',
    pageCount: 296,
    description: 'A comprehensive collection of easy piano arrangements of classical masterworks, featuring over 100 pieces from the Baroque, Classical, Romantic, and Modern periods.',
    amazonUrl: 'https://www.amazon.com/dp/0825612845',
    trackListingSource: 'publisher-website'
  },
  {
    id: 'alfred-adult-aio-1',
    title: "Alfred's Basic Adult All-in-One Course Book 1",
    series: "Alfred's Basic Adult Piano Course",
    seriesLevel: 'Level 1',
    bookType: 'lesson',
    publisher: 'Alfred Music',
    isbn: '978-0882848181',
    coverImage: '/covers/alfred-adult-aio-1.jpg',
    pageCount: 160,
    description: 'A complete beginner piano course combining lesson, theory, and solo repertoire in one convenient book. Features folk, classical, and contemporary selections.',
    amazonUrl: 'https://www.amazon.com/dp/0882848186',
    trackListingSource: 'amazon'
  },
  {
    id: 'alfred-adult-aio-2',
    title: "Alfred's Basic Adult All-in-One Course Book 2",
    series: "Alfred's Basic Adult Piano Course",
    seriesLevel: 'Level 2',
    bookType: 'lesson',
    publisher: 'Alfred Music',
    isbn: '978-0882849959',
    coverImage: '/covers/alfred-adult-aio-2.jpg',
    pageCount: 144,
    description: 'Continues the All-in-One approach with more advanced lesson, theory, and solo content. Features classical masterworks and folk songs at the early intermediate level.',
    amazonUrl: 'https://www.amazon.com/dp/0882849956',
    trackListingSource: 'amazon'
  },
  {
    id: 'alfred-adult-aio-3',
    title: "Alfred's Basic Adult All-in-One Course Book 3",
    series: "Alfred's Basic Adult Piano Course",
    seriesLevel: 'Level 3',
    bookType: 'lesson',
    publisher: 'Alfred Music',
    isbn: '978-0739000687',
    coverImage: '/covers/alfred-adult-aio-3.jpg',
    pageCount: 144,
    description: 'The final book in the All-in-One series, featuring intermediate-level lesson, theory, and solo content including classical pieces and original compositions.',
    amazonUrl: 'https://www.amazon.com/dp/0739000683',
    trackListingSource: 'youtube-playlist'
  }
];

// ──────────────────────────────────────────────
// Alfred Level 1 songs (from Amazon product page)
// ──────────────────────────────────────────────
const ALFRED_L1_SONGS = [
  'Alouette', 'Alpine Melody', 'Amazing Grace', 'Au Claire de la Lune', 'Aunt Rhody',
  'Auld Lang Syne', 'Aura Lee', 'The Bandleader', 'Beautiful Brown Eyes',
  'Blow the Man Down!', 'Blues for Wynton Marsalis', 'Brother John', 'Café Vienna',
  'The Can-Can', 'Chasing the Blues Away', 'Chiapanecas', 'Cockles and Mussels',
  'The Cuckoo', 'Day Is Done', 'Dueling Harmonics', 'The Entertainer',
  'A Friend Like You', 'Go Down Moses', 'Good King Wenceslas', 'Good Morning to You!',
  'Good People', 'Got Those Blues', 'Greensleeves', 'Happy Birthday to You!',
  'Harmonica Rock', 'Harp Song', "Here's a Happy Song!", "He's Got the Whole World in His Hands",
  "I'm Gonna Lay My Burden Down", 'Jericho', 'Jingle Bells', 'Joy to the World!',
  'Kum-ba-yah!', 'Largo', 'Lavender\'s Blue', 'Lightly Row', 'Little Brown Jug',
  'Liza Jane', 'London Bridge', 'Lone Star Waltz', 'Love Somebody', 'Lullaby',
  "The Marine's Hymn", 'Mary Ann', 'Merrily We Roll Along', 'Mexican Hat Dance',
  'Michael Row the Boat Ashore', "Money Can't Buy Everything", 'My Fifth',
  'Ode to Joy', 'On Top of Old Smoky', 'O Sole Mio', 'Raisins and Almonds',
  'Rock Along', 'Rockets', "Rockin' Intervals", 'Rock It Away!', 'Scarborough Fair',
  'Shoo Fly Shoo!', 'Skip to My Lou!', 'Standing in the Need of Prayer',
  'The Stranger', 'Tisket a Tasket', 'Waltzing Chords', 'Waltz Time',
  'What Can I Share', 'When the Saints Go Marching In', 'Why Am I Blue?'
];

// ──────────────────────────────────────────────
// Alfred Level 2 songs (from Amazon product page)
// ──────────────────────────────────────────────
const ALFRED_L2_SONGS = [
  "Alexander's Ragtime Band", 'Arkansas Traveler', "Ballin' the Jack",
  'The Battle Hymn of the Republic', 'Black Forest Polka',
  'Black Is the Color of My True Love\'s Hair', 'Bourlesq', 'Brahms Lullaby',
  'Bridal Chorus from "Lohengrin"', 'Calypso Carnival', 'Canon in D',
  'Chorale', 'Circus March', 'Danny Boy', 'Dark Eyes', 'Deep River',
  'Divertimento in D', 'Down in the Valley', 'Etude', 'Farewell to Thee (Aloha Oe)',
  'Fascination', 'Festive Dance', "For He's a Jolly Good Fellow",
  'Frankie and Johnnie', 'Guantanamera', 'Hava Nagila',
  "He's Got the Whole World in His Hands", 'The Hokey-Pokey',
  'The House of the Rising Sun', 'Hungarian Rhapsody No. 2',
  'Introduction and Dance', 'La Bamba', 'La Donna E Mobile', 'La Raspa',
  'Light and Blue', 'Loch Lomond', 'Lonesome Road', "Love's Greeting",
  'The Magic Piper', 'The Marriage of Figaro', 'Mexican Hat Dance',
  'Morning Has Broken', "Musetta's Waltz", 'Night Song',
  "Nobody Knows the Trouble I've Seen", 'Olympic Procession',
  'Overture from "Raymond"', "Plaisir D'Amour", 'Polovetsian Dances',
  'Pomp and Circumstance No. 1', 'The Riddle', 'Rock-a My Soul', 'Sakura',
  'Scherzo', 'Solace', 'Space Shuttle Blues', 'The Streets of Laredo',
  "Swingin' Sevenths", 'Tarantella', 'Theme from Symphony No. 6',
  'Village Dance', 'Waltz in G Minor', 'Waves of the Danube',
  'When Johnny Comes Marching Home', "You're in My Heart"
];

// ──────────────────────────────────────────────
// Composer associations for known pieces
// ──────────────────────────────────────────────
const CLASSICAL_COMPOSERS = {
  'The Entertainer': 'Scott Joplin',
  'Ode to Joy': 'Ludwig van Beethoven',
  'Largo': 'Antonín Dvořák',
  'Greensleeves': 'Traditional',
  'Amazing Grace': 'Traditional',
  'Auld Lang Syne': 'Traditional',
  'Jingle Bells': 'James Pierpont',
  'Joy to the World!': 'George Frideric Handel',
  'Go Down Moses': 'Traditional',
  'Lullaby': 'Johannes Brahms',
  'Scarborough Fair': 'Traditional',
  'O Sole Mio': 'Eduardo di Capua',
  "Alexander's Ragtime Band": 'Irving Berlin',
  'Brahms Lullaby': 'Johannes Brahms',
  'Bridal Chorus from "Lohengrin"': 'Richard Wagner',
  'Canon in D': 'Johann Pachelbel',
  'Danny Boy': 'Traditional',
  'Dark Eyes': 'Traditional',
  'Deep River': 'Traditional',
  'Etude': 'Frédéric Chopin',
  'Guantanamera': 'Traditional',
  'Hava Nagila': 'Traditional',
  'Hungarian Rhapsody No. 2': 'Franz Liszt',
  'La Bamba': 'Traditional',
  'La Donna E Mobile': 'Giuseppe Verdi',
  'Loch Lomond': 'Traditional',
  "Love's Greeting": 'Edward Elgar',
  'The Marriage of Figaro': 'Wolfgang Amadeus Mozart',
  'Morning Has Broken': 'Traditional',
  "Musetta's Waltz": 'Giacomo Puccini',
  "Nobody Knows the Trouble I've Seen": 'Traditional',
  'Overture from "Raymond"': 'Ambroise Thomas',
  "Plaisir D'Amour": 'Jean-Paul-Égide Martini',
  'Polovetsian Dances': 'Alexander Borodin',
  'Pomp and Circumstance No. 1': 'Edward Elgar',
  'Sakura': 'Traditional',
  'Scherzo': 'Traditional',
  'Solace': 'Scott Joplin',
  'Tarantella': 'Traditional',
  'Theme from Symphony No. 6': 'Pyotr Ilyich Tchaikovsky',
  'Waves of the Danube': 'Iosif Ivanovici',
  'When Johnny Comes Marching Home': 'Traditional',
  'Farewell to Thee (Aloha Oe)': 'Queen Liliuokalani',
  'Fascination': 'Fermo Marchetti',
  'The Battle Hymn of the Republic': 'Traditional',
  'Arkansas Traveler': 'Traditional',
  "Ballin' the Jack": 'Chris Smith',
  'The House of the Rising Sun': 'Traditional',
  'The Streets of Laredo': 'Traditional',
  'Mexican Hat Dance': 'Traditional',
  'Michael Row the Boat Ashore': 'Traditional',
  'Alouette': 'Traditional',
  'Au Claire de la Lune': 'Traditional',
  'Brother John': 'Traditional',
  'The Can-Can': 'Jacques Offenbach',
  'Chiapanecas': 'Traditional',
  'Cockles and Mussels': 'Traditional',
  'Good King Wenceslas': 'Traditional',
  'Kum-ba-yah!': 'Traditional',
  "Lavender's Blue": 'Traditional',
  'Lightly Row': 'Traditional',
  'Little Brown Jug': 'Traditional',
  'London Bridge': 'Traditional',
  'Merrily We Roll Along': 'Traditional',
  'On Top of Old Smoky': 'Traditional',
  'Skip to My Lou!': 'Traditional',
  "He's Got the Whole World in His Hands": 'Traditional',
  "I'm Gonna Lay My Burden Down": 'Traditional',
  'Jericho': 'Traditional',
  'Standing in the Need of Prayer': 'Traditional',
  'Tisket a Tasket': 'Traditional',
  'Rock-a My Soul': 'Traditional',
  'The Hokey-Pokey': 'Traditional',
  "For He's a Jolly Good Fellow": 'Traditional',
  'Frankie and Johnnie': 'Traditional',
  'Blow the Man Down!': 'Traditional',
  'Aura Lee': 'Traditional',
  'Beautiful Brown Eyes': 'Traditional',
  'Mary Ann': 'Traditional',
  'Liza Jane': 'Traditional',
  'Happy Birthday to You!': 'Traditional',
  'La Raspa': 'Traditional',
  'Down in the Valley': 'Traditional',
  // Level 3 composers (from YouTube titles)
  'Serenade Op. 3, No. 5': 'Joseph Haydn',
  'Swan Lake': 'Pyotr Ilyich Tchaikovsky',
  'Scheherazade': 'Nikolai Rimsky-Korsakov',
  'The Unfinished Symphony': 'Franz Schubert',
  'Come Back to Sorrento': 'Ernesto de Curtis',
  'In the Hall of the Mountain King': 'Edvard Grieg',
  'Shenandoah': 'Traditional',
  'Toreador Song from "Carmen"': 'Georges Bizet',
  'Prelude in C Major': 'Johann Sebastian Bach',
  'Trumpet Tune': 'Jeremiah Clarke',
  'Toccata in D Minor': 'Johann Sebastian Bach',
  'Für Elise': 'Ludwig van Beethoven',
  'Fur Elise': 'Ludwig van Beethoven',
  'Moonlight Sonata': 'Ludwig van Beethoven',
  'Rondeau': 'Jean-Joseph Mouret',
  "King William's March": 'Jeremiah Clarke',
  'Star Spangled Banner': 'Traditional',
  'Steal Away': 'Traditional',
  'Dry Bones': 'Traditional',
  "Soldier's Joy (Hornpipe)": 'Traditional',
  'Laredo': 'Traditional',
  'Prelude in A, Op. 28, No. 7': 'Frédéric Chopin',
  'Divertimento in D': 'Wolfgang Amadeus Mozart',
};

// ──────────────────────────────────────────────
// Parse YouTube video titles
// ──────────────────────────────────────────────
function parseAlfred92Title(videoTitle) {
  // Format: "Song Title (Difficulty) Alfred's Adult Level N"
  // or "Song Title, Composer (Difficulty) Alfred's Adult Level N"
  let title = videoTitle;
  let composer = null;
  
  // Remove "Alfred's Adult Level N" suffix
  title = title.replace(/\s*Alfred'?s\s+Adult\s+Level\s+\d+\s*$/i, '');
  
  // Extract difficulty from parentheses at end
  const diffMatch = title.match(/\s*\(([\w-]+(?:\s+[\w-]+)*\s+Piano\s+Solo)\)\s*$/i);
  let diffLabel = 'Intermediate';
  if (diffMatch) {
    title = title.replace(diffMatch[0], '').trim();
    const d = diffMatch[1].toLowerCase();
    if (d.includes('elementary')) diffLabel = 'Beginner';
    else if (d.includes('early-intermediate')) diffLabel = 'Early Intermediate';
    else if (d.includes('intermediate') && !d.includes('late') && !d.includes('early')) diffLabel = 'Intermediate';
    else if (d.includes('late-intermediate')) diffLabel = 'Late Intermediate';
    else if (d.includes('early-advanced')) diffLabel = 'Early Advanced';
    else if (d.includes('advanced')) diffLabel = 'Advanced';
  }
  
  // Extract composer from title if present: "Song, Composer" pattern
  const commaMatch = title.match(/^(.+?),\s+([A-Z][a-z]+(?:\.\s*[A-Z]\.)?(?:\s+[A-Z][a-z]+)*)$/);
  if (commaMatch) {
    const possibleComposer = commaMatch[2].trim();
    const knownComposers = ['Haydn', 'Palmer', 'Clementi', 'Tchaikovsky', 'Rimsky-Korsakov', 
      'Schubert', 'Grieg', 'Lowry', 'Morovsky', 'Bizet', 'Wagner', 'Heller', 'Clarke', 
      'Mouret', 'Bach', 'Beethoven', 'Chopin', 'Mozart', 'Pachelbel'];
    if (knownComposers.some(c => possibleComposer.includes(c))) {
      title = commaMatch[1].trim();
      composer = possibleComposer;
    }
  }

  return { title, composer, diffLabel };
}

function parseAmyTitle(videoTitle) {
  // Format: "Song Title [Composer] (Easy Piano Classics - Book One)"
  // or: "Song Title (Easy Piano Classics - Book One)"
  let title = videoTitle;
  let composer = null;
  
  // Remove "(Easy Piano Classics - Book One)" suffix
  title = title.replace(/\s*\(Easy Piano Classics\s*-\s*Book One\)\s*$/i, '').trim();
  
  // Extract [Composer]
  const bracketMatch = title.match(/\s*\[([^\]]+)\]\s*$/);
  if (bracketMatch) {
    composer = bracketMatch[1].trim();
    title = title.replace(bracketMatch[0], '').trim();
  }
  
  return { title, composer };
}

// ──────────────────────────────────────────────
// Genre classification
// ──────────────────────────────────────────────
function classifyGenre(title, composer) {
  const c = (composer || '').toLowerCase();
  const t = (title || '').toLowerCase();
  
  if (['traditional', ''].includes(c)) {
    if (t.includes('blues') || t.includes('jazz') || t.includes('rag') || t.includes('boogie')) return 'Jazz/Blues';
    if (t.includes('rock') || t.includes('harmonica rock')) return 'Pop/Rock';
    if (t.includes('waltz') || t.includes('polka') || t.includes('march')) return 'Classical';
    return 'Folk/Traditional';
  }
  
  const classicalComposers = ['bach', 'beethoven', 'mozart', 'chopin', 'haydn', 'brahms',
    'tchaikovsky', 'schubert', 'handel', 'dvořák', 'dvorak', 'mendelssohn', 'liszt',
    'debussy', 'grieg', 'bizet', 'verdi', 'puccini', 'wagner', 'offenbach',
    'rimsky-korsakov', 'borodin', 'elgar', 'faure', 'fauré', 'satie', 'mussorgsky',
    'holst', 'delius', 'humperdinck', 'berlioz', 'boccherini', 'clementi', 'heller',
    'pachelbel', 'mouret', 'clarke', 'rossini', 'saint-saens', 'ponchielli', 'rubinstein',
    'arne', 'daquin', 'gossec', 'massenet', 'parry', 'mahler', 'macDowell',
    'ivanovici', 'thomas', 'martini', 'joplin', 'morovsky', 'lowry', 'albeniz',
    'de curtis', 'marchetti', 'capua'];
  
  if (classicalComposers.some(cc => c.includes(cc))) return 'Classical';
  if (t.includes('rag') || t.includes('blues') || t.includes('jazz')) return 'Jazz/Blues';
  if (t.includes('rock') || t.includes('calypso') || t.includes('fandango')) return 'Pop/Rock';
  
  return 'Classical';
}

// ──────────────────────────────────────────────
// Main execution
// ──────────────────────────────────────────────

// Read existing data
const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));
const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const playlists = JSON.parse(readFileSync('/tmp/new-playlist-videos.json', 'utf8'));

// Check for existing books
const existingBookIds = new Set(books.map(b => b.id));
const existingSongIds = new Set(songs.map(s => s.id));

// Add new books
let booksAdded = 0;
for (const book of NEW_BOOKS) {
  if (!existingBookIds.has(book.id)) {
    books.push(book);
    booksAdded++;
    console.log(`Added book: ${book.id}`);
  } else {
    console.log(`Book already exists: ${book.id}`);
  }
}

// ──────────────────────────────────────────────
// Generate Alfred Level 1 songs from Amazon list
// ──────────────────────────────────────────────
const newSongs = [];
const bookId1 = 'alfred-adult-aio-1';

for (const title of ALFRED_L1_SONGS) {
  const composer = CLASSICAL_COMPOSERS[title] || null;
  const genre = classifyGenre(title, composer);
  const s = makeSong(bookId1, title, composer, genre, null, {
    label: 'Beginner',
    faberLevel: null,
    alfredLevel: 'Level 1'
  });
  if (!existingSongIds.has(s.id)) {
    newSongs.push(s);
  }
}
console.log(`Generated ${newSongs.length} songs for alfred-adult-aio-1`);

// ──────────────────────────────────────────────
// Generate Alfred Level 2 songs from Amazon list + YouTube
// ──────────────────────────────────────────────
const l2Videos = playlists['PLIx-hGjmqNJEm1DLb4A6uYnrzJUl_tzCe'] || [];
const l2YoutubeOnly = [];
const l2AmazonTitlesLower = new Set(ALFRED_L2_SONGS.map(t => t.toLowerCase()));

// First add from Amazon list
const beforeL2 = newSongs.length;
for (const title of ALFRED_L2_SONGS) {
  const composer = CLASSICAL_COMPOSERS[title] || null;
  const genre = classifyGenre(title, composer);
  const s = makeSong('alfred-adult-aio-2', title, composer, genre, null, {
    label: 'Early Intermediate',
    faberLevel: null,
    alfredLevel: 'Level 2'
  });
  if (!existingSongIds.has(s.id)) {
    newSongs.push(s);
  }
}

// Check for YouTube-only songs not in Amazon list
for (const v of l2Videos) {
  const parsed = parseAlfred92Title(v.title);
  if (!l2AmazonTitlesLower.has(parsed.title.toLowerCase())) {
    // Check if it's a duplicate with different casing/punctuation
    const slug = slugify(parsed.title);
    const exists = newSongs.some(s => s.bookId === 'alfred-adult-aio-2' && slugify(s.title) === slug);
    if (!exists) {
      l2YoutubeOnly.push(parsed.title);
      const composer = parsed.composer ? resolveComposerName(parsed.composer) : (CLASSICAL_COMPOSERS[parsed.title] || null);
      const genre = classifyGenre(parsed.title, composer);
      const s = makeSong('alfred-adult-aio-2', parsed.title, composer, genre, null, {
        label: parsed.diffLabel,
        faberLevel: null,
        alfredLevel: 'Level 2'
      });
      if (!existingSongIds.has(s.id)) {
        newSongs.push(s);
      }
    }
  }
}
console.log(`Generated ${newSongs.length - beforeL2} songs for alfred-adult-aio-2`);
if (l2YoutubeOnly.length > 0) console.log(`  YouTube-only songs: ${l2YoutubeOnly.join(', ')}`);

// ──────────────────────────────────────────────
// Generate Alfred Level 3 songs from YouTube playlist
// ──────────────────────────────────────────────
const l3Videos = playlists['PLIx-hGjmqNJH9V3NTh6g3jl7unuNUTQvt'] || [];
const beforeL3 = newSongs.length;

function resolveComposerName(shortName) {
  const map = {
    'Haydn': 'Joseph Haydn',
    'Palmer': 'Willard Palmer',
    'Clementi': 'Muzio Clementi',
    'Tchaikovsky': 'Pyotr Ilyich Tchaikovsky',
    'Rimsky-Korsakov': 'Nikolai Rimsky-Korsakov',
    'Schubert': 'Franz Schubert',
    'Grieg': 'Edvard Grieg',
    'Lowry': 'Robert Lowry',
    'Morovsky': 'Morovsky',
    'Bizet': 'Georges Bizet',
    'Heller': 'Stephen Heller',
    'Clarke': 'Jeremiah Clarke',
    'Mouret': 'Jean-Joseph Mouret',
    'J.J. Mouret': 'Jean-Joseph Mouret',
    'J.S. Bach': 'Johann Sebastian Bach',
    'Bach': 'Johann Sebastian Bach',
    'Beethoven': 'Ludwig van Beethoven',
    'Chopin': 'Frédéric Chopin',
    'Mozart': 'Wolfgang Amadeus Mozart',
    'Wagner': 'Richard Wagner',
    'Pachelbel': 'Johann Pachelbel',
  };
  return map[shortName] || shortName;
}

for (const v of l3Videos) {
  const parsed = parseAlfred92Title(v.title);
  // Skip RH/LH separate entries
  if (/\(RH\)|\(LH\)/i.test(parsed.title)) continue;
  
  let composer = null;
  if (parsed.composer) {
    composer = resolveComposerName(parsed.composer);
  } else {
    composer = CLASSICAL_COMPOSERS[parsed.title] || null;
  }
  
  const genre = classifyGenre(parsed.title, composer);
  const s = makeSong('alfred-adult-aio-3', parsed.title, composer, genre, null, {
    label: parsed.diffLabel,
    faberLevel: null,
    alfredLevel: 'Level 3'
  });
  if (!existingSongIds.has(s.id)) {
    newSongs.push(s);
  }
}
console.log(`Generated ${newSongs.length - beforeL3} songs for alfred-adult-aio-3`);

// ──────────────────────────────────────────────
// Generate Library of Easy Piano Classics songs from Amy's playlist
// ──────────────────────────────────────────────
const amyVideos = playlists['PL7ucElDiXf1QlJJ79ho-Svy9LWegYStIL'] || [];
const beforeLepc = newSongs.length;

// Additional songs from Hal Leonard that may not be in Amy's 100-video playlist
const EXTRA_HAL_LEONARD_SONGS = [
  { title: 'Aida Grand March', composer: 'Giuseppe Verdi' },
  { title: 'All Through the Night', composer: 'Traditional' },
  { title: 'Auld Lang Syne', composer: 'Traditional' },
  { title: 'Ballet from Rosamunde', composer: 'Franz Schubert' },
  { title: 'Blue Danube', composer: 'Johann Strauss Jr.' },
  { title: 'Bridal March from Lohengrin', composer: 'Richard Wagner' },
  { title: 'Theme from the Emperor Concerto', composer: 'Ludwig van Beethoven' },
  { title: 'Flower Duet from Lakmé', composer: 'Léo Delibes' },
  { title: 'In the Hall of the Mountain King', composer: 'Edvard Grieg' },
  { title: 'Jupiter from The Planets', composer: 'Gustav Holst' },
  { title: 'La Donna È Mobile', composer: 'Giuseppe Verdi' },
  { title: 'Nocturne from A Midsummer Night\'s Dream', composer: 'Felix Mendelssohn' },
  { title: 'Nessun Dorma', composer: 'Giacomo Puccini' },
  { title: 'Radetzky March', composer: 'Johann Strauss Sr.' },
  { title: 'Raindrop Prelude', composer: 'Frédéric Chopin' },
  { title: 'Rondo Alla Turca', composer: 'Wolfgang Amadeus Mozart' },
  { title: 'Song of India', composer: 'Nikolai Rimsky-Korsakov' },
  { title: 'Spring from The Four Seasons', composer: 'Antonio Vivaldi' },
  { title: 'The Trout', composer: 'Franz Schubert' },
  { title: 'Waltz in Ab', composer: 'Johannes Brahms' },
  { title: 'Waltz of the Flowers', composer: 'Pyotr Ilyich Tchaikovsky' },
  { title: 'William Tell Overture', composer: 'Gioachino Rossini' },
];

for (const v of amyVideos) {
  const parsed = parseAmyTitle(v.title);
  let composer = parsed.composer || 'Traditional';
  
  // Expand short composer names
  const composerExpansions = {
    'Bach': 'Johann Sebastian Bach',
    'Beethoven': 'Ludwig van Beethoven',
    'Brahms': 'Johannes Brahms',
    'Chopin': 'Frédéric Chopin',
    'Debussy': 'Claude Debussy',
    'Handel': 'George Frideric Handel',
    'Mendelssohn': 'Felix Mendelssohn',
    'Mozart': 'Wolfgang Amadeus Mozart',
    'Issac Albeniz': 'Isaac Albéniz',
    'Thomas Arne': 'Thomas Arne',
    'Carl Phillip Emmanuel Bach': 'Carl Philipp Emanuel Bach',
    'Luigi Boccherini': 'Luigi Boccherini',
    'Hector Berlioz': 'Hector Berlioz',
    'Georges Bizet': 'Georges Bizet',
    'Alexander Borodin': 'Alexander Borodin',
    'Jeremiah Clarke': 'Jeremiah Clarke',
    'Louis Claude Daquin': 'Louis-Claude Daquin',
    'Leo Delibes': 'Léo Delibes',
    'Frederick Delius': 'Frederick Delius',
    'Charles Dibdin': 'Charles Dibdin',
    'Antonin Dvorak': 'Antonín Dvořák',
    'Edward Elgar': 'Edward Elgar',
    'Daniel Decatur Emmett': 'Daniel Decatur Emmett',
    'Gabriel Faure': 'Gabriel Fauré',
    'Francois Joseph Gossec': 'François-Joseph Gossec',
    'Edvard Grieg': 'Edvard Grieg',
    'Charles Gounod': 'Charles Gounod',
    'Gustav Holst': 'Gustav Holst',
    'Engelbert Humperdinck': 'Engelbert Humperdinck',
    'Mikhail Ippolitov-Ivanov': 'Mikhail Ippolitov-Ivanov',
    'Franz Liszt': 'Franz Liszt',
    'Edward MacDowell': 'Edward MacDowell',
    'Gustav Mahler': 'Gustav Mahler',
    'Jules Massenet': 'Jules Massenet',
    'Modeste Mussorgsky': 'Modest Mussorgsky',
    'Jacques Offenbach': 'Jacques Offenbach',
    'Amilcare Ponchielli': 'Amilcare Ponchielli',
    'Johann Pachelbel': 'Johann Pachelbel',
    'Charles Parry': 'Hubert Parry',
    'Giacomo Puccini': 'Giacomo Puccini',
    'Gioacchino Rossini': 'Gioachino Rossini',
    'Anton Rubinstein': 'Anton Rubinstein',
    'Camille Saint-Saens': 'Camille Saint-Saëns',
    'Erik Satie': 'Erik Satie',
    'Franz Schubert': 'Franz Schubert',
  };
  
  composer = composerExpansions[composer] || composer;
  
  const genre = classifyGenre(parsed.title, composer);
  const s = makeSong('library-of-easy-piano-classics', parsed.title, composer, genre, null, {
    label: 'Intermediate',
    faberLevel: null,
    alfredLevel: null
  });
  if (!existingSongIds.has(s.id)) {
    newSongs.push(s);
  }
}

// Add extra Hal Leonard songs not in Amy's playlist
const lepcSlugs = new Set(newSongs.filter(s => s.bookId === 'library-of-easy-piano-classics').map(s => slugify(s.title)));
let extraAdded = 0;
for (const extra of EXTRA_HAL_LEONARD_SONGS) {
  const slug = slugify(extra.title);
  if (!lepcSlugs.has(slug)) {
    const genre = classifyGenre(extra.title, extra.composer);
    const s = makeSong('library-of-easy-piano-classics', extra.title, extra.composer, genre, null, {
      label: 'Intermediate',
      faberLevel: null,
      alfredLevel: null
    });
    if (!existingSongIds.has(s.id)) {
      newSongs.push(s);
      lepcSlugs.add(slug);
      extraAdded++;
    }
  }
}
console.log(`Generated ${newSongs.length - beforeLepc} songs for library-of-easy-piano-classics (${extraAdded} extras from Hal Leonard)`);

// ──────────────────────────────────────────────
// Also check Alfred Level 1 YouTube for songs not in Amazon list
// ──────────────────────────────────────────────
const l1Videos = playlists['PLIx-hGjmqNJE9M_m1oMkNl8BRdATc1m8d'] || [];
const l1AmazonSlugs = new Set(ALFRED_L1_SONGS.map(t => slugify(t)));
const l1Extras = [];
for (const v of l1Videos) {
  const parsed = parseAlfred92Title(v.title);
  if (/\(RH\)|\(LH\)/i.test(parsed.title)) continue;
  const slug = slugify(parsed.title);
  if (!l1AmazonSlugs.has(slug)) {
    const exists = newSongs.some(s => s.bookId === 'alfred-adult-aio-1' && slugify(s.title) === slug);
    if (!exists) {
      l1Extras.push(parsed.title);
      const composer = parsed.composer ? resolveComposerName(parsed.composer) : (CLASSICAL_COMPOSERS[parsed.title] || null);
      const genre = classifyGenre(parsed.title, composer);
      const s = makeSong('alfred-adult-aio-1', parsed.title, composer, genre, null, {
        label: parsed.diffLabel,
        faberLevel: null,
        alfredLevel: 'Level 1'
      });
      if (!existingSongIds.has(s.id)) {
        newSongs.push(s);
      }
    }
  }
}
if (l1Extras.length > 0) console.log(`  Alfred L1 YouTube-only extras: ${l1Extras.join(', ')}`);

// ──────────────────────────────────────────────
// Merge and write
// ──────────────────────────────────────────────
const allSongs = [...songs, ...newSongs];
console.log(`\nTotal songs: ${allSongs.length} (was ${songs.length}, added ${newSongs.length})`);
console.log(`Total books: ${books.length} (added ${booksAdded})`);

writeFileSync('src/data/books.json', JSON.stringify(books, null, 2) + '\n');
writeFileSync('src/data/songs.json', JSON.stringify(allSongs, null, 2) + '\n');
console.log('\nWrote updated books.json and songs.json');
