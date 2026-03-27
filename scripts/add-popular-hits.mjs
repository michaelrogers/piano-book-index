#!/usr/bin/env node
/**
 * Add Alfred's Basic Adult Piano Course: Popular Hits books (Levels 1 & 3)
 * Arranged by Tom Gerou, published by Alfred Music
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

// --- Book definitions ---
const newBooks = [
  {
    id: 'alfred-popular-hits-1',
    title: "Alfred's Basic Adult Piano Course: Popular Hits Level 1",
    series: 'Alfred Popular Hits',
    seriesLevel: 'Level 1',
    bookType: 'companion',
    publisher: 'Alfred Music',
    isbn: '978-1470640583',
    coverImage: '/covers/alfred-popular-hits-1.jpg',
    pageCount: 40,
    description:
      'Popular songs arranged at Level 1 by Tom Gerou, correlating with Alfred\'s Basic Adult Piano Course Lesson Book 1. Features hits from movies, Broadway, TV, and pop including Don\'t Stop Believin\', Let It Go, Over the Rainbow, and Star Wars.',
    amazonUrl: 'https://www.amazon.com/dp/1470640589',
    trackListingSource: 'publisher-website',
  },
  {
    id: 'alfred-popular-hits-3',
    title: "Alfred's Basic Adult Piano Course: Popular Hits Level 3",
    series: 'Alfred Popular Hits',
    seriesLevel: 'Level 3',
    bookType: 'companion',
    publisher: 'Alfred Music',
    isbn: '978-1470641696',
    coverImage: '/covers/alfred-popular-hits-3.jpg',
    pageCount: 36,
    description:
      'Popular songs arranged at Level 3 by Tom Gerou, correlating with Alfred\'s Basic Adult Piano Course Lesson Book 3. Features hits including Shallow, Rhapsody in Blue, The Imperial March, and the Downton Abbey theme.',
    amazonUrl: 'https://www.amazon.com/dp/1470641690',
    trackListingSource: 'publisher-website',
  },
];

// --- Song definitions ---
// Popular Hits Level 1 (22 songs)
const popularHits1Songs = [
  { title: 'Best Day of My Life', composer: 'Zachary Barnett / James Adam Shelley / Matthew Sanchez / David Rublin / Shep Goodman / Aaron Accetta', genre: 'Pop/Rock' },
  { title: 'Big Yellow Taxi', composer: 'Joni Mitchell', genre: 'Pop/Rock' },
  { title: 'Bye Bye Love', composer: 'Felice Bryant / Boudleaux Bryant', genre: 'Pop/Rock' },
  { title: 'Clouds', composer: 'Zach Sobiech', genre: 'Pop/Rock' },
  { title: "Don't Stop Believin'", composer: 'Steve Perry / Neal Schon / Jonathan Cain', genre: 'Pop/Rock' },
  { title: 'Everything Is Awesome', composer: 'Shawn Patterson / Joshua Bartholomew / Lisa Harriton / Akiva Schaffer / Andrew Samberg / Jorma Taccone', genre: 'Film' },
  { title: 'Flicker', composer: 'Niall Horan', genre: 'Pop/Rock' },
  { title: 'I Could Have Danced All Night', composer: 'Frederick Loewe / Alan Jay Lerner', genre: 'Broadway', notes: 'From My Fair Lady' },
  { title: 'I Got You Babe', composer: 'Sonny Bono', genre: 'Pop/Rock' },
  { title: 'I Love Paris', composer: 'Cole Porter', genre: 'Broadway', notes: 'From Can-Can' },
  { title: "I'll Stand by You", composer: 'Chrissie Hynde / Tom Kelly / Billy Steinberg', genre: 'Pop/Rock' },
  { title: 'James Bond Theme', composer: 'Monty Norman', genre: 'Film' },
  { title: 'Let It Go', composer: 'Kristen Anderson-Lopez / Robert Lopez', genre: 'Film', notes: 'From Frozen' },
  { title: 'Mamma Mia', composer: 'Benny Andersson / Björn Ulvaeus / Stig Anderson', genre: 'Pop/Rock' },
  { title: 'Over the Rainbow', composer: 'Harold Arlen / E.Y. Harburg', genre: 'Film', notes: 'From The Wizard of Oz' },
  { title: 'Raiders March', composer: 'John Williams', genre: 'Film', notes: 'From Raiders of the Lost Ark' },
  { title: 'The Rose', composer: 'Amanda McBroom', genre: 'Pop/Rock' },
  { title: 'Star Wars (Main Theme)', composer: 'John Williams', genre: 'Film' },
  { title: 'Take My Breath Away', composer: 'Giorgio Moroder / Tom Whitlock', genre: 'Film', notes: 'From Top Gun' },
  { title: 'A Teenager in Love', composer: 'Doc Pomus / Mort Shuman', genre: 'Pop/Rock' },
  { title: 'Try to Remember', composer: 'Harvey Schmidt / Tom Jones', genre: 'Broadway', notes: 'From The Fantasticks' },
  { title: 'You Raise Me Up', composer: 'Brendan Graham / Rolf Løvland', genre: 'Pop/Rock' },
];

// Popular Hits Level 3 (14 songs)
const popularHits3Songs = [
  { title: 'Ashokan Farewell', composer: 'Jay Ungar', genre: 'Classical' },
  { title: 'Cabaret', composer: 'John Kander / Fred Ebb', genre: 'Broadway', notes: 'From Cabaret' },
  { title: 'Dear Theodosia', composer: 'Lin-Manuel Miranda', genre: 'Broadway', notes: 'From Hamilton' },
  { title: 'Downton Abbey (Theme)', composer: 'John Lunn', genre: 'Film' },
  { title: 'The Good, the Bad and the Ugly (Main Title)', composer: 'Ennio Morricone', genre: 'Film' },
  { title: 'Happy Together', composer: 'Garry Bonner / Alan Gordon', genre: 'Pop/Rock' },
  { title: "I'll Be There for You", composer: 'Michael Skloff / Allee Willis / David Crane / Marta Kauffman / Phil Solem / Danny Wilde', genre: 'Film', notes: 'Theme from Friends' },
  { title: 'The Imperial March', composer: 'John Williams', genre: 'Film', notes: 'From Star Wars: The Empire Strikes Back' },
  { title: 'Little Shop of Horrors', composer: 'Alan Menken / Howard Ashman', genre: 'Broadway', notes: 'From Little Shop of Horrors' },
  { title: 'Oh, the Thinks You Can Think!', composer: 'Stephen Flaherty / Lynn Ahrens', genre: 'Broadway', notes: 'From Seussical the Musical' },
  { title: 'One', composer: 'Harry Nilsson', genre: 'Pop/Rock', notes: 'Is the Loneliest Number' },
  { title: 'Rhapsody in Blue (Selected Themes)', composer: 'George Gershwin', genre: 'Classical' },
  { title: 'Shallow', composer: 'Lady Gaga / Mark Ronson / Anthony Rossomando / Andrew Wyatt', genre: 'Film', notes: 'From A Star Is Born' },
  { title: 'Someone to Watch Over Me', composer: 'George Gershwin / Ira Gershwin', genre: 'Broadway' },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSongs(songs, bookId, difficultyLabel, alfredLevel) {
  return songs.map((song, i) => ({
    id: `${bookId}-${slugify(song.title)}`,
    title: song.title,
    composer: song.composer,
    arranger: 'Tom Gerou',
    genre: song.genre,
    bookId,
    pageNumber: null,
    difficulty: {
      label: difficultyLabel,
      faberLevel: null,
      alfredLevel,
    },
    youtubeLinks: [],
    notes: song.notes || null,
  }));
}

// --- Main ---
const booksPath = join(dataDir, 'books.json');
const songsPath = join(dataDir, 'songs.json');

const books = JSON.parse(readFileSync(booksPath, 'utf-8'));
const songs = JSON.parse(readFileSync(songsPath, 'utf-8'));

// Check for duplicates
for (const book of newBooks) {
  if (books.find((b) => b.id === book.id)) {
    console.log(`Book ${book.id} already exists, skipping.`);
    continue;
  }
  books.push(book);
  console.log(`Added book: ${book.title}`);
}

const newSongs1 = buildSongs(popularHits1Songs, 'alfred-popular-hits-1', 'Beginner', 'Level 1');
const newSongs3 = buildSongs(popularHits3Songs, 'alfred-popular-hits-3', 'Intermediate', 'Level 3');

let addedCount = 0;
for (const song of [...newSongs1, ...newSongs3]) {
  if (songs.find((s) => s.id === song.id)) {
    console.log(`Song ${song.id} already exists, skipping.`);
    continue;
  }
  songs.push(song);
  addedCount++;
}

writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n');
writeFileSync(songsPath, JSON.stringify(songs, null, 2) + '\n');

console.log(`\nDone! Added ${addedCount} songs across ${newBooks.length} books.`);
console.log(`Total books: ${books.length}`);
console.log(`Total songs: ${songs.length}`);
