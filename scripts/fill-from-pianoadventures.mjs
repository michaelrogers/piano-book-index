#!/usr/bin/env node
/**
 * Fill gaps in songs.json using official track listings from pianoadventures.com
 * Source: https://pianoadventures.com/piano-books/pretime-to-bigtime/{level}-song-list/
 *
 * Only adds songs to books that already exist in books.json.
 * Sets trackListingSource to "pianoadventures.com" on books that get new songs.
 */

import { readFileSync, writeFileSync } from 'fs';

const BOOKS_PATH = new URL('../src/data/books.json', import.meta.url);
const SONGS_PATH = new URL('../src/data/songs.json', import.meta.url);

const books = JSON.parse(readFileSync(BOOKS_PATH, 'utf8'));
const songs = JSON.parse(readFileSync(SONGS_PATH, 'utf8'));

const bookMap = new Map(books.map(b => [b.id, b]));
const existingSongsByBook = new Map();
for (const s of songs) {
  if (!existingSongsByBook.has(s.bookId)) existingSongsByBook.set(s.bookId, new Set());
  existingSongsByBook.get(s.bookId).add(normalize(s.title));
}

function normalize(title) {
  return title
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Series config: bookIdPrefix → { difficulty, faberLevel }
const SERIES = {
  'pretime-piano': { difficulty: 'Beginner', faberLevel: 'Primer Level' },
  'duettime-piano': { difficulty: 'Beginner', faberLevel: 'Primer Level' },
  'playtime-piano': { difficulty: 'Beginner', faberLevel: 'Level 1' },
  'showtime-piano': { difficulty: 'Early Intermediate', faberLevel: 'Level 2A' },
  'chordtime-piano': { difficulty: 'Early Intermediate', faberLevel: 'Level 2B' },
  'funtime-piano': { difficulty: 'Intermediate', faberLevel: 'Level 3A-3B' },
  'bigtime-piano': { difficulty: 'Late Intermediate', faberLevel: 'Level 4' },
};

// Official song lists from pianoadventures.com, keyed by bookId
const officialData = {
  // ===== PRETIME (Primer) =====
  'pretime-piano-christmas': [
    'Away in a Manger', 'Good King Wenceslas', 'I Saw Three Ships', 'Jingle Bells',
    'Jolly Old Saint Nicholas', 'Over the River and Through the Woods', 'Silent Night',
    'Up on the Housetop', 'We Three Kings of Orient Are',
  ],
  'duettime-piano-christmas': [
    'Go, Tell It on the Mountain', 'God Rest Ye Merry, Gentlemen', 'Good King Wenceslas',
    'Jingle Bells', 'Jolly Old Saint Nicholas', 'O Come, Little Children',
    'We Wish You a Merry Christmas',
  ],
  'pretime-piano-classics': [
    'Bridal Chorus', 'The Can-Can', 'Horn Call', 'A Little Night Music',
    'Morning', 'Ode to Joy', "Shepherd's Song", 'Theme from the "London" Symphony',
    'Trumpet Voluntary',
  ],
  'pretime-piano-disney': [
    'Do You Want to Build a Snowman?', "I Just Can't Wait to Be King", 'I See the Light',
    "It's a Small World", 'Scales and Arpeggios', 'Step in Time', 'The Siamese Cat Song',
    'Supercalifragilisticexpialidocious', 'Winnie the Pooh',
  ],
  'pretime-piano-favorites': [
    'Alouette', 'Baa! Baa! Black Sheep', 'Eensie Weensie Spider', 'Hush, Little Baby',
    'London Bridge', 'The Muffin Man', 'On the Bridge', 'Pop! Goes the Weasel',
    'Row, Row, Row Your Boat', 'Shoo, Fly', 'Wheels on the Bus', 'Yankee Doodle',
  ],
  'pretime-piano-hymns': [
    'The B-I-B-L-E', 'Deep and Wide', 'God Is So Good', "I've Got the Joy, Joy, Joy",
    'Jesus Wants Me for a Sunbeam', 'O, How I Love Jesus',
    'Praise God, from Whom All Blessings Flow', 'Praise Him, Praise Him',
    'Rejoice in the Lord Always', 'Whisper a Prayer',
  ],
  'pretime-piano-jazz-blues': [
    'Cool Breeze Waltz', 'Dinosaur Stomp', 'A Fishy Story', 'Hound Dog Blues',
    'Ice Cream Blues', 'Jazz Man', 'Jazz Walk', 'King of Hearts', 'Penguin Blues',
    'So Many Toys',
  ],
  'pretime-piano-kids-songs': [
    'A-Tisket, A-Tasket', 'Bingo', "The Dwarfs' Yodel Song", 'Happy Birthday to You',
    'Mail Myself to You', 'Mickey Mouse March', 'On Top of Spaghetti', 'The Train Song',
    'Winnie the Pooh',
  ],
  'pretime-piano-music-from-china': [
    "The Bride's Farewell", 'Come Here Quickly', 'Panda Talk', 'Ping-Pong Song',
    "Shepherd's Song", 'The Young Pioneer Has Departed',
  ],
  'pretime-piano-popular': [
    'The Candy Man', 'Groove Tune', "I Just Can't Wait to Be King",
    'If I Only Had a Brain', "It's a Small World", 'The Merry-Go-Round Broke Down',
    'Oompa-Loompa Doompadee-Doo', 'Part of Your World',
    "The Pirates Who Don't Do Anything", 'Scooby Doo Main Title',
  ],
  'pretime-piano-rock-n-roll': [
    "Celebrate with Rock 'n Roll!", 'Engine Number Nine', 'Hard Rock Candy',
    'Old MacDonald Had to Rock', 'Pebbles, Stones, and Rocks', 'Recess Rock',
    "Rockin' in Your Socks", "Rockin' on the Soccer Field", 'Stegosaur Rock',
  ],
  'pretime-piano-faber-studio-collection': [
    'Hard Rock Candy', 'Hound Dog Blues', 'Hush Little Baby',
    "I've Got the Joy, Joy, Joy", 'Jazz Man', 'A Little Night Music',
    'On Top of Spaghetti', 'Part of Your World', 'Row, Row, Row Your Boat',
    'When Can I See You Again?',
  ],

  // ===== PLAYTIME (Level 1) =====
  'playtime-piano-christmas': [
    'Away in a Manger', 'The First Noel', 'A Holly Jolly Christmas', 'Jingle Bells',
    'Joy to the World', 'The Night Before Christmas', 'O Come, All Ye Faithful',
    "Rockin' Around the Christmas Tree", 'Rudolph the Red-Nosed Reindeer',
    'Silent Night', 'We Wish You a Merry Christmas', 'When Santa Claus Gets Your Letter',
  ],
  'playtime-piano-classics': [
    'Country Dance', 'The Elephant', 'Finale, Brahms', 'Finale, Dvořák',
    'Finale, Saint-Saëns', 'La Cinquantaine', 'Lullaby', 'March Slav',
    'Romance', 'Sleeping Beauty Waltz', 'The Trout', 'Turkish March',
  ],
  'playtime-piano-disney': [
    'Beauty and the Beast', 'Gaston', 'Gummi Bears Theme',
    "I Just Can't Wait to Be King", 'Let It Go', "Let's Go Fly a Kite",
    'Part of Your World', 'Remember Me (Ernesto de la Cruz)',
    'A Spoonful of Sugar',
  ],
  'playtime-piano-favorites': [
    'Are You Sleeping?', 'Aura Lee', 'Camptown Races', 'Down in the Valley',
    'Good-Night, Ladies!', "Grandfather's Clock", 'Home on the Range', 'Oh! Susanna',
    'Oh Dear, What Can the Matter Be?', 'Reveille',
    "She'll Be Comin' 'Round the Mountain", 'Sleep, Baby Sleep', 'Snake Dance',
    'Sweetly Sings the Donkey', 'Taps', 'This Old Man', 'When the Saints Go Marching In',
  ],
  'playtime-piano-hymns': [
    'Come Thou Almighty King', 'Do Lord', 'Fairest Lord Jesus',
    'For the Beauty of the Earth', 'Holy, Holy, Holy', 'Jesus Loves Me',
    'Joyful, Joyful We Adore Thee', 'O Worship the King',
    'Stand Up, Stand Up for Jesus', 'This Little Light of Mine',
    'What a Friend We Have in Jesus',
  ],
  'playtime-piano-jazz-blues': [
    "Ain't She Sweet", 'The Blues Monster', 'Boogie-Woogie Fever',
    "Don't Sit Under the Apple Tree", 'Five Foot Two, Eyes of Blue',
    "I'm Always Chasing Rainbows", "It Don't Mean a Thing…",
    "It's Only a Paper Moon", 'Jeepers Creepers', 'Moon River',
    'Sugarfoot Rag', 'The Way You Look Tonight',
  ],
  'playtime-piano-kids-songs': [
    'Bob the Builder', 'C Is for Cookie', 'Ferdinand the Bull',
    'I Can Be Your Friend', 'I Swallowed My Gum!', "Let's Go Fly a Kite",
    'The Lord Is Good to Me', 'M-I-S-S-I-S-S-I-P-P-I',
    'Oh, What a Beautiful Morning', 'Scooby Doo', 'Ten Chocolate Cookies',
  ],
  'playtime-piano-music-from-china': [
    'Fengyang Flower-Drum', 'Frog Dance', "Let's Sing", 'Panda Drum Song',
    'Pouch Embroidering', 'Song of the Newsboy', 'Tune from Xinjiang',
    'What Is the Most Beautiful',
  ],
  'playtime-piano-popular': [
    'ABC', 'Do-Re-Mi', '(Meet) The Flintstones', 'Music Box Dancer',
    'Puff, the Magic Dragon', 'Rocky Top', 'Star Wars',
    'Supercalifragilisticexpialidocious', 'Take Me Out to the Ball Game',
    'This Land Is Your Land',
  ],
  'playtime-piano-rock-n-roll': [
    'Blue Suede Shoes', 'Come Go with Me', 'Cool Strut', 'The Green Mosquito',
    'Peanut Butter', 'The Purple People Eater', 'Rock Around the Clock',
    "Rockin' Robin", 'Surfer Girl', 'Walk Right In',
  ],
  'playtime-piano-faber-studio-collection': [
    'Are You Sleeping?', 'Do-Re-Mi', 'The Elephant', 'Five Foot Two',
    "Let's Go Fly a Kite", 'Purple People Eater', "Rockin' Robin",
    'Safe and Sound',
  ],

  // ===== SHOWTIME (Level 2A) =====
  'showtime-piano-christmas': [
    'Angels We Have Heard on High', 'Coventry Carol', 'Ding, Dong Merrily on High',
    'Frosty the Snowman', 'God Bless All', 'It Came Upon the Midnight Clear',
    'The Little Drummer Boy', "Little Elf's Christmas", 'Must Be Santa',
    "Santa Claus Is Comin' to Town", 'Silent Night', 'Up on the Housetop',
    'We Three Kings of Orient Are',
  ],
  'showtime-piano-classics': [
    'Canon, Pachelbel', 'Egyptian Ballet Dance', 'Liebestraum',
    'The Merry Widow Waltz', 'Minuet, Paderewski', "Prince of Denmark's March",
    'Spring, Vivaldi', "Suitor's Song", 'Theme from Don Giovanni',
    'Theme from Symphony No. 1, Mahler',
  ],
  'showtime-piano-disney': [
    'Almost There', 'Baroque Hoedown', 'Chim Chim Cher-ee', 'Colors of the Wind',
    "He's a Pirate!", 'Proud Corazón', 'Reflection', 'Under the Sea',
    'A Whole New World',
  ],
  'showtime-piano-favorites': [
    'The Ash Grove', "Bill Groggin's Goat", 'Boom Boom!', 'Centipede and the Frog',
    'Give My Regards to Broadway', 'Go Tell Aunt Rhody', 'Irish Washerwoman',
    "Li'l Liza Jane", 'Michael Finnegan', 'Music Alone Shall Live',
    'My Ma Gave Me a Nickel', 'Off to Bed, Now', 'The Old Gray Mare',
    'Old King Cole', 'Peter, Peter', 'Shave and a Haircut', 'The Three Doughs',
  ],
  'showtime-piano-hits': [
    'Attention', 'Fake Love', 'Girls Like You', 'Havana', 'No Excuses',
    'No Roots', 'No Tears Left to Cry', 'Say Something', 'Stand By You',
    'Whatever It Takes',
  ],
  'showtime-piano-hymns': [
    'Come Into His Presence', 'Come Thou Long-Expected Jesus', 'Dona Nobis Pacem',
    'Ezekiel Saw the Wheel', 'Jesus Tender Shepherd, Hear Me',
    'Little David, Play on Your Harp', 'Lord, Speak to Me, That I May Speak',
    'Michael, Row the Boat Ashore', 'Praise God, from Whom All Blessings Flow',
    'Rock-a My Soul', 'Send the Light', 'Simple Gifts', 'This Is the Day',
    "Wasn't That a Band?",
  ],
  'showtime-piano-jazz-blues': [
    'Blue Moon', 'Bye Bye Blackbird', 'Loco-music-motion', "Mama Don't 'Low",
    'Oh, You Beautiful Doll', 'Rainbow Connection', 'Surrey with the Fringe on Top',
    "Swingin' Sam", 'When the Red, Red Robin Comes Bob, Bob Bobbin\' Along',
    'You Are the Sunshine of My Life',
  ],
  'showtime-piano-kids-songs': [
    'Bling-Blang (Build a House)', 'Chim Chim Cher-ee', 'The Hokey-Pokey',
    'Jig Along Home', 'Mail Myself to You', 'Oompa-Loompa Doompadee Doo',
    "The Pirates Who Don't Do Anything", 'Shaggy Dog Bop', 'Tomorrow',
    'What Do Witches Eat?',
  ],
  'showtime-piano-music-from-china': [
    'Counting Toads', 'Crescent Moon', 'Foot Sloggers Tune', 'The Game',
    'Nine Lotus Lantern', 'Rainy Day', 'The Toy',
  ],
  'showtime-piano-popular': [
    'Happy Birthday to You', "Hedwig's Theme", "I Just Can't Wait to Be King",
    "It's a Small World", 'La Bamba', 'Olympic Fanfare', 'Over the Rainbow',
    'Part of Your World', 'Perfect Nanny',
  ],
  'showtime-piano-rock-n-roll': [
    "Ain't No Mountain High Enough", 'At the Hop', 'Baby Elephant Walk',
    'Groovy Kind of Love', 'Lava Lamp', 'Loco-Motion', 'Lollipop',
    'Twist and Shout', 'Undercover Rock', 'Yakety Yak',
  ],
  'showtime-piano-faber-studio-collection': [
    "Cups (Pitch Perfect's When I'm Gone)", 'Egyptian Ballet Dance',
    'Give My Regards to Broadway', "I Just Can't Wait to Be King",
    'The Merry Widow Waltz', 'Oh, You Beautiful Doll', 'Simple Gifts',
    'Tomorrow', 'Twist and Shout', 'Yakety Yak',
  ],

  // ===== CHORDTIME (Level 2B) =====
  'chordtime-piano-christmas': [
    'Away in a Manger', 'Deck the Halls', 'Good King Wenceslas',
    'Holly Jolly Christmas', 'Jingle Bells', 'Jolly Old Saint Nicholas',
    'Joy to the World', 'Night Before Christmas Song',
    "Rockin' Around the Christmas Tree", 'Rudolph the Red-Nosed Reindeer',
    'Silent Night', 'The Twelve Days of Christmas', 'When Santa Claus Gets Your Letter',
  ],
  'chordtime-piano-classics': [
    'Aria', 'La Donna e Mobile', 'Largo', 'Laughing Song',
    'Little Man in the Woods', 'March Militaire', 'Overture – William Tell',
    'Pizzicato Polka', 'Polovetzian Dance No. 17', 'Rage Over the Lost Penny',
    'Roses from the South', 'Theme from "The Surprise" Symphony',
    'Theme from Trumpet Concerto in E Flat', 'Trepak',
  ],
  'chordtime-piano-disney': [
    'The Bare Necessities', 'Be Our Guest', 'Bella Notte', 'Belle',
    'Circle of Life', 'Fathoms Below', "How Far I'll Go",
    "I Just Can't Wait to Be King", "I've Got a Dream",
    'Supercalifragilisticexpialidocious',
  ],
  'chordtime-piano-favorites': [
    'America', 'Auld Lang Syne', 'Down by the Riverside', 'Duke of York',
    'Everybody Loves Saturday Night', 'The Great Meat Pie', 'Hot Cross Buns',
    'Long, Long Ago', 'Mexican Clapping Song', 'Rise and Shine', 'Skip to My Lou',
    'Three Blind Mice', 'Turkey in the Straw', 'Where Has My Little Dog Gone?',
  ],
  'chordtime-piano-hits': [
    'Brave', 'High Hopes', 'Like I\'m Gonna Lose You', 'Meant to Be',
    'The Middle', 'Perfect', 'Rather Be', 'This Is Me', 'Thunder', 'Try Everything',
  ],
  'chordtime-piano-hymns': [
    'Amazing Grace', 'Battle Hymn of the Republic', 'Blest Be the Tie That Binds',
    'Children of The Heavenly Father', 'Come Bless The Lord', 'Give Me Oil in My Lamp',
    'Go, Tell It on the Mountain', 'Hallelujah, Praise The Lord', 'He Leadeth Me',
    "He's Got the Whole World in His Hands", "I've Got Peace Like a River",
    'Jesus Loves the Little Children', 'Kum Ba Yah', 'Lord, I Want to Be a Christian',
    'O Worship The King', 'Praise to the Lord, The Almighty',
    "This Is My Father's World", 'This Train', 'We Gather Together',
  ],
  'chordtime-piano-jazz-blues': [
    "Ain't Misbehavin'", 'Baby Face', 'Dill Pickle Stomp', 'Doo Wah Diddy Diddy',
    'God Bless the Child', "Left-Hand Louisian'", "Ol' Man River", 'Tea for Two',
    'Tuxedo Junction', 'Watermelon Man', "When the Saints Go Rockin' In",
    'Where Is Love?', 'Whistle Stop Blues',
  ],
  'chordtime-piano-jewish-favorites': [
    'Artza Aleenu', 'Hanukah', 'Hanukah Candle Blessings', 'Hatikvah',
    'Havah Nageela', "Hayvaynu Shalom A'layhem", 'Hinay Mah Tov', 'Maoz Tzur',
    'My Draydl', 'Seeman Tov', 'Shabbat Shalom', 'Tumbalalaika',
  ],
  'chordtime-piano-kids-songs': [
    'Catch a Falling Star', 'Ding-Dong! The Witch Is Dead', 'Happy Birthday to You',
    "I Can't Spell Hippopotamus", 'In a Cabin in the Woods', 'Mama Paquita',
    'New River Train', 'Oh! Susanna', 'Pizza Time!', 'Rubber Duckie',
    "The Teddy Bears' Picnic", 'Tingalayo',
  ],
  'chordtime-piano-music-from-china': [
    'Divertimento', 'The Little Bird Song', 'Little Dance Song', 'Luchai Flowers',
    'The Luhua Rooster', 'Meng Jiang Lady', 'Picking Flowers', 'Talk Back',
  ],
  'chordtime-piano-popular': [
    'Angel of Music', 'Can You Feel the Love Tonight?', 'Circle of Life',
    'Do-Re-Mi', 'The Entertainer', 'Heart and Soul', 'Lean on Me',
    '(Meet) the Flintstones', 'She Loves You', 'Star Wars (Main Theme)',
    'Thinking Out Loud',
  ],
  'chordtime-piano-ragtime-marches': [
    'Alexander March', "Alexander's Ragtime Band", 'Astronaut March',
    'The Caisson Song', 'Colonel Bogey March', 'Dalmatian Rag', 'The Entertainer',
    "The Marines' Hymn", 'Original Rags', 'Raincoat Rag',
    'Stars and Stripes Forever', 'The Thunderer', "You're a Grand Old Flag",
  ],
  'chordtime-piano-rock-n-roll': [
    'Chantilly Lace', 'Come Sail Away', 'Crazy Little Thing Called Love',
    'In the Midnight Hour', 'Long Tall Texan', 'Lost in the Fifties Tonight',
    'Mr. Tambourine Man', 'Rock Around the Clock', "Surfin' Safari",
    'Wipe Out', 'Witch Doctor', 'Yesterday', 'You Really Got Me',
  ],
  'chordtime-piano-faber-studio-collection': [
    'Amazing Grace', 'Crazy Little Thing Called Love', 'Do-Re-Mi', 'The Entertainer',
    'Havah Nageela', 'Long, Long Ago', 'New River Train', 'Pizzicato Polka',
    'Polovetzian Dance No. 17', 'Tuxedo Junction', 'Watermelon Man',
    'What Makes You Beautiful', 'Yesterday',
  ],

  // ===== FUNTIME (Level 3A-3B) =====
  'funtime-piano-christmas': [
    'Angels We Have Heard on High', 'Carol of the Bells', 'Deck the Halls',
    'God Rest Ye Merry, Gentlemen', 'I Heard the Bells on Christmas Day',
    'Jingle Bells', 'Let It Snow! Let It Snow! Let It Snow!',
    'The Most Wonderful Day of the Year', 'O Christmas Tree', 'O Come, All Ye Faithful',
    'O Little Town of Bethlehem', "Rockin' Around the Christmas Tree",
    'Rudolph the Red-Nosed Reindeer', 'Silent Night',
    'The Night Before Christmas Song', 'We Wish You a Merry Christmas',
  ],
  'funtime-piano-classics': [
    'Barber of Seville', 'Blue Danube Waltz', 'Dance of the Sugar Plum Fairy',
    'Eine Kleine Nachtmusik', 'In the Hall of the Mountain King',
    'Light Cavalry Overture', "Musetta's Song", 'Peter and the Wolf Theme',
    'Pomp and Circumstance', 'Theme from Scheherazade', "Toreador's Song",
    '"Unfinished" Symphony Theme', 'Waltz',
  ],
  'funtime-piano-disney': [
    'Be Our Guest', 'Colors of the Wind', 'Cruella De Vil',
    'Do You Want to Build a Snowman?', "Ev'rybody Wants to Be a Cat",
    'Go the Distance', 'God Bless Us Everyone', 'Remember Me',
    'Under the Sea', 'When She Loved Me', 'Zero to Hero',
  ],
  'funtime-piano-favorites': [
    'Arkansas Traveler', 'Chopsticks', 'Give My Regards to Broadway',
    'Glow Worm', 'Greensleeves', 'Hello, My Baby',
    "I've Been Working on the Railroad", 'Scarborough Fair',
    "Skaters' Waltz", 'Song of the Volga Boatmen', 'Two Guitars',
  ],
  'funtime-piano-hits': [
    "Can't Stop the Feeling", 'Feel It Still', 'Fight Song', 'Lost Boy',
    'Love Yourself', 'Million Reasons', 'Photograph', 'Radioactive',
    'Roar', 'A Thousand Years', 'Treat You Better',
  ],
  'funtime-piano-hymns': [
    'Amen', 'America', 'Christ the Lord Is Risen Today', 'Every Time I Feel the Spirit',
    'Fairest Lord Jesus', 'Glory Be to the Father', 'Go Down, Moses',
    'In the Cross of Christ I Glory', 'Jesus in the Morning',
    'Joshua Fought the Battle of Jericho', 'Now Thank We All Our God',
    'Rejoice, Ye Pure in Heart', 'Savior, Like a Shepherd Lead Us',
    "Standin' in the Need of Prayer", 'Swing Low, Sweet Chariot',
    'Take My Life and Let It Be', 'While By the Sheep',
  ],
  'funtime-piano-jazz-blues': [
    'Come On, Summer', 'Dallas Blues', 'Frankie and Johnny',
    'House of the Rising Sun', 'In the Mood', 'Love Potion No. 9', 'Misty',
    "Piano Playin' Chocolate Eater's Blues", 'Royal Cat Blues',
    'St. James Infirmary', 'This Masquerade', 'Tuxedo Junction',
  ],
  'funtime-piano-kids-songs': [
    'The Addams Family Theme', 'Arabian Nights', 'Be Our Guest',
    'Consider Yourself', 'Edelweiss', 'Hello Muddah, Hello Fadduh!',
    'Walking on Sunshine', 'Yellow Submarine',
    "You've Got a Friend in Me",
  ],
  'funtime-piano-music-from-china': [
    'Elephant', 'The Flowing Canal', 'Gazing at the Moon', 'Mountain Song',
    'Northwest Rains', 'Peacock Dance',
  ],
  'funtime-piano-popular': [
    'Colors of the Wind', 'Eleanor Rigby', "He's a Pirate",
    'I Saw Her Standing There', 'La Bamba', 'The Lion Sleeps Tonight',
    'Moonlight Sonata', 'Music Box Dancer', 'Pachelbel Canon',
    'Phantom of the Opera', 'Star Wars (Main Theme)', 'A Whole New World',
  ],
  'funtime-piano-ragtime-marches': [
    'American Patrol', 'The Ants Came Marching', 'Dixie', 'The Easy Winner',
    'The Entertainer', 'Glad Cat Rag', 'Maple Leaf Rag',
    'Parade of the Tin Soldiers', 'Snowflake Rag', 'Stars and Stripes Forever',
    'When the Saints Go Marching In',
  ],
  'funtime-piano-rock-n-roll': [
    'All I Have to Do Is Dream', 'Bye Bye Love', 'Come Go with Me', 'Hey, Jude',
    'Hound Dog', 'Howl at the Moon', 'Last Night of Summer', 'Mumbo Jumbo',
    "Rockin' Pneumonia and the Boogie Woogie Flu", "Rockin' Robin",
    'Runaround Sue', 'Stand by Me',
  ],
  'funtime-piano-faber-studio-collection': [
    'The Addams Family Theme', 'Chopsticks', 'Glad Cat Rag', 'Home',
    'Hound Dog', 'Howl at the Moon', 'In the Mood', 'Misty',
    'The Phantom of the Opera', 'Swing Low, Sweet Chariot', 'Theme from Scheherazade',
  ],

  // ===== BIGTIME (Level 4) =====
  'bigtime-piano-christmas': [
    'Carol of the Bells', 'The First Noel', 'Hallelujah Chorus',
    'Hark! The Herald Angels Sing', 'A Holly Jolly Christmas',
    'I Heard the Bells on Christmas Day', 'It Came Upon the Midnight Clear',
    'Jesu, Joy of Man\'s Desiring', 'Let It Snow! Let It Snow! Let It Snow!',
    'O Come, O Come, Emmanuel', 'O Holy Night',
    "Rockin' Around the Christmas Tree", 'Rudolph the Red-Nosed Reindeer',
    'Silent Night', 'What Child Is This?', 'Winter Wonderland',
  ],
  'bigtime-piano-classics': [
    'Arioso', 'Canon in D', 'Danse Macabre', 'The Great Gate of Kiev',
    'Habanera', 'Hornpipe', 'Hungarian Dance No. 5', 'Liebesfreud',
    'Rondeau', "Russian Sailor's Dance", 'Songs of India', 'Spring Song',
    'Tales from the Vienna Woods', 'Theme from Symphony No. 40',
  ],
  'bigtime-piano-disney': [
    'Friend Like Me', 'A Whole New World', 'Alice in Wonderland', 'Be Prepared',
    'Beauty and the Beast', 'Can You Feel the Love Tonight', 'Dig a Little Deeper',
    'God Help the Outcasts', "I'll Make a Man Out of You",
    'Just Around the Riverbend', 'Prologue', 'Two Worlds', 'We Know the Way',
  ],
  'bigtime-piano-favorites': [
    'Beautiful Dreamer', "Bill Bailey, Won't You Please Come Home?", 'Cielito Lindo',
    'Clair de Lune', 'Fanfare on America', 'Good Morning Blues',
    'Halloween Sonatine', 'I Love a Piano', "I'm Henery the Eighth, I Am",
    'Morning Has Broken', 'Oh! You Beautiful Doll', 'The Spy',
    'Tarantella Italiana', 'Theme from the Moonlight Sonata',
  ],
  'bigtime-piano-hits': [
    'All of Me', 'Firework', 'Hello', 'See You Again', 'Shake It Off',
    'Shut Up and Dance', 'Sorry', 'Stay With Me', 'Sugar', 'Symphony',
    'What About Us', 'When I Was Your Man',
  ],
  'bigtime-piano-hymns': [
    "All Hail the Power of Jesus' Name", 'All Night, All Day',
    'Break Thou the Bread of Life', 'Come, Ye Thankful People, Come',
    'Crown Him with Many Crowns', 'Deep River',
    'Glorious Things of Thee Are Spoken', 'It Is Well With My Soul',
    'Jesus Shall Reign', 'Just As I Am', 'A Mighty Fortress Is Our God',
    'O Master, Let Me Walk with Thee', 'The Old Rugged Cross',
    'Praise God, from Whom All Blessings Flow', 'Rock of Ages',
    'Shall We Gather at the River', 'Sweet Hour of Prayer',
  ],
  'bigtime-piano-jazz-blues': [
    'All the Things You Are', 'Autumn Leaves', 'Big City Blues',
    'Cast Your Fate to the Wind', 'Desafinado', 'Equinox',
    'Georgia on My Mind', 'Locomotive Blues', 'Lullaby of Birdland',
    'Misty', 'Night Train', 'Perdido', 'Satin Doll',
    'Take the "A" Train', 'A Taste of Honey',
  ],
  'bigtime-piano-kids-songs': [
    'Can You Feel the Love Tonight', 'Cruella De Vil', 'Flight of the Bumblebee',
    'Hakuna Matata', "I'm a Believer", 'In Dreams', 'Linus and Lucy',
    '(Meet) The Flintstones', 'My Favorite Things', 'Once Upon a Dream',
    'The Pink Panther', 'Thank You for Being a Friend',
  ],
  'bigtime-piano-music-from-china': [
    'Dragon Lantern Dance', 'The Giraffe', 'Hide and Seek', 'The Little Monkey',
    'Little Monkey on a Bicycle', 'The Panda', 'The Peacock', 'Shepherd Song',
  ],
  'bigtime-piano-popular': [
    '100 Years', 'Dancing Queen', 'I Saw Her Standing There', 'Lean On Me',
    'The Medallion Calls', 'The Music of the Night', 'On Broadway',
    'Pachelbel Canon', 'Pure Imagination', 'Star Wars', 'You Raise Me Up',
  ],
  'bigtime-piano-ragtime-marches': [
    'Champagne Rag', 'Chatterbox Rag', '"Dill Pickles" Rag',
    'Entrance of the Gladiators', 'The Entertainer',
    'Funeral March of a Marionette', 'March of the Toys', 'Solace',
    'Washington Post March', 'Wild Cherries Rag', 'Yankee Doodle Boy',
  ],
  'bigtime-piano-rock-n-roll': [
    'Bad, Bad Leroy Brown', 'The Game of Love', 'Great Balls of Fire',
    'I Feel the Earth Move', 'I Heard It Through the Grapevine',
    "I May Have Lost My Girlfriend, But I've Still Got My Car",
    'My Special Angel', 'Piano Man', 'Rock Around the Clock',
    'Strawberry Malt', 'When a Man Loves a Woman',
  ],
  'bigtime-piano-faber-studio-collection': [
    '100 Years', 'Autumn Leaves', 'Canon in D', 'Can You Feel the Love Tonight',
    'Deep River', 'Gangnam Style', 'Morning Has Broken', 'The Pink Panther',
    'Rock Around the Clock', 'Solace',
  ],
};

// Count and add missing songs
let totalAdded = 0;
let totalSkipped = 0;
const bookStats = [];

for (const [bookId, officialSongs] of Object.entries(officialData)) {
  const book = bookMap.get(bookId);
  if (!book) {
    console.log(`⚠ Book not found: ${bookId} — skipping`);
    continue;
  }

  const existing = existingSongsByBook.get(bookId) || new Set();
  let added = 0;

  for (const title of officialSongs) {
    const norm = normalize(title);
    if (existing.has(norm)) continue;

    // Also check minor variations (with/without "The", punctuation diffs)
    const variations = [
      norm,
      norm.replace(/^the /, ''),
      'the ' + norm,
      norm.replace(/[,!?.']/g, '').replace(/\s+/g, ' ').trim(),
    ];
    if (variations.some(v => existing.has(v))) continue;

    // Determine series config from bookId
    const prefix = Object.keys(SERIES).find(p => bookId.startsWith(p));
    if (!prefix) {
      console.log(`  ⚠ No series config for ${bookId}`);
      continue;
    }
    const { difficulty, faberLevel } = SERIES[prefix];

    const songId = `${bookId}-${slugify(title)}`;
    const newSong = {
      id: songId,
      title,
      composer: '',
      arranger: 'Nancy and Randall Faber',
      genre: book.series?.includes('Hymns') ? 'Hymns'
        : book.series?.includes('Christmas') ? 'Christmas'
        : book.series?.includes('Classics') ? 'Classical'
        : book.series?.includes('Jazz') ? 'Jazz'
        : book.series?.includes('Rock') ? 'Rock'
        : book.series?.includes('Ragtime') ? 'Marches'
        : book.series?.includes('Disney') ? 'Disney'
        : '',
      bookId,
      pageNumber: null,
      difficulty: {
        label: difficulty,
        faberLevel,
        alfredLevel: null,
      },
      youtubeLinks: [],
      notes: '',
    };

    songs.push(newSong);
    existing.add(norm);
    added++;
    totalAdded++;
  }

  if (added > 0) {
    bookStats.push({ bookId, added, total: officialSongs.length, hadBefore: officialSongs.length - added });
    // Mark trackListingSource on the book
    const bi = books.findIndex(b => b.id === bookId);
    if (bi !== -1 && !books[bi].trackListingSource) {
      books[bi].trackListingSource = 'pianoadventures.com';
    }
  } else {
    totalSkipped++;
  }
}

console.log('\n=== Summary ===');
console.log(`Books with new songs: ${bookStats.length}`);
console.log(`Books already complete: ${totalSkipped}`);
console.log(`Total songs added: ${totalAdded}`);
console.log('');

if (bookStats.length > 0) {
  console.log('Books updated:');
  for (const { bookId, added, total, hadBefore } of bookStats.sort((a, b) => b.added - a.added)) {
    console.log(`  ${bookId}: +${added} (had ${hadBefore}/${total})`);
  }
}

if (totalAdded > 0) {
  writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2) + '\n');
  writeFileSync(BOOKS_PATH, JSON.stringify(books, null, 2) + '\n');
  console.log(`\n✅ Wrote ${songs.length} songs and ${books.length} books`);
} else {
  console.log('\n✅ No changes needed');
}
