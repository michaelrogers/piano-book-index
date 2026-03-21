import { writeFileSync, readFileSync } from 'fs';

// Preserve existing Alfred data
const existing = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const alfredSongs = existing.filter(s => s.bookId.startsWith('alfred-'));

function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function song(bookId, title, composer, genre, page, notes = '') {
  const prefix = bookId.replace('faber-', '').replace(/-/g, '');
  const id = `${bookId}-${slugify(title)}`;
  const level = bookId.includes('-1') || bookId.includes('motown') || bookId.includes('country') || bookId.includes('standards') ? 'Book 1' : 'Book 2';
  const diffLabel = level === 'Book 1' ? 'Beginner' : 'Early Intermediate';
  return {
    id,
    title,
    composer: composer || 'Traditional',
    arranger: 'Faber & Faber',
    genre,
    bookId,
    pageNumber: page,
    difficulty: { label: diffLabel, faberLevel: level, alfredLevel: null },
    youtubeLinks: [],
    notes: notes
  };
}

const songs = [];

// ============================================================
// CLASSICS BOOK 1 (faber-classics-1, FF3030)
// ============================================================
const c1 = 'faber-classics-1';
// Section 1: Beginning Classics
songs.push(song(c1, 'Theme from Symphony No. 104 (London Symphony)', 'Joseph Haydn', 'Classical', 6, 'Section 1: Beginning Classics'));
songs.push(song(c1, 'Swan Lake (Overture to Act II)', 'Pyotr Ilyich Tchaikovsky', 'Classical', 7));
songs.push(song(c1, 'Ode to Joy (Theme from the Ninth Symphony)', 'Ludwig van Beethoven', 'Classical', 8));
songs.push(song(c1, 'Alleluia (from Exultate Jubilate)', 'Wolfgang Amadeus Mozart', 'Classical', 10));
songs.push(song(c1, 'Pomp and Circumstance (Op. 39, No. 1)', 'Edward Elgar', 'Classical', 12));
songs.push(song(c1, 'Finale (from Symphony No. 1)', 'Johannes Brahms', 'Classical', 14));
songs.push(song(c1, 'Air (from the Anna Magdalena Bach Notebook)', 'Johann Sebastian Bach', 'Classical', 16));
songs.push(song(c1, 'Autumn, 1st movement (from The Four Seasons)', 'Antonio Vivaldi', 'Classical', 18));
songs.push(song(c1, 'Finale from Symphony No. 9, From the New World', 'Antonín Dvořák', 'Classical', 20));
songs.push(song(c1, 'Hornpipe (from Water Music)', 'George Frideric Handel', 'Classical', 22));
songs.push(song(c1, "Huntsmen's Chorus (from Der Freischütz)", 'Carl Maria von Weber', 'Classical', 24));
songs.push(song(c1, 'Theme from the Fifth Symphony', 'Ludwig van Beethoven', 'Classical', 26));
// Section 2: Classics in the Key of C Major
songs.push(song(c1, 'Theme from Symphony No. 6 ("Pastoral," Op. 68)', 'Ludwig van Beethoven', 'Classical', 31, 'Section 2: Classics in the Key of C Major'));
songs.push(song(c1, 'Spring, 1st movement (from The Four Seasons)', 'Antonio Vivaldi', 'Classical', 32));
songs.push(song(c1, 'Theme from Finlandia', 'Jean Sibelius', 'Classical', 34));
songs.push(song(c1, "Prince of Denmark's March", 'Jeremiah Clarke', 'Classical', 36));
songs.push(song(c1, 'Minuet (Op. 14, No. 1)', 'Ignacy Jan Paderewski', 'Classical', 38));
songs.push(song(c1, 'Theme from the "Surprise" Symphony', 'Joseph Haydn', 'Classical', 40));
songs.push(song(c1, 'Caro Nome (theme from Rigoletto)', 'Giuseppe Verdi', 'Classical', 42));
songs.push(song(c1, 'Rondeau (from Suite de Symphonies, No. 1)', 'Jean-Joseph Mouret', 'Classical', 44));
songs.push(song(c1, 'The Trout (Die Forelle)', 'Franz Schubert', 'Classical', 46));
songs.push(song(c1, 'Spring Song (from Songs Without Words, Op. 62, No. 6)', 'Felix Mendelssohn', 'Classical', 48));
songs.push(song(c1, "Variations on a Theme by Haydn (St. Anthony's Chorale)", 'Johannes Brahms', 'Classical', 50));
songs.push(song(c1, 'Aria (theme from La Traviata)', 'Giuseppe Verdi', 'Classical', 52));
// Section 3: Classics in the Key of G Major
songs.push(song(c1, 'Theme from Sonata in A Major (K. 331)', 'Wolfgang Amadeus Mozart', 'Classical', 57, 'Section 3: Classics in the Key of G Major'));
songs.push(song(c1, 'March of the English Guard', 'Jeremiah Clarke', 'Classical', 58));
songs.push(song(c1, 'Theme from The Magic Flute', 'Wolfgang Amadeus Mozart', 'Classical', 60));
songs.push(song(c1, 'Laughing Song (from Die Fledermaus)', 'Johann Strauss Jr.', 'Classical', 62));
songs.push(song(c1, 'Autumn, 3rd movement (from The Four Seasons)', 'Antonio Vivaldi', 'Classical', 64));
songs.push(song(c1, 'See, the Conquering Hero Comes (from Joshua)', 'George Frideric Handel', 'Classical', 66));
songs.push(song(c1, 'Theme from Don Giovanni (Là ci darem la mano)', 'Wolfgang Amadeus Mozart', 'Classical', 68));
songs.push(song(c1, 'Liebestraum (Dream of Love)', 'Franz Liszt', 'Classical', 70));
songs.push(song(c1, "Farandole (from L'Arlésienne)", 'Georges Bizet', 'Classical', 72));
songs.push(song(c1, 'Barcarolle (from The Tales of Hoffmann)', 'Jacques Offenbach', 'Classical', 74));
songs.push(song(c1, 'O mio babbino caro (from Gianni Schicchi)', 'Giacomo Puccini', 'Classical', 76));

