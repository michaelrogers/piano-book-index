import { readFileSync } from 'fs';

const books = JSON.parse(readFileSync('scripts/pretime-bigtime-books.json','utf8'));
const songs = JSON.parse(readFileSync('scripts/pretime-bigtime-songs.json','utf8'));

console.log('=== Sample Book ===');
console.log(JSON.stringify(books[0], null, 2));

console.log('\n=== Sample Songs (first book) ===');
const bookSongs = songs.filter(s => s.bookId === books[0].id);
bookSongs.forEach(s => console.log('  -', s.title));

console.log('\n=== Books with 0 songs ===');
books.filter(b => b._songCount === 0).forEach(b => console.log('  ', b.id, '(' + b._sku + ')'));

console.log('\n=== Books with no page count ===');
books.filter(b => b.pageCount == null).forEach(b => console.log('  ', b.id, '(' + b._sku + ')'));
