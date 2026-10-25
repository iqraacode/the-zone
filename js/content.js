/* Zone — content catalogue.
   - Reading: original sample texts written for Zone (clearly labelled "Sample").
   - Videos: YouTube embeds only (curated list + any YouTube link the user adds).
   - Music: original generative pieces synthesised live in the browser (see js/audio.js) — no streaming service involved.
   - Games: four built-in games + the user's own Arcade Club (14 games, loaded from games/arcade-club/). */
(function () {
  'use strict';
  const App = window.App;
  const C = (App.content = {});

  /* ---------------- reading ---------------- */
  C.readingCats = [
    { id: 'fiction', label: 'Fiction' }, { id: 'essays', label: 'Essays' },
    { id: 'poetry', label: 'Poetry' }, { id: 'articles', label: 'Articles' }, { id: 'yours', label: 'Your texts' },
  ];
  C.books = [
    {
      id: 'lamp-late-hours', kind: 'book', cat: 'fiction', title: 'The Lamp That Kept Late Hours', author: 'Zone sample shelf', color: 1, motif: 'lamp', minutes: 6,
      blurb: 'A desk lamp, a tired student, and the small conspiracy of staying up.',
      chapters: [{ title: 'The Lamp That Kept Late Hours', text: `The lamp on Mira's desk had been her grandmother's, and like her grandmother it had opinions about bedtime.

It was a squat brass thing with a green glass shade, the kind that hums faintly when the bulb is warm. For three years it had lit Mira's homework, her letters, her sketchbooks, and the long blue nights before exams. It had never once flickered. Not until the Tuesday in November when she decided she would finish the whole essay before midnight, even if it killed her.

At ten o'clock the lamp dimmed, just slightly, the way a person lowers their voice.

Mira tapped the shade. The light steadied. She wrote another paragraph about the causes of the river trade's decline, and she was rather pleased with it, because it used the word "concomitant" correctly for the first time in her life.

At eleven the lamp dimmed again. This time it stayed dim.

"I know," Mira said aloud, which surprised her. "I know it's late."

The lamp hummed. Outside, rain had started up against the window, the soft unhurried kind that seems to come from everywhere at once. The radiator ticked. Down the hall, someone's kettle clicked off.

She looked at the essay. Two thousand words, more or less. The last section was a list of notes that did not yet know how to be sentences. She could push through. She had pushed through before. She remembered the feeling of those nights: the bright, buzzing exhaustion, the mornings when every sound seemed to arrive slightly too loud.

The lamp dimmed a little further, until the circle of light on the desk was only big enough for one hand.

Her grandmother used to say that a day was like a letter. You could keep adding postscripts forever, but at some point you had to fold it and let it go.

Mira saved the document. She wrote one more line at the very bottom, in capital letters, for the morning version of herself: START HERE. THE RIVER PART IS GOOD.

Then she switched off the lamp.

In the dark, the rain sounded louder and kinder. She lay down and listened to it, and she thought about rivers, the way they don't finish in one night either, the way they just keep arriving.

In the morning the lamp lit at full brightness on the first try. The essay took forty minutes. The river part was, in fact, good.` }],
    },
    {
      id: 'notes-on-rain', kind: 'article', cat: 'essays', title: 'Notes on Rain', author: 'Zone sample shelf', color: 4, motif: 'rain', minutes: 4,
      blurb: 'Why the sound of rain makes a room feel bigger and a person feel smaller, in the good way.',
      chapters: [{ title: 'Notes on Rain', text: `There is a particular kind of quiet that only exists when it is raining.

It is not silence. Rain is noisy if you listen to it closely: a thousand small impacts, gutters talking, a car hissing past on wet tarmac. But all those sounds blend into something that behaves like silence. It fills the space where other noise would be. It makes a room feel enclosed and safe, like a tent in a field.

Sound engineers call this kind of noise broadband. It covers many frequencies at once, so it gently masks the sudden sounds that would otherwise catch our attention: a door, a voice, a phone. Our attention, which spends much of the day on alert, is allowed to stand down. Perhaps that is why so many people say they read better, sleep better, or think better when it rains.

But I don't think that is the whole story.

Rain also changes how we relate to time. On a sunny afternoon there is a quiet pressure to be outside, to use the day well. Rain removes that pressure. Nobody expects you to go anywhere. The day becomes an indoor day, and indoor days have a different shape. They are made of small tasks done slowly: a pot of tea, a chapter, a drawer finally sorted.

There is also the window. A rainy window is one of the few places where we can watch weather happen at close range. Drops gather, hesitate, and then race down the glass in sudden diagonal runs. Children bet on them. Adults pretend not to.

I have a theory that people who love rain are mostly people who love being inside while it rains. The pleasure comes from contrast. Outside: cold, wet, grey, moving. Inside: warm, dry, lit, still. The rain draws a line around the room and says, in effect, this is where you are now.

The next time it rains, try this. Turn off one light. Let the room get a little dimmer than usual. Sit near the window, but not so near you can see the street. Listen until you can pick out three separate sounds inside the general hush: a drip, a gutter, a gust.

Then do whatever you were going to do anyway, only slower.` }],
    },
    {
      id: 'cartographer', kind: 'book', cat: 'fiction', title: 'The Cartographer of Small Rooms', author: 'Zone sample shelf', color: 0, motif: 'map', minutes: 12,
      blurb: 'A mapmaker who has run out of countries begins to map apartments instead.',
      chapters: [
        { title: 'I. The Last Coastline', text: `Teodor Vass drew his last coastline on a Thursday.

It was a small island off a larger island off a continent that had been thoroughly mapped for two hundred years, and the government survey only wanted it redrawn because a storm had moved a sandbar. He drew the new sandbar. He inked the soundings. He signed the corner in his narrow, upright hand.

Then the office manager came by with a box and a sympathetic face, and explained that the survey would be done by satellites from now on. The satellites did not need ink. The satellites did not sign corners.

Teodor carried the box home on the tram. Inside were his pens, a brass protractor, three magnifying glasses, and a jar of the particular blue ink he had used for water for thirty-one years.

His apartment was on the fourth floor of a building with a broken lift. It had two rooms and a kitchen the size of a wardrobe. He set the box down on the table and stood for a while, not quite knowing what a cartographer does when there is nothing left to map.

Eventually, because his hands wanted something to do, he took out a sheet of paper and drew the table.

He drew it from above, as cartographers do. The rectangle of the tabletop. The circle of the coffee ring that had been there since spring. The box, with its lid open. The scattered pens. He added a scale bar in the corner: one centimetre to ten.

It was, he had to admit, a very good map of a table.` },
        { title: 'II. Survey of the Fourth Floor', text: `By the end of the week he had mapped the whole apartment.

He did it properly. He measured every wall with a tape and a notebook. He marked the radiator, the window that stuck, the floorboard by the bed that creaked if you stepped on its left side but not its right. He used contour lines to show where the kitchen floor sloped toward the drain. He used the blue ink for the sink.

The map hung on the wall by the door, and for a few days he felt the specific satisfaction of a finished survey. Then he noticed the things it did not show.

It did not show that the morning light came through the kitchen window at exactly the angle that made the dust in the air look like a slow galaxy. It did not show that the chair by the window was the warm chair, and the chair by the door was the cold one. It did not show the place on the bookshelf where his late wife's books ended and his began, a border that had once been obvious and was now, after years of rearranging, impossible to find.

A map, his first teacher had told him, is a list of decisions about what to leave out.

So Teodor began a second map. This one had a key that no government had ever approved. A small sun meant good morning light. A wavy line meant a draught. A tiny cup meant a place where tea tasted better, for reasons he could not explain. He drew the border on the bookshelf where he guessed it had been, in a dotted line, which in cartography means uncertain.

When the neighbour's child knocked to ask for help with a school project, she stopped in the doorway and stared at the wall.

"Is that your house?" she asked.

"It is the second version," Teodor said.` },
        { title: 'III. Other People\'s Rooms', text: `The child's name was Ilka, and she wanted a map of her own room.

So Teodor climbed one flight of stairs with his tape and his notebook and surveyed a bedroom that contained, by his count, four hundred and twelve plastic animals. Ilka told him which animals were important and which were background. She told him that the space under the bed was a cave and should be marked as such. She told him where the monster lived, and he drew it with great care, as a small dotted region labelled HERE BE NOTHING, ACTUALLY, which Ilka approved of.

After that, word got around the building.

The widower on the second floor wanted a map of his garden balcony, with every pot named. The young couple on the sixth floor wanted a map of their first apartment before they moved out, so they would remember it. The landlady, who had never once fixed the lift, asked shyly whether he could map the entrance hall as it had looked when she was a girl, from her description, and he spent three evenings listening to her and drawing a staircase that no longer existed.

It was not cartography, exactly. No one would use these maps to find their way anywhere. Everyone already knew where they were.

But Teodor came to believe that this was the point. Most maps exist so that you can leave. These were maps for staying. They said: this place was looked at carefully. Someone noticed the warm chair and the creaking board and the light at seven in the morning. Someone thought it was worth a scale bar.

On the last page of his notebook he drew the building itself, all seven floors, each room a small rectangle, each rectangle with a tiny sun or a cup or a dotted line. At the bottom, in the corner, in his narrow upright hand, he signed it.` },
      ],
    },
    {
      id: 'read-slowly', kind: 'article', cat: 'articles', title: 'How to Read Slowly', author: 'Zone sample shelf', color: 2, motif: 'pencil', minutes: 4,
      blurb: 'A short, practical guide to reading for pleasure in an age of skimming.',
      chapters: [{ title: 'How to Read Slowly', text: `Most of the reading we do in a day is not really reading. It is scanning: headlines, messages, labels, menus. Our eyes have become very good at extracting the gist and moving on. That is a useful skill, but it is not the same as reading a book, and it can make reading a book feel strangely difficult.

Here are a few gentle ways to slow down.

Choose a place, not just a time. Reading is easier when the body knows what is happening. Pick one chair, one corner, one lamp, and use it mostly for reading. After a while, sitting there becomes a cue in itself.

Start with ten minutes. Not an hour, not a chapter. Ten minutes is short enough that it never feels like a commitment, and long enough that you usually want to keep going. If you don't, that is fine too. Ten minutes still counts.

Put the phone in another room. Not face down on the table. Another room. Attention has a way of drifting toward anything that might buzz.

Read a sentence twice when it pleases you. Fast reading treats every sentence as equal. Slow reading notices that some sentences are better than others and lingers on them. You are allowed to reread. Nobody is timing you.

Keep a pencil nearby. Underline a phrase, put a small star in the margin, write a question. Marking a book turns reading into a conversation. If you are reading on a screen, use bookmarks for the same purpose.

Let yourself lose the thread. Sometimes you will reach the bottom of a page and realise you have no idea what happened. This is normal. Go back a paragraph and begin again without any self-criticism. The mind wanders; returning is the practice.

Stop in the middle of something interesting. It is tempting to finish at the end of a chapter, but stopping mid-scene makes it easier to start again tomorrow. You will come back curious.

Finally, read what you actually enjoy. Slow reading is not a punishment or a self-improvement project. It is one of the cheapest, quietest pleasures available. Choose books that make you want to stay.` }],
    },
    {
      id: 'small-hours', kind: 'book', cat: 'poetry', title: 'Small Hours', author: 'Zone sample shelf', color: 5, motif: 'moon', minutes: 3,
      blurb: 'Five short poems for the time between late and early.',
      chapters: [{ title: 'Small Hours', text: `I. Kettle

The kettle starts its long vowel,
a sound like someone remembering
the word for comfort
and saying it slowly.

II. Window

The street is a rumour now.
Only the window stays honest:
one lamp, one face,
and rain writing its fine print on the glass.

III. Pages

I turn a page the way you'd open
a door in a sleeping house,
carefully,
listening for who might still be awake.

IV. Radiator

It ticks like a clock
that has lost interest in hours
and keeps time instead
for the warmth.

V. Before Morning

Not yet the birds.
Not yet the first bus.
Just this — the blanket, the breath,
the dark politely waiting for its turn to leave.` }],
    },
    {
      id: 'doodle-guide', kind: 'article', cat: 'articles', title: 'A Field Guide to Doodles', author: 'Zone sample shelf', color: 3, motif: 'star', minutes: 4,
      blurb: 'The humble margin doodle, and why your hand knows something your mind doesn\'t.',
      chapters: [{ title: 'A Field Guide to Doodles', text: `Almost everyone doodles. Cubes in the margins of meeting notes. Spirals on the back of envelopes. Little stars, eyes, flowers, houses with smoke curling from the chimney. Doodles are so common that we rarely look at them, but they are among the oldest and most honest drawings people make.

A doodle is a drawing with no audience. That is what makes it different from art. Nobody plans a doodle, and nobody is supposed to see it. The hand moves while the mind is somewhere else, listening, waiting, thinking. Some researchers have found that people who doodle during a dull recording remember more of it afterwards than people who sit still. The theory is that doodling uses just enough attention to stop the mind from drifting entirely.

Here is a short field guide to common species.

The Cube. Usually found in the top corner of a page. Drawn by people who like structure, or by anyone in a long meeting. Often shaded on one side.

The Spiral. A doodle that can continue forever, which may be its appeal. Spirals tend to appear during phone calls.

The Star. Quick to make, satisfying to finish, frequently repeated in clusters. Stars mark things: a good idea, an important date, or nothing at all.

The House. Square, triangle roof, door, window, smoke. Remarkably consistent across ages and countries. Nearly always drawn from the front.

The Face. Two dots and a curve. The human hand cannot resist adding a face to almost anything, including other doodles.

If you would like to doodle more, keep a cheap notebook that does not need to be good. Expensive paper makes the hand nervous. Use a pen rather than a pencil, so you cannot erase. Let lines wobble. A wobbly line is not a mistake; it is evidence that a person drew it.

And if someone asks what you're drawing, the correct answer is: I'm not sure yet.` }],
    },
    {
      id: 'night-train', kind: 'book', cat: 'fiction', title: 'The Night Train to Winterbourne', author: 'Zone sample shelf', color: 2, motif: 'train', minutes: 5,
      blurb: 'A sleeper carriage, a stranger with a thermos, and a station that is not on the timetable.',
      chapters: [{ title: 'The Night Train to Winterbourne', text: `The 23:40 to Winterbourne was the last train of the evening, and nearly empty.

Jonah had a whole compartment to himself: two padded benches facing each other, a little fold-down table, a window that showed nothing but his own reflection and, occasionally, the orange smear of a level crossing. He had planned to sleep. Instead he sat with his coat still on and watched the dark go by.

At the second stop, a woman got on with a tartan bag and a large silver thermos. She looked into the compartment, saw him, and raised her eyebrows in the universal question. He nodded. She sat down opposite, unscrewed the thermos, and the smell of cocoa filled the small space.

"There are two cups," she said, as if this settled something. "There are always two cups on this lid. I've never understood why, if not for this."

He accepted the second cup. It was very hot and slightly too sweet, which was exactly right.

They did not talk much. She had a paperback with a cracked spine that she read with total concentration. He watched the window. The train swayed in long, regular arcs, and every few minutes the wheels went over a joint in the rails with a sound like a heartbeat.

Somewhere after midnight, the train slowed and stopped at a platform he did not recognise. There was a single lamp, a wooden bench, and a sign too frosted over to read. No one got on. No one got off. Snow was falling in the lamplight, slowly, the way snow falls in films.

"Is this Winterbourne?" he asked.

"No," said the woman, without looking up from her book. "This is the stop before. It's not on the timetable. The driver always pauses here for a minute. I think he likes the view."

They looked at the snow together. The lamp hummed. Nothing at all happened, and it was one of the best minutes Jonah could remember.

Then the train sighed and moved on, and the platform slid backwards into the dark, and the woman turned a page.

When they reached Winterbourne at last she screwed the cup back onto the thermos, nodded goodbye, and was gone into the cold before he could ask her name. He walked out into the town with the taste of cocoa still in his mouth, and later, when he checked, there was no station between the last two stops on any map he could find.

He took the 23:40 again the following winter. The driver paused. It was still snowing.` }],
    },
  ];

  /* ---------------- videos (YouTube embeds — every ID checked against YouTube's oEmbed) ---------------- */
  C.videoCats = [
    { id: 'entertainment', label: 'Entertainment' }, { id: 'documentaries', label: 'Documentaries' },
    { id: 'educational', label: 'Educational' }, { id: 'relaxing', label: 'Relaxing' }, { id: 'music', label: 'Music videos' },
  ];
  const YT = (yt, cat, title, credit, desc, extra) => Object.assign({ id: 'yt-' + yt, yt, src: 'yt:' + yt, cat, title, credit, desc,
    thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, page: `https://www.youtube.com/watch?v=${yt}` }, extra || {});
  C.videos = [
    YT('Z4C82eyhwgU', 'entertainment', 'Caminandes 2: Gran Dillama', 'Blender', 'A stubborn llama, a fence, and a very patient penguin.'),
    YT('aqz-KE-bpKQ', 'entertainment', 'Big Buck Bunny', 'Blender', 'A gentle giant rabbit gets his revenge on three bullying rodents.'),
    YT('SkVqJ1SGeL0', 'entertainment', 'Caminandes 3: Llamigos', 'Blender', 'Koro the llama meets a hungry penguin in Patagonia.'),
    YT('PVGeM40dABA', 'entertainment', 'Coffee Run', 'Blender Studio', 'A sleepless young woman runs on coffee through a dreamlike city.'),
    YT('_cMxraX_5RE', 'entertainment', 'Sprite Fright', 'Blender Studio', 'Teenagers camping in the woods meet some very protective mushroom spirits. Mild spooky comedy.'),
    YT('WhWc3b3KhnY', 'entertainment', 'Spring', 'Blender Studio', 'A shepherd girl and her dog face ancient spirits to keep the cycle of life going.'),
    YT('eRsGyueVLvQ', 'entertainment', 'Sintel', 'Blender', 'A lonely young woman searches for the baby dragon she once rescued. Fantasy peril.'),
    YT('mN0zPOpADL4', 'entertainment', 'Agent 327: Operation Barbershop', 'Blender Studio', 'A secret agent, a barbershop, and a lot of hair-raising action.'),
    YT('pKmSdY56VtY', 'entertainment', 'Hero', 'Blender', 'A short 2D/3D action piece drawn with Grease Pencil.'),
    YT('TLkA0RELQ1g', 'entertainment', 'Elephants Dream', 'Blender', 'Two characters explore an endless, strange machine. The first open movie (2006).'),
    YT('aETNYyrqNYE', 'documentaries', 'Our Planet — Official Trailer', 'Netflix', 'A first look at the nature series narrated by David Attenborough.'),
    YT('QOCaacO8wus', 'educational', 'What Is Life? Is Death Real?', 'Kurzgesagt – In a Nutshell', 'A colourful look at where living things end and chemistry begins.'),
    YT('e-P5IFTqB98', 'educational', 'Black Holes Explained', 'Kurzgesagt – In a Nutshell', 'From birth to death: how black holes form and what happens to them.'),
    YT('zQGOcOUBi6s', 'educational', 'The Immune System Explained', 'Kurzgesagt – In a Nutshell', 'What your body does when bacteria get in.'),
    YT('MBRqu0YOH14', 'educational', 'Optimistic Nihilism', 'Kurzgesagt – In a Nutshell', 'A cheerful take on a big question.'),
    YT('h6fcK_fRYaI', 'educational', 'The Egg — A Short Story', 'Kurzgesagt – In a Nutshell', 'An animated short story by Andy Weir about life, death and everyone.'),
    YT('mPZkdNFkNps', 'relaxing', 'Rain on a Window with Thunder', 'Relaxing Ambience ASMR', 'Long, heavy rain for sleeping or studying.'),
    YT('L_LUpnjgPso', 'relaxing', 'Fireplace Ambience', 'Fireplace Atmosphere', 'A cozy crackling fire to keep in the background.'),
    YT('eKFTSSKCzWA', 'relaxing', 'Forest Sounds for Sleeping', 'johnnielawson', 'Birdsong and a calm forest with gentle water.'),
    YT('1ZYbU82GVz4', 'relaxing', 'Flying — Relaxing Sleep Music', 'Soothing Relaxation', 'Slow piano and aerial scenery for winding down.'),
    YT('lTRiuFIWV54', 'relaxing', '1 A.M Study Session', 'Lofi Girl', 'An hour of late-night lo-fi for focus.'),
    YT('jfKfPfyJRdk', 'music', 'lofi hip hop radio — beats to relax/study to', 'Lofi Girl', 'The famous 24/7 live stream.', { live: true }),
    YT('rUxyKA_-grg', 'music', 'lofi hip hop radio — beats to sleep/chill to', 'Lofi Girl', 'A slower 24/7 live stream for night time.', { live: true }),
    YT('4xDzrJKXOOY', 'music', 'synthwave radio — beats to chill/game to', 'Lofi Girl', 'Retro synths, live around the clock.', { live: true }),
    YT('CvFH_6DNRCY', 'music', 'Debussy — Clair de Lune', 'Channel 3 YouTube', 'Debussy’s best-loved piano piece.'),
    YT('S-Xm7s9eGxU', 'music', 'Satie — Gymnopédie No. 1', 'DistantMirrors', 'Slow, floating piano.'),
    YT('9E6b3swbnWg', 'music', 'Chopin — Nocturne Op. 9 No. 2', 'andrea romano', 'Chopin’s gentle E-flat nocturne.'),
  ];

  /* ---------------- games ---------------- */
  C.gameCats = [
    { id: 'puzzle', label: 'Puzzle' }, { id: 'brain', label: 'Brain training' }, { id: 'strategy', label: 'Strategy' },
    { id: 'arcade', label: 'Casual arcade' }, { id: 'party', label: 'Party (1–3 players)' }, { id: 'relaxing', label: 'Relaxing' }, { id: 'classic', label: 'Classic' },
  ];
  C.games = [
    { id: 'minesweeper', title: 'Minesweeper', cats: ['puzzle', 'classic', 'strategy'], blurb: 'Clear the field without waking a single mine.', doodle: 'mine', score: 'time' },
    { id: '2048', title: 'Mochi 2048', cats: ['puzzle', 'brain', 'arcade'], blurb: 'Drop squishy number blobs into a jar — matching numbers merge. Grow a 2048.', doodle: 'mochi', score: 'points' },
    { id: 'memory', title: 'Memory Match', cats: ['brain', 'relaxing', 'arcade'], blurb: 'Flip hand-drawn cards and find every pair.', doodle: 'cards', score: 'moves' },
    { id: 'tictactoe', title: 'Tic-tac-toe', cats: ['strategy', 'classic', 'relaxing'], blurb: 'Noughts and crosses against Pip or a friend.', doodle: 'ttt', score: 'wins' },
    { id: 'chess', title: 'Chess', cats: ['strategy', 'classic'], blurb: 'The monochrome chess room — play Snailfish or a friend.', doodle: 'knight', route: '#/chess' },
    /* party games for 1–3 players (from the user's Arcade Club, games/arcade-club/), each opens straight into its game */
    { id: 'golf', title: 'Mini Golf Getaway', cats: ['arcade', 'party'], blurb: 'Putt around palms, bumpers and lagoons.', doodle: 'golf', external: 'games/arcade-club/index.html#play/golf', club: true },
    { id: 'racers', title: 'Tiny Racers', cats: ['arcade', 'party'], blurb: 'Zippy top-down races around a seaside loop.', doodle: 'racers', external: 'games/arcade-club/index.html#play/racers', club: true },
    { id: 'snake', title: 'Eel Duel', cats: ['arcade', 'party', 'classic'], blurb: 'Grow your eel and be the last one swimming.', doodle: 'snake', external: 'games/arcade-club/index.html#play/snake', club: true },
    { id: 'jump', title: 'Sunny Jump', cats: ['arcade'], blurb: 'Hop sandcastles and crabs on an endless beach run.', doodle: 'jump', external: 'games/arcade-club/index.html#play/jump', club: true },
    { id: 'hippos', title: 'Hippo Lagoon', cats: ['arcade', 'party'], blurb: 'Chomp rolling pearls before the other hippos do.', doodle: 'arcade', external: 'games/arcade-club/index.html#play/hippos', club: true },
    { id: 'paint', title: 'Paint Party', cats: ['arcade', 'party'], blurb: 'Roll your colour across the floor and cover the most.', doodle: 'arcade', external: 'games/arcade-club/index.html#play/paint', club: true },
    { id: 'skewer', title: 'Skewer Spin', cats: ['arcade'], blurb: 'Stick skewers in a spinning log without hitting the others.', doodle: 'arcade', external: 'games/arcade-club/index.html#play/skewer', club: true },
    { id: 'darts', title: 'Beach Darts', cats: ['arcade', 'party', 'classic'], blurb: 'Count down to exactly zero on a seaside dartboard.', doodle: 'darts', external: 'games/arcade-club/index.html#play/darts', club: true },
    { id: 'reflex', title: 'Fruit Reflex', cats: ['arcade', 'party', 'brain'], blurb: 'Slap your button the moment the right fruit pops up.', doodle: 'arcade', external: 'games/arcade-club/index.html#play/reflex', club: true },
    { id: 'clash', title: 'Color Clash', cats: ['puzzle', 'strategy', 'party'], blurb: 'Paint patterned tiles and grow the biggest territory.', doodle: 'arcade', external: 'games/arcade-club/index.html#play/clash', club: true },
    { id: 'dots', title: 'Dot Beach', cats: ['puzzle', 'strategy', 'party', 'classic'], blurb: 'Connect the dots and claim the most sandy boxes.', doodle: 'dots', external: 'games/arcade-club/index.html#play/dots', club: true },
    { id: 'math', title: 'Sum Splash', cats: ['brain', 'puzzle', 'party'], blurb: 'Race to answer quick sums like 5 × 11.', doodle: 'words', external: 'games/arcade-club/index.html#play/math', club: true },
    { id: 'ac-memory', title: 'Memory Splash', cats: ['brain', 'party'], blurb: 'Flip cards and find matching beach pairs, with friends.', doodle: 'cards', external: 'games/arcade-club/index.html#play/memory', club: true },
    { id: 'ac-tictac', title: 'Tic Tac Trip', cats: ['strategy', 'party', 'classic'], blurb: 'Three-in-a-row with stars, balls and sails — up to 3 players.', doodle: 'ttt', external: 'games/arcade-club/index.html#play/tictac', club: true },
  ];

  /* ---------------- music (generative, synthesised in-browser) ---------------- */
  C.musicCats = [
    { id: 'lofi', label: 'Lo-fi & chill' }, { id: 'ambient', label: 'Ambient' }, { id: 'classical', label: 'Classical' },
    { id: 'jazz', label: 'Jazz' }, { id: 'nature', label: 'Rain & nature' }, { id: 'focus', label: 'Focus & study' }, { id: 'sleep', label: 'Sleep' },
  ];
  const T = (id, title, category, style, bpm, root, seed, duration, mood) => ({ id, title, artist: 'Zone Studio, made live', category, style, bpm, root, seed, duration, mood });
  C.tracks = [
    T('window-seat', 'Window Seat', 'lofi', 'lofi', 76, 53, 11, 196, 'warm'),
    T('late-bus', 'Late Bus Home', 'lofi', 'lofi', 70, 50, 27, 212, 'dusky'),
    T('pencil-shavings', 'Pencil Shavings', 'lofi', 'lofi', 84, 55, 43, 184, 'bright'),
    T('slow-tide', 'Slow Tide', 'ambient', 'ambient', 60, 50, 7, 300, 'wide'),
    T('paper-lanterns', 'Paper Lanterns', 'ambient', 'ambient', 56, 57, 19, 280, 'glow'),
    T('little-prelude', 'Little Prelude in C', 'classical', 'classical', 72, 48, 5, 190, 'bright'),
    T('quiet-house', 'Nocturne for a Quiet House', 'classical', 'nocturne', 58, 51, 31, 230, 'tender'),
    T('corner-cafe', 'Corner Café Swing', 'jazz', 'jazz', 112, 46, 13, 200, 'swing'),
    T('blue-hour', 'Blue Hour Brushes', 'jazz', 'jazz', 88, 51, 29, 220, 'mellow'),
    T('skylight-rain', 'Rain on the Skylight', 'nature', 'rain', 60, 48, 3, 900, 'rain'),
    T('forest-after', 'Forest After Rain', 'nature', 'forest', 60, 48, 9, 900, 'birds'),
    T('low-tide', 'Low Tide', 'nature', 'ocean', 60, 48, 15, 900, 'waves'),
    T('deep-work', 'Deep Work Pulse', 'focus', 'focus', 96, 50, 21, 360, 'steady'),
    T('index-cards', 'Index Cards', 'focus', 'focus', 108, 53, 37, 320, 'light'),
    T('down-comforter', 'Down Comforter', 'sleep', 'sleep', 48, 45, 17, 600, 'soft'),
    T('moon-drift', 'Moon Drift', 'sleep', 'sleep', 44, 48, 41, 600, 'deep'),
  ];

  /* ---------------- user-added content (persisted) ---------------- */
  C.userBooks = () => App.store.get('userBooks', []).filter((b) => b && b.id && b.chapters);
  C.userVideos = () => App.store.get('userVideos', []).filter((v) => v && v.id && v.src);
  C.userTracks = () => App.store.get('userTracks', []).filter((t) => t && t.id && t.url);
  C.allBooks = () => C.books.map((b) => Object.assign({ sample: true }, b)).concat(C.userBooks());
  C.allVideos = () => C.videos.map((v) => Object.assign({ sample: true }, v)).concat(C.userVideos());
  C.sessionTracks = []; // local files picked this session (object URLs can't be persisted)
  C.allTracks = () => C.tracks.concat(C.userTracks(), C.sessionTracks);
  C.book = (id) => C.allBooks().find((b) => b.id === id);
  C.video = (id) => C.allVideos().find((v) => v.id === id);
  C.track = (id) => C.allTracks().find((t) => t.id === id);
  C.game = (id) => C.games.find((g) => g.id === id);

  /* resolve any (type, id) into something displayable + a route */
  C.resolve = (type, id) => {
    if (type === 'book' || type === 'article') { const b = C.book(id); return b && { type: b.kind, id, title: b.title, sub: b.author, route: '#/reading/read/' + id, item: b }; }
    if (type === 'video') { const v = C.video(id); return v && { type, id, title: v.title, sub: v.credit || 'Your video', route: '#/videos/watch/' + id, item: v }; }
    if (type === 'game') { const g = C.game(id); return g && { type, id, title: g.title, sub: 'Game', route: g.route || '#/games/play/' + id, item: g }; }
    if (type === 'track') { const t = C.track(id); return t && { type, id, title: t.title, sub: t.artist, route: '#/music', item: t }; }
    if (type === 'chess') return { type, id, title: id === 'pvp' ? 'Chess · two players' : 'Chess vs Snailfish', sub: 'Chess', route: '#/chess', item: {} };
    return null;
  };
})();