// ============================================================
// CLASSICS BOOK 2 (faber-classics-2, FF3032)
// ============================================================
const c2 = 'faber-classics-2';
// Section 1: Baroque & Classical
songs.push(song(c2, "Jesu, Joy of Man's Desiring", 'Johann Sebastian Bach', 'Classical', 6, 'Section 1: Baroque & Classical'));
songs.push(song(c2, 'Sheep May Safely Graze', 'Johann Sebastian Bach', 'Classical', 8));
songs.push(song(c2, 'Canon in D', 'Johann Pachelbel', 'Classical', 11));
songs.push(song(c2, 'Rondeau in D Minor', 'Henry Purcell', 'Classical', 14));
songs.push(song(c2, 'Prelude (from Cello Suite No. 1 in G Major)', 'Johann Sebastian Bach', 'Classical', 16));
songs.push(song(c2, 'The Arrival of the Queen of Sheba (from Solomon)', 'George Frideric Handel', 'Classical', 20));
songs.push(song(c2, 'Winter, 3rd movement (from The Four Seasons)', 'Antonio Vivaldi', 'Classical', 22));
songs.push(song(c2, 'Sarabande (from Keyboard Suite in D Minor)', 'George Frideric Handel', 'Classical', 26));
songs.push(song(c2, 'Sleepers Awake', 'Johann Sebastian Bach', 'Classical', 28));
songs.push(song(c2, 'Theme from Symphony No. 3, "Eroica," 4th movement', 'Ludwig van Beethoven', 'Classical', 32));
songs.push(song(c2, 'Theme from Symphony No. 40, 1st movement', 'Wolfgang Amadeus Mozart', 'Classical', 34));
songs.push(song(c2, 'Ave Verum Corpus', 'Wolfgang Amadeus Mozart', 'Classical', 37));
songs.push(song(c2, 'Minuet (from Don Giovanni)', 'Wolfgang Amadeus Mozart', 'Classical', 40));
songs.push(song(c2, 'Moonlight Sonata Theme (from Piano Sonata No. 14)', 'Ludwig van Beethoven', 'Classical', 42));
songs.push(song(c2, 'Gypsy Rondo (from Piano Trio No. 39)', 'Joseph Haydn', 'Classical', 44));
songs.push(song(c2, 'Pathétique Sonata Theme (from Piano Sonata No. 8)', 'Ludwig van Beethoven', 'Classical', 48));
// Section 2: Romantic & Impressionistic
songs.push(song(c2, 'On Wings of Song', 'Felix Mendelssohn', 'Classical', 54, 'Section 2: Romantic & Impressionistic'));
songs.push(song(c2, 'In the Hall of the Mountain King (from Peer Gynt)', 'Edvard Grieg', 'Classical', 56));
songs.push(song(c2, 'Melody in F', 'Anton Rubinstein', 'Classical', 58));
songs.push(song(c2, 'Triumphal March (from Aida)', 'Giuseppe Verdi', 'Classical', 60));
songs.push(song(c2, 'Ballade No. 1 in G Minor', 'Frédéric Chopin', 'Classical', 62));
songs.push(song(c2, 'Prelude Op. 28, No. 7', 'Frédéric Chopin', 'Classical', 64));
songs.push(song(c2, 'Humoresque', 'Antonín Dvořák', 'Classical', 65));
songs.push(song(c2, 'Serenade (from Schwanengesang)', 'Franz Schubert', 'Classical', 68));
songs.push(song(c2, 'You and You (from Die Fledermaus)', 'Johann Strauss Jr.', 'Classical', 71));
songs.push(song(c2, 'Clair de lune (from Suite bergamasque)', 'Claude Debussy', 'Classical', 74));

// ============================================================
// POPULAR BOOK 1 (faber-popular-1, FF3031)
// ============================================================
const p1 = 'faber-popular-1';
// Section 1: Beginning Popular Songs
songs.push(song(p1, 'My Heart Will Go On', 'James Horner', 'Pop/Film', 4, 'Section 1: Beginning Popular Songs'));
songs.push(song(p1, 'Edelweiss', 'Richard Rodgers', 'Musical Theatre', 6));
songs.push(song(p1, 'Let It Be', 'John Lennon & Paul McCartney', 'Pop/Rock', 8));
songs.push(song(p1, "Oh, What a Beautiful Mornin'", 'Richard Rodgers', 'Musical Theatre', 10));
songs.push(song(p1, 'Downton Abbey (Theme)', 'John Lunn', 'Film/TV', 12));
songs.push(song(p1, "There's No Business Like Show Business", 'Irving Berlin', 'Musical Theatre', 14));
songs.push(song(p1, 'Do-Re-Mi', 'Richard Rodgers', 'Musical Theatre', 17));
songs.push(song(p1, 'Chim Chim Cher-ee', 'Richard M. Sherman & Robert B. Sherman', 'Film', 20));
songs.push(song(p1, "Let's Go Fly a Kite", 'Richard M. Sherman & Robert B. Sherman', 'Film', 22));
songs.push(song(p1, 'Tomorrow', 'Charles Strouse', 'Musical Theatre', 24));
songs.push(song(p1, 'If I Were a Rich Man', 'Jerry Bock', 'Musical Theatre', 26));
songs.push(song(p1, "Climb Ev'ry Mountain", 'Richard Rodgers', 'Musical Theatre', 28));
songs.push(song(p1, 'Twist and Shout', 'Phil Medley & Bert Berns', 'Pop/Rock', 31));
// Section 2: Popular Songs in the Key of C Major
songs.push(song(p1, 'This Land Is Your Land', 'Woody Guthrie', 'Folk', 35, 'Section 2: Popular Songs in the Key of C Major'));
songs.push(song(p1, 'The Tide Is High', 'John Holt', 'Pop', 36));
songs.push(song(p1, 'Lean On Me', 'Bill Withers', 'Pop/Soul', 38));
songs.push(song(p1, 'Theme from "Jurassic Park"', 'John Williams', 'Film', 40));
songs.push(song(p1, 'One Call Away', 'Charlie Puth', 'Pop', 43));
songs.push(song(p1, 'Heart and Soul', 'Hoagy Carmichael', 'Jazz/Pop', 44));
songs.push(song(p1, 'Right Here Waiting', 'Richard Marx', 'Pop', 46));
songs.push(song(p1, 'Someone Like You', 'Adele', 'Pop', 48));
songs.push(song(p1, 'I Want to Hold Your Hand', 'John Lennon & Paul McCartney', 'Pop/Rock', 50));
songs.push(song(p1, 'Yesterday', 'John Lennon & Paul McCartney', 'Pop/Rock', 52));
songs.push(song(p1, 'The Winner Takes It All', 'Benny Andersson & Björn Ulvaeus', 'Pop', 54));
songs.push(song(p1, 'Pachelbel Canon', 'Johann Pachelbel', 'Classical', 56));
// Section 3: Popular Songs in the Key of G Major
songs.push(song(p1, 'Rocky Top', 'Boudleaux Bryant & Felice Bryant', 'Country', 59, 'Section 3: Popular Songs in the Key of G Major'));
songs.push(song(p1, 'Can You Feel the Love Tonight', 'Elton John', 'Film/Pop', 60));
songs.push(song(p1, 'Thinking Out Loud', 'Ed Sheeran', 'Pop', 62));
songs.push(song(p1, 'Unchained Melody', 'Alex North', 'Pop', 64));
songs.push(song(p1, 'Angel of Music', 'Andrew Lloyd Webber', 'Musical Theatre', 66));
songs.push(song(p1, 'Beauty and the Beast', 'Alan Menken', 'Film', 70));
songs.push(song(p1, 'Chariots of Fire', 'Vangelis', 'Film', 74));
songs.push(song(p1, 'What a Wonderful World', 'Bob Thiele & George David Weiss', 'Jazz/Pop', 76));

// ============================================================
// POPULAR BOOK 2 (faber-popular-2, FF3033)
// ============================================================
const p2 = 'faber-popular-2';
songs.push(song(p2, 'Over the Rainbow', 'Harold Arlen', 'Film/Musical Theatre', 4));
songs.push(song(p2, "Ain't No Mountain High Enough", 'Ashford & Simpson', 'Pop/Soul', 6));
songs.push(song(p2, "Don't Cry for Me Argentina", 'Andrew Lloyd Webber', 'Musical Theatre', 8));
songs.push(song(p2, 'Ashokan Farewell', 'Jay Ungar', 'Folk', 10));
songs.push(song(p2, 'Let It Go', 'Kristen Anderson-Lopez & Robert Lopez', 'Film', 12));
songs.push(song(p2, 'Somewhere, My Love', 'Maurice Jarre', 'Film', 16));
songs.push(song(p2, "Singin' in the Rain", 'Nacio Herb Brown', 'Film/Musical Theatre', 18));
songs.push(song(p2, 'Batman Theme', 'Neal Hefti', 'Film/TV', 20));
songs.push(song(p2, 'Bridge Over Troubled Water', 'Paul Simon', 'Pop/Folk', 22));
songs.push(song(p2, 'All I Have to Do Is Dream', 'Boudleaux Bryant', 'Pop', 24));
songs.push(song(p2, 'I Will Survive', 'Freddie Perren & Dino Fekaris', 'Disco/Pop', 26));
songs.push(song(p2, 'Your Song', 'Elton John', 'Pop', 29));
songs.push(song(p2, 'The James Bond Theme', 'Monty Norman', 'Film', 32));
songs.push(song(p2, 'Hey Jude', 'John Lennon & Paul McCartney', 'Pop/Rock', 34));
songs.push(song(p2, 'Sweet Caroline', 'Neil Diamond', 'Pop', 38));
songs.push(song(p2, 'Make You Feel My Love', 'Bob Dylan', 'Pop', 40));
songs.push(song(p2, 'A Whole New World', 'Alan Menken', 'Film', 43));
songs.push(song(p2, 'Stand By Me', 'Ben E. King', 'Pop/Soul', 46));
songs.push(song(p2, 'I Will Always Love You', 'Dolly Parton', 'Pop/Country', 50));
songs.push(song(p2, 'Thriller', 'Rod Temperton', 'Pop', 52));
songs.push(song(p2, 'Rolling in the Deep', 'Adele', 'Pop', 55));
songs.push(song(p2, 'Send in the Clowns', 'Stephen Sondheim', 'Musical Theatre', 58));
songs.push(song(p2, 'Smooth', 'Rob Thomas & Itaal Shur', 'Pop/Latin', 60));
songs.push(song(p2, 'You Raise Me Up', 'Rolf Løvland', 'Pop', 63));
songs.push(song(p2, 'The Sound of Silence', 'Paul Simon', 'Folk/Rock', 66));
songs.push(song(p2, 'Piano Man', 'Billy Joel', 'Pop/Rock', 70));
songs.push(song(p2, 'When a Man Loves a Woman', 'Calvin Lewis & Andrew Wright', 'Pop/Soul', 74));

// ============================================================
// CHRISTMAS BOOK 1 (faber-christmas-1, FF1370)
// ============================================================
const x1 = 'faber-christmas-1';
// Section 1: Beginning Christmas Songs
songs.push(song(x1, 'We Wish You a Merry Christmas', 'Traditional', 'Christmas', 6, 'Section 1: Beginning Christmas Songs'));
songs.push(song(x1, 'Angels We Have Heard on High', 'Traditional', 'Christmas', 8));
songs.push(song(x1, 'Away in a Manger', 'Traditional', 'Christmas', 10));
songs.push(song(x1, 'Jingle Bells', 'James Lord Pierpont', 'Christmas', 12));
songs.push(song(x1, 'We Three Kings of Orient Are', 'John Henry Hopkins Jr.', 'Christmas', 14));
songs.push(song(x1, "(There's No Place Like) Home for the Holidays", 'Al Stillman & Robert Allen', 'Christmas', 16));
songs.push(song(x1, 'It Came Upon the Midnight Clear', 'Richard Storrs Willis', 'Christmas', 18));
songs.push(song(x1, 'O Little Town of Bethlehem', 'Lewis Redner', 'Christmas', 20));
songs.push(song(x1, 'O Come, All Ye Faithful (Adeste Fideles)', 'John Francis Wade', 'Christmas', 22));
songs.push(song(x1, 'Bring a Torch, Jeannette, Isabella', 'Traditional', 'Christmas', 24));
songs.push(song(x1, 'Go, Tell It on the Mountain', 'Traditional', 'Christmas', 26));
// Section 2: Christmas Songs in the Key of C Major
songs.push(song(x1, 'Good King Wenceslas', 'Traditional', 'Christmas', 31, 'Section 2: Christmas Songs in the Key of C Major'));
songs.push(song(x1, 'Silent Night', 'Franz Xaver Gruber', 'Christmas', 32));
songs.push(song(x1, 'Joy to the World', 'George Frideric Handel', 'Christmas', 34));
songs.push(song(x1, 'Ding, Dong Merrily on High', 'Traditional', 'Christmas', 36));
songs.push(song(x1, "Santa Claus Is Comin' to Town", 'J. Fred Coots & Haven Gillespie', 'Christmas', 38));
songs.push(song(x1, 'The Twelve Days of Christmas', 'Traditional', 'Christmas', 40));
songs.push(song(x1, 'Jingle-Bell Rock', 'Joe Beal & Jim Boothe', 'Christmas', 44));
songs.push(song(x1, 'Frosty the Snowman', 'Steve Nelson & Jack Rollins', 'Christmas', 47));
songs.push(song(x1, 'O Christmas Tree (O Tannenbaum)', 'Traditional', 'Christmas', 50));
songs.push(song(x1, '(All I Want for Christmas Is) My Two Front Teeth', 'Don Gardner', 'Christmas', 52));
songs.push(song(x1, "I'll Be Home for Christmas", 'Kim Gannon & Walter Kent', 'Christmas', 54));
// Section 3: Christmas Songs in the Key of G Major
songs.push(song(x1, 'Deck the Hall', 'Traditional', 'Christmas', 59, 'Section 3: Christmas Songs in the Key of G Major'));
songs.push(song(x1, 'I Saw Three Ships', 'Traditional', 'Christmas', 60));
songs.push(song(x1, 'The First Noel', 'Traditional', 'Christmas', 62));
songs.push(song(x1, 'The Little Drummer Boy', 'Katherine Kennicott Davis', 'Christmas', 64));
songs.push(song(x1, 'Trepak (from The Nutcracker Suite)', 'Pyotr Ilyich Tchaikovsky', 'Christmas', 66));
songs.push(song(x1, 'Hark! The Herald Angels Sing', 'Felix Mendelssohn', 'Christmas', 68));
songs.push(song(x1, 'Suzy Snowflake', 'Sid Tepper & Roy C. Bennett', 'Christmas', 70));
songs.push(song(x1, 'Blue Christmas', 'Billy Hayes & Jay Johnson', 'Christmas', 72));
songs.push(song(x1, 'Have Yourself a Merry Little Christmas', 'Hugh Martin & Ralph Blane', 'Christmas', 74));
songs.push(song(x1, 'Auld Lang Syne', 'Traditional', 'Christmas', 76));

// ============================================================
// CHRISTMAS BOOK 2 (faber-christmas-2, FF1371)
// ============================================================
const x2 = 'faber-christmas-2';
// Section 1: Traditional Christmas Carols
songs.push(song(x2, 'Angels We Have Heard on High', 'Traditional', 'Christmas', 6, 'Section 1: Traditional Christmas Carols'));
songs.push(song(x2, 'Away in a Manger', 'Traditional', 'Christmas', 8));
songs.push(song(x2, 'Silent Night', 'Franz Xaver Gruber', 'Christmas', 10));
songs.push(song(x2, 'The First Noel', 'Traditional', 'Christmas', 12));
songs.push(song(x2, 'What Child Is This', 'Traditional', 'Christmas', 14));
songs.push(song(x2, 'Pat-a-Pan', 'Traditional', 'Christmas', 16));
songs.push(song(x2, 'O Little Town of Bethlehem', 'Lewis Redner', 'Christmas', 17));
songs.push(song(x2, 'O Come, All Ye Faithful (Adeste Fideles)', 'John Francis Wade', 'Christmas', 18));
songs.push(song(x2, 'God Rest Ye Merry, Gentlemen', 'Traditional', 'Christmas', 20));
songs.push(song(x2, 'Joy to the World', 'George Frideric Handel', 'Christmas', 22));
songs.push(song(x2, 'Hark! The Herald Angels Sing', 'Felix Mendelssohn', 'Christmas', 24));
songs.push(song(x2, 'The Coventry Carol', 'Traditional', 'Christmas', 26));
songs.push(song(x2, 'It Came Upon the Midnight Clear', 'Richard Storrs Willis', 'Christmas', 28));
songs.push(song(x2, 'O Holy Night', 'Adolphe Adam', 'Christmas', 30));
// Section 2: Popular Christmas Songs
songs.push(song(x2, 'Let It Snow! Let It Snow! Let It Snow!', 'Jule Styne & Sammy Cahn', 'Christmas', 36, 'Section 2: Popular Christmas Songs'));
songs.push(song(x2, 'Jingle Bell Boogie', 'James Lord Pierpont', 'Christmas', 38));
songs.push(song(x2, 'Have Yourself a Merry Little Christmas', 'Hugh Martin & Ralph Blane', 'Christmas', 40));
songs.push(song(x2, 'Frosty the Snowman', 'Steve Nelson & Jack Rollins', 'Christmas', 42));
songs.push(song(x2, 'We Wish You a Merry Christmas', 'Traditional', 'Christmas', 44));
songs.push(song(x2, 'Winter Wonderland', 'Felix Bernard & Richard B. Smith', 'Christmas', 48));
songs.push(song(x2, 'The Twelve Days of Christmas', 'Traditional', 'Christmas', 51));
songs.push(song(x2, 'Jingle-Bell Rock', 'Joe Beal & Jim Boothe', 'Christmas', 54));
songs.push(song(x2, 'Sleigh Ride', 'Leroy Anderson', 'Christmas', 56));
// Section 3: Seasonal Favorites
songs.push(song(x2, 'Waltz of the Flowers', 'Pyotr Ilyich Tchaikovsky', 'Christmas', 62, 'Section 3: Seasonal Favorites'));
songs.push(song(x2, 'Dance of the Sugar Plum Fairy', 'Pyotr Ilyich Tchaikovsky', 'Christmas', 64));
songs.push(song(x2, 'Ukrainian Bell Carol', 'Traditional', 'Christmas', 66));
songs.push(song(x2, "The Skaters' Waltz", 'Émile Waldteufel', 'Christmas', 68));
songs.push(song(x2, 'Hallelujah Chorus', 'George Frideric Handel', 'Christmas', 72));
songs.push(song(x2, "Jesu, Joy of Man's Desiring", 'Johann Sebastian Bach', 'Christmas', 74));
songs.push(song(x2, 'Auld Lang Syne', 'Traditional', 'Christmas', 76));

// ============================================================
// COURSE BOOK 1 (faber-lesson-1, FF1302) - Named pieces only
// ============================================================
const l1 = 'faber-lesson-1';
songs.push(song(l1, 'Amazing Grace', 'Traditional', 'Hymn', 12, 'Unit 1'));
songs.push(song(l1, 'Camptown Races', 'Stephen Foster', 'Folk', 15, 'Unit 1'));
songs.push(song(l1, 'Ode to Joy', 'Ludwig van Beethoven', 'Classical', 24, 'Unit 1'));
songs.push(song(l1, 'Catch a Falling Star', 'Paul Vance & Lee Pockriss', 'Pop', 35, 'Unit 2'));
songs.push(song(l1, 'Russian Folk Song', 'Traditional', 'Folk', 36, 'Unit 2'));
songs.push(song(l1, 'Shining Stars', 'Faber', 'Original', 44, 'Unit 3'));
songs.push(song(l1, 'Roman Trumpets', 'Faber', 'Original', 46, 'Unit 3'));
songs.push(song(l1, 'Eine Kleine Nachtmusik', 'Wolfgang Amadeus Mozart', 'Classical', 52, 'Unit 4'));
songs.push(song(l1, 'New World Symphony Theme', 'Antonín Dvořák', 'Classical', 54, 'Unit 4'));
songs.push(song(l1, 'Jingle Bells', 'James Lord Pierpont', 'Christmas', 57, 'Unit 4'));
songs.push(song(l1, 'Royal Procession', 'Faber', 'Original', 58, 'Unit 4'));
songs.push(song(l1, '"Surprise" Symphony (Theme from the)', 'Joseph Haydn', 'Classical', 64, 'Unit 5'));
songs.push(song(l1, 'Hungarian Dance', 'Johannes Brahms', 'Classical', 65, 'Unit 5'));
songs.push(song(l1, "Shepherd's Song", 'Traditional', 'Folk', 66, 'Unit 5'));
songs.push(song(l1, 'French Minuet', 'Traditional', 'Classical', 71, 'Unit 6'));
songs.push(song(l1, 'Morning', 'Edvard Grieg', 'Classical', 72, 'Unit 6'));
songs.push(song(l1, 'Taps', 'Traditional', 'Traditional', 74, 'Unit 6'));
songs.push(song(l1, 'Happy Birthday', 'Patty Hill & Mildred J. Hill', 'Traditional', 75, 'Unit 6'));
songs.push(song(l1, 'English Folk Song', 'Traditional', 'Folk', 76, 'Unit 6'));
songs.push(song(l1, 'Gavotte', 'Traditional', 'Classical', 77, 'Unit 6'));
songs.push(song(l1, 'Simple Gifts', 'Traditional', 'Folk', 78, 'Unit 6'));
songs.push(song(l1, 'Moon on the Water', 'Faber', 'Original', 82, 'Unit 7'));
songs.push(song(l1, '500-Year-Old Melody', 'Traditional', 'Classical', 84, 'Unit 7'));
songs.push(song(l1, 'Reveille', 'Traditional', 'Traditional', 86, 'Unit 7'));
songs.push(song(l1, 'May Dance', 'Traditional', 'Folk', 90, 'Unit 8'));
songs.push(song(l1, 'When the Saints Go Marching In', 'Traditional', 'Traditional', 91, 'Unit 8'));
songs.push(song(l1, 'African Celebration', 'Faber', 'Original', 92, 'Unit 8'));
songs.push(song(l1, 'Musette', 'Johann Sebastian Bach', 'Classical', 98, 'Unit 9'));
songs.push(song(l1, 'American Fiddle Tune', 'Traditional', 'Folk', 99, 'Unit 9'));
songs.push(song(l1, 'Theme by Mozart', 'Wolfgang Amadeus Mozart', 'Classical', 100, 'Unit 9'));
songs.push(song(l1, 'Greensleeves', 'Traditional', 'Folk', 106, 'Unit 10'));
songs.push(song(l1, 'Romance', 'Traditional', 'Classical', 109, 'Unit 10'));
songs.push(song(l1, 'Sleeping Beauty Waltz', 'Pyotr Ilyich Tchaikovsky', 'Classical', 110, 'Unit 10'));
songs.push(song(l1, 'Summer Mountain Rain', 'Faber', 'Original', 112, 'Unit 10'));
songs.push(song(l1, 'Promenade', 'Faber', 'Original', 117, 'Unit 11'));
songs.push(song(l1, 'Danny Boy', 'Traditional', 'Folk', 119, 'Unit 11'));
songs.push(song(l1, 'The Marriage of Figaro (Aria from)', 'Wolfgang Amadeus Mozart', 'Classical', 121, 'Unit 11'));
songs.push(song(l1, 'The Lion Sleeps Tonight', 'Solomon Linda', 'Pop', 123, 'Unit 11'));
songs.push(song(l1, "Nobody Knows the Trouble I've Seen", 'Traditional', 'Spiritual', 124, 'Unit 11'));
songs.push(song(l1, 'Vive la France!', 'Traditional', 'Folk', 130, 'Unit 12'));
songs.push(song(l1, 'Trumpet Voluntary', 'Jeremiah Clarke', 'Classical', 135, 'Unit 13'));
songs.push(song(l1, 'Can-Can', 'Jacques Offenbach', 'Classical', 136, 'Unit 13'));
songs.push(song(l1, 'Ice Skaters', 'Émile Waldteufel', 'Classical', 138, 'Unit 13'));
songs.push(song(l1, 'Rise and Shine', 'Traditional', 'Folk', 145, 'Unit 14'));
songs.push(song(l1, 'Trumpet Concerto (Theme from)', 'Joseph Haydn', 'Classical', 146, 'Unit 14'));
songs.push(song(l1, 'The Entertainer', 'Scott Joplin', 'Ragtime', 148, 'Unit 14'));
songs.push(song(l1, 'Home on the Range', 'Traditional', 'Folk', 150, 'Unit 14'));
songs.push(song(l1, 'Minuet in G', 'Johann Sebastian Bach', 'Classical', 156, 'Unit 15'));
songs.push(song(l1, 'Alexander March', 'Faber', 'Original', 161, 'Unit 16'));
songs.push(song(l1, 'Amazing Grace (Key of G)', 'Traditional', 'Hymn', 162, 'Unit 16: Advanced arrangement in G major'));
songs.push(song(l1, 'French Dance', 'Traditional', 'Classical', 165, 'Unit 16'));
songs.push(song(l1, 'Polovtsian Dance', 'Alexander Borodin', 'Classical', 166, 'Unit 16'));
songs.push(song(l1, "For He's a Jolly Good Fellow", 'Traditional', 'Folk', 168, 'Unit 16'));
songs.push(song(l1, 'Banuwa (Village)', 'Traditional', 'World', 170, 'Unit 16'));
songs.push(song(l1, 'The Carnival of Venice', 'Traditional', 'Classical', 174, 'Review Piece'));

// ============================================================
// COURSE BOOK 2 (faber-lesson-2, FF1334) - Named pieces only
// ============================================================
const l2 = 'faber-lesson-2';
songs.push(song(l2, 'Cathedral Chimes', 'Faber', 'Original', 15, 'Unit 2'));
songs.push(song(l2, 'Niagara Falls', 'Faber', 'Original', 16, 'Unit 2'));
songs.push(song(l2, 'Taps', 'Traditional', 'Traditional', 19, 'Unit 2'));
songs.push(song(l2, "'O Sole Mio!", 'Eduardo di Capua', 'Classical', 20, 'Unit 2'));
songs.push(song(l2, 'Mockingbird', 'Traditional', 'Folk', 22, 'Unit 2'));
songs.push(song(l2, "Brahms' Lullaby", 'Johannes Brahms', 'Classical', 26, 'Applied Music Theory'));
songs.push(song(l2, 'Sloop John B', 'Traditional', 'Folk', 30, 'Unit 3'));
songs.push(song(l2, 'Allegro in F Major', 'Ferdinand Beyer', 'Classical', 34, 'Unit 3'));
songs.push(song(l2, 'The Lion Sleeps Tonight', 'Solomon Linda', 'Pop', 36, 'Unit 3'));
songs.push(song(l2, 'Londonderry Air', 'Traditional', 'Folk', 40, 'Applied Music Theory'));
songs.push(song(l2, 'Malagueña', 'Ernesto Lecuona', 'Classical', 44, 'Unit 4'));
songs.push(song(l2, 'Long, Long Ago', 'Thomas Haynes Bayly', 'Folk', 46, 'Unit 4'));
songs.push(song(l2, 'Aura Lee', 'George R. Poulton', 'Folk', 50, 'Applied Music Theory'));
songs.push(song(l2, 'Westminster Chimes', 'Traditional', 'Classical', 53, 'Unit 5'));
songs.push(song(l2, 'Gavotte', 'Benjamin Carr', 'Classical', 55, 'Unit 5'));
songs.push(song(l2, 'Swing Low, Sweet Chariot', 'Traditional', 'Spiritual', 56, 'Unit 5'));
songs.push(song(l2, 'Song of Joy', 'Ludwig van Beethoven', 'Classical', 60, 'Applied Music Theory'));
songs.push(song(l2, 'Coffee House Boogie', 'Faber', 'Original', 62, 'Unit 6'));
songs.push(song(l2, 'Amen', 'Traditional', 'Spiritual', 64, 'Unit 6'));
songs.push(song(l2, 'Looking Glass River', 'Faber', 'Original', 66, 'Unit 6'));
songs.push(song(l2, 'Shenandoah', 'Traditional', 'Folk', 70, 'Applied Music Theory'));
songs.push(song(l2, 'Kum Ba Yah', 'Traditional', 'Spiritual', 74, 'Unit 7'));
songs.push(song(l2, 'Theme from Scheherazade', 'Nikolai Rimsky-Korsakov', 'Classical', 76, 'Unit 7'));
songs.push(song(l2, 'In My Red Convertible', 'Faber', 'Original', 78, 'Unit 7'));
songs.push(song(l2, 'Auld Lang Syne', 'Traditional', 'Folk', 82, 'Applied Music Theory'));
songs.push(song(l2, 'Sakura', 'Traditional', 'World', 86, 'Unit 8'));
songs.push(song(l2, 'Etude in A Minor', 'Louis Köhler', 'Classical', 88, 'Unit 8'));
songs.push(song(l2, "Finale: 'From The New World' Symphony", 'Antonín Dvořák', 'Classical', 92, 'Unit 8'));
songs.push(song(l2, 'Hava Nagila', 'Traditional', 'World', 94, 'Unit 8'));
songs.push(song(l2, 'Greensleeves', 'Traditional', 'Folk', 98, 'Applied Music Theory'));
songs.push(song(l2, '7th St. Blues', 'Faber', 'Blues', 100, 'Unit 9'));
songs.push(song(l2, 'Land of the Silver Birch', 'Traditional', 'Folk', 101, 'Unit 9'));
songs.push(song(l2, 'Give My Regards to Broadway', 'George M. Cohan', 'Musical Theatre', 102, 'Unit 9'));
songs.push(song(l2, 'Mexican Clapping Song', 'Traditional', 'World', 106, 'Applied Music Theory'));
songs.push(song(l2, 'Habanera from Carmen', 'Georges Bizet', 'Classical', 112, 'Unit 10'));
songs.push(song(l2, 'Joshua Fought the Battle of Jericho', 'Traditional', 'Spiritual', 114, 'Unit 10'));
songs.push(song(l2, 'Dark Eyes', 'Traditional', 'Folk', 118, 'Applied Music Theory'));
songs.push(song(l2, 'Scarborough Fair', 'Traditional', 'Folk', 120, 'Unit 11'));
songs.push(song(l2, 'Campbells are Coming', 'Traditional', 'Folk', 124, 'Unit 11'));
songs.push(song(l2, 'Funiculi, Funiculà', 'Luigi Denza', 'Classical', 126, 'Unit 11'));
songs.push(song(l2, 'Barcarolle', 'Jacques Offenbach', 'Classical', 130, 'Applied Music Theory'));
songs.push(song(l2, 'March Slav', 'Pyotr Ilyich Tchaikovsky', 'Classical', 133, 'Unit 12'));
songs.push(song(l2, 'The Erie Canal', 'Traditional', 'Folk', 134, 'Unit 12'));
songs.push(song(l2, 'Morning', 'Edvard Grieg', 'Classical', 136, 'Unit 12'));
songs.push(song(l2, 'The Glow Worm', 'Paul Lincke', 'Classical', 140, 'Applied Music Theory'));
songs.push(song(l2, 'Lunar Eclipse', 'Faber', 'Original', 146, 'Unit 13'));
songs.push(song(l2, 'Swan Lake', 'Pyotr Ilyich Tchaikovsky', 'Classical', 148, 'Unit 13'));
songs.push(song(l2, 'House of the Rising Sun', 'Traditional', 'Folk', 152, 'Applied Music Theory'));
songs.push(song(l2, 'Song of Joy (Beethoven)', 'Ludwig van Beethoven', 'Classical', 158, 'Unit 14'));
songs.push(song(l2, 'Gavotte in D Major', 'James Hook', 'Classical', 160, 'Unit 14'));
songs.push(song(l2, 'Worried Man Blues', 'Traditional', 'Blues', 164, 'Applied Music Theory'));
songs.push(song(l2, 'Eine Kleine Nachtmusik', 'Wolfgang Amadeus Mozart', 'Classical', 167, 'Unit 15'));
songs.push(song(l2, 'Wedding March', 'Felix Mendelssohn', 'Classical', 168, 'Unit 15'));
songs.push(song(l2, 'Fiesta España', 'Faber', 'Original', 170, 'Unit 15'));
songs.push(song(l2, 'Liebestraum', 'Franz Liszt', 'Classical', 174, 'Applied Music Theory'));
songs.push(song(l2, 'Sea Chantey', 'Traditional', 'Folk', 178, 'Unit 16'));
songs.push(song(l2, "Musetta's Song", 'Giacomo Puccini', 'Classical', 180, 'Unit 16'));
songs.push(song(l2, 'Nocturne', 'Frédéric Chopin', 'Classical', 184, 'Applied Music Theory'));
songs.push(song(l2, 'Pachelbel Canon', 'Johann Pachelbel', 'Classical', 186, 'Review Piece'));

// Combine with preserved Alfred songs
const allSongs = [...songs, ...alfredSongs];

// Deduplicate IDs by appending book suffix if needed
const seen = new Map();
for (const s of allSongs) {
  if (seen.has(s.id)) {
    // Make ID unique by appending book distinction
    const bookSuffix = s.bookId.includes('lesson-2') ? '-bk2' : s.bookId.includes('christmas-2') ? '-xmas2' : '-v2';
    s.id = s.id + bookSuffix;
  }
  seen.set(s.id, true);
}

// Verify no duplicates remain
const ids = allSongs.map(s => s.id);
const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dups.length > 0) {
  console.error('DUPLICATE IDS:', [...new Set(dups)]);
  process.exit(1);
}

writeFileSync('src/data/songs.json', JSON.stringify(allSongs, null, 2) + '\n');
console.log(`Generated ${allSongs.length} songs total:`);
const byBook = {};
for (const s of allSongs) {
  byBook[s.bookId] = (byBook[s.bookId] || 0) + 1;
}
for (const [book, count] of Object.entries(byBook).sort()) {
  const withPages = allSongs.filter(s => s.bookId === book && s.pageNumber !== null).length;
  console.log(`  ${book}: ${count} songs (${withPages} with page numbers)`);
}
