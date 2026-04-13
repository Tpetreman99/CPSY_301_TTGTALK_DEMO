// **************************************
// ******** Seeded database file ********
// *Run with "node scripts/seedFirestore.cjs"*





require('dotenv').config({ path: './.env' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = {
  naila:     { id: '1v6R5UbXV0cT09fa9d4HXmOsmfz2',  name: 'Naila Guerrero',   role: 'Accountant' },
  abimbola:  { id: '2mSeYufIOmd2eYLl4LyTME4smYt2',   name: 'Abimbola Pitan',   role: 'Full-Stack Developer' },
  zim:       { id: 'D2zuzOQoMuMaTXby91NbkoqH1303',   name: 'Zim',              role: 'Data Analysis' },
  beethoven: { id: 'NUT1Tk6fBGdybJKOHGF85anTfEb2',   name: 'Beethoven Ludwig', role: 'Frontend Developer' },
  ryan:      { id: 'U7UHpbO2PngmmUdjXtum7i28jBf1',   name: 'Ryan Ware',        role: 'Senior Developer' },
  pedro:     { id: 'WaaPD4ujlZZgI9puAcsqUtoBK5C3',   name: 'Pedro Polar',      role: 'Marketing' },
  rd2d:      { id: 'Yd8QBFvU2PSp9NBP87rN9AJG76q1',   name: 'RD2D',             role: 'Customer Service' },
  sailor:    { id: 'gfmVjIiuuKSdl4HC6hHRfcfPzHi1',   name: 'Sailor Tift',      role: 'Research' },
  angel:     { id: 'l1tAxudwBaPF3iyOYJwzHGPMJFt2',   name: 'Angel Iglesias',   role: 'Project Manager' },
  tanner:    { id: 'o0ARgGBOs4QYlAqd8meLCycQ8M32',   name: 'Tanner Petreman',  role: 'Sales' },
  adeleke:   { id: 'ryApOkMZNEbezEfbwHJARuBRmT02',   name: 'Adeleke Adeyemo',  role: 'I.T. Support' },
  schezo:    { id: 'k4LE9VW1OmVRdDg6JKjTFJF8CC52',   name: 'Schezo Wegey',     role: 'Project Manager' },
};
function minsAgo(mins) {
  return Timestamp.fromMillis(Date.now() - mins * 60 * 1000);
}

async function createDirectConvo(userA, userB, messages) {
  const memberIds = [userA.id, userB.id].sort();
  const lastMsg = messages[messages.length - 1];

  const convoRef = await addDoc(collection(db, 'conversations'), {
    type: 'direct',
    memberIds,
    createdAt: minsAgo(120),
    updatedAt: minsAgo(lastMsg.minsAgo),
    lastMessageText: lastMsg.text,
    lastMessageAt: minsAgo(lastMsg.minsAgo),
  });

  for (const msg of messages) {
    await addDoc(collection(db, 'messages'), {
      conversationId: convoRef.id,
      senderId: msg.sender.id,
      text: msg.text,
      createdAt: minsAgo(msg.minsAgo),
    });
  }

  console.log(`Created conversation: ${userA.name} <-> ${userB.name}`);
}

async function createGroupConvo(members, messages) {
  const memberIds = members.map(m => m.id).sort();
  const lastMsg = messages[messages.length - 1];

  const convoRef = await addDoc(collection(db, 'conversations'), {
    type: 'group',
    memberIds,
    createdBy: members[0].id,
    createdAt: minsAgo(200),
    updatedAt: minsAgo(lastMsg.minsAgo),
    lastMessageText: lastMsg.text,
    lastMessageAt: minsAgo(lastMsg.minsAgo),
  });

  for (const msg of messages) {
    await addDoc(collection(db, 'messages'), {
      conversationId: convoRef.id,
      senderId: msg.sender.id,
      text: msg.text,
      createdAt: minsAgo(msg.minsAgo),
    });
  }

  console.log(`Created group: ${members.map(m => m.name).join(', ')}`);
}

async function seed() {
  // Tanner <-> Angel
  await createDirectConvo(users.tanner, users.angel, [
    { sender: users.angel,  text: "Hey Tanner, did you get a chance to review the Q2 sales report?", minsAgo: 60 },
    { sender: users.tanner, text: "Just finished going through it. Numbers are looking solid!", minsAgo: 55 },
    { sender: users.angel,  text: "Great, can you put together a summary for the meeting tomorrow?", minsAgo: 50 },
    { sender: users.tanner, text: "On it, I'll have it ready by end of day.", minsAgo: 45 },
    { sender: users.angel,  text: "Perfect, thanks!", minsAgo: 44 },
  ]);

  // Tanner <-> Ryan
  await createDirectConvo(users.tanner, users.ryan, [
    { sender: users.tanner, text: "Ryan, the client portal is throwing a 500 error again.", minsAgo: 90 },
    { sender: users.ryan,   text: "I see it, looks like the API timeout. Give me 10 minutes.", minsAgo: 85 },
    { sender: users.tanner, text: "Client is waiting, appreciate it!", minsAgo: 84 },
    { sender: users.ryan,   text: "Fixed. Deployed the patch just now.", minsAgo: 70 },
    { sender: users.tanner, text: "Amazing, client confirmed it's working. You're a lifesaver!", minsAgo: 68 },
  ]);

  // Tanner <-> Naila
  await createDirectConvo(users.tanner, users.naila, [
    { sender: users.naila,  text: "Tanner, I need the expense reports from last month ASAP.", minsAgo: 180 },
    { sender: users.tanner, text: "Sorry for the delay, sending them over now.", minsAgo: 175 },
    { sender: users.naila,  text: "Got them, thanks. A few entries need receipts attached.", minsAgo: 160 },
    { sender: users.tanner, text: "I'll get those to you by tomorrow morning.", minsAgo: 155 },
    { sender: users.naila,  text: "That works, thanks Tanner.", minsAgo: 154 },
  ]);

  // Tanner <-> Pedro
  await createDirectConvo(users.tanner, users.pedro, [
    { sender: users.pedro,  text: "Hey! Can you send me the latest sales deck for the campaign?", minsAgo: 240 },
    { sender: users.tanner, text: "Sure, which version do you need — the one from March or April?", minsAgo: 235 },
    { sender: users.pedro,  text: "April please, we're updating the landing page copy.", minsAgo: 230 },
    { sender: users.tanner, text: "Sent it to your email!", minsAgo: 225 },
    { sender: users.pedro,  text: "Got it, this is exactly what we needed.", minsAgo: 220 },
  ]);

  // Tanner <-> Adeleke
  await createDirectConvo(users.tanner, users.adeleke, [
    { sender: users.tanner,  text: "Adeleke, my laptop is running super slow today.", minsAgo: 30 },
    { sender: users.adeleke, text: "Have you tried restarting it? Also clear your browser cache.", minsAgo: 28 },
    { sender: users.tanner,  text: "Restarted, still slow. Could be the VPN?", minsAgo: 25 },
    { sender: users.adeleke, text: "Try disconnecting and reconnecting the VPN. I'll remote in if that doesn't work.", minsAgo: 20 },
    { sender: users.tanner,  text: "That did it! Thanks Adeleke.", minsAgo: 18 },
  ]);

  // Tanner <-> Schezo
  await createDirectConvo(users.tanner, users.schezo, [
    { sender: users.schezo, text: "Tanner, are we still on for the client call at 3pm?", minsAgo: 15 },
    { sender: users.tanner, text: "Yes, I'll send the invite now.", minsAgo: 12 },
    { sender: users.schezo, text: "Great, I'll prep the project status slides.", minsAgo: 10 },
    { sender: users.tanner, text: "Perfect, let me know if you need the latest numbers.", minsAgo: 8 },
    { sender: users.schezo, text: "Will do, thanks!", minsAgo: 7 },
  ]);

  // Tanner <-> Zim
  await createDirectConvo(users.tanner, users.zim, [
    { sender: users.tanner, text: "Zim, can you pull the conversion data for Q1?", minsAgo: 300 },
    { sender: users.zim,    text: "Sure, do you need it broken down by region?", minsAgo: 295 },
    { sender: users.tanner, text: "Yes please, and by product line if possible.", minsAgo: 290 },
    { sender: users.zim,    text: "Give me an hour, I'll have it ready.", minsAgo: 285 },
    { sender: users.tanner, text: "Awesome, thanks Zim!", minsAgo: 284 },
  ]);

  // Tanner <-> Abimbola
  await createDirectConvo(users.tanner, users.abimbola, [
    { sender: users.tanner,   text: "Abimbola, the new feature is live. Can you do a quick smoke test?", minsAgo: 400 },
    { sender: users.abimbola, text: "On it, give me 15 minutes.", minsAgo: 395 },
    { sender: users.abimbola, text: "Found a minor bug on the checkout flow, logging it now.", minsAgo: 385 },
    { sender: users.tanner,   text: "Thanks for catching that!", minsAgo: 380 },
    { sender: users.abimbola, text: "No problem, everything else looks good.", minsAgo: 378 },
  ]);

  // Tanner <-> Beethoven
  await createDirectConvo(users.tanner, users.beethoven, [
    { sender: users.beethoven, text: "Hey Tanner, the new landing page design is ready for review.", minsAgo: 500 },
    { sender: users.tanner,    text: "Looks great! Can we tweak the hero section colors?", minsAgo: 495 },
    { sender: users.beethoven, text: "Sure, any specific colors in mind?", minsAgo: 490 },
    { sender: users.tanner,    text: "Match it to the brand guidelines doc I sent last week.", minsAgo: 485 },
    { sender: users.beethoven, text: "Got it, I'll update it and send a new draft.", minsAgo: 480 },
  ]);

  // Tanner <-> Sailor
  await createDirectConvo(users.tanner, users.sailor, [
    { sender: users.sailor, text: "Tanner, the research findings are ready. Want a summary?", minsAgo: 600 },
    { sender: users.tanner, text: "Yes please, just the key takeaways.", minsAgo: 595 },
    { sender: users.sailor, text: "Customer retention is up 12% and NPS improved by 8 points.", minsAgo: 590 },
    { sender: users.tanner, text: "That's great news! I'll include that in my pitch.", minsAgo: 585 },
    { sender: users.sailor, text: "Full report is in the shared drive if you need it.", minsAgo: 580 },
  ]);

  // Tanner <-> RD2D
  await createDirectConvo(users.tanner, users.rd2d, [
    { sender: users.rd2d,   text: "Hi Tanner, a customer is asking about their order status.", minsAgo: 700 },
    { sender: users.tanner, text: "Which account is it? I'll check the CRM.", minsAgo: 695 },
    { sender: users.rd2d,   text: "It's the Henderson account, order #4521.", minsAgo: 690 },
    { sender: users.tanner, text: "Shows as shipped, should arrive tomorrow.", minsAgo: 685 },
    { sender: users.rd2d,   text: "Perfect, I'll let them know. Thanks!", minsAgo: 680 },
  ]);

  // Ryan <-> Abimbola
  await createDirectConvo(users.ryan, users.abimbola, [
    { sender: users.ryan,     text: "Abimbola, can you review my PR when you get a chance?", minsAgo: 800 },
    { sender: users.abimbola, text: "Sure, just sent you some comments.", minsAgo: 790 },
    { sender: users.ryan,     text: "Good catches, fixing them now.", minsAgo: 785 },
    { sender: users.abimbola, text: "Looks good after the changes, approving!", minsAgo: 770 },
    { sender: users.ryan,     text: "Thanks, merging now.", minsAgo: 768 },
  ]);

  // Ryan <-> Beethoven
  await createDirectConvo(users.ryan, users.beethoven, [
    { sender: users.beethoven, text: "Ryan, the API is returning null for the user profile endpoint.", minsAgo: 900 },
    { sender: users.ryan,      text: "Known issue, there's a hotfix going out in 20 minutes.", minsAgo: 895 },
    { sender: users.beethoven, text: "OK, I'll hold off on frontend integration until then.", minsAgo: 890 },
    { sender: users.ryan,      text: "Hotfix is deployed, good to go!", minsAgo: 870 },
    { sender: users.beethoven, text: "Perfect, integration is working now.", minsAgo: 865 },
  ]);

  // Naila <-> Pedro
  await createDirectConvo(users.naila, users.pedro, [
    { sender: users.pedro, text: "Naila, what's the marketing budget looking like for Q3?", minsAgo: 1000 },
    { sender: users.naila, text: "We have $45k allocated, but $12k is already committed.", minsAgo: 995 },
    { sender: users.pedro, text: "That should work for the campaign we're planning.", minsAgo: 990 },
    { sender: users.naila, text: "Just make sure to submit expenses weekly so I can track it.", minsAgo: 985 },
    { sender: users.pedro, text: "Will do, thanks Naila!", minsAgo: 980 },
  ]);

  // Angel <-> Schezo
  await createDirectConvo(users.angel, users.schezo, [
    { sender: users.schezo, text: "Angel, how are we tracking on the Henderson project timeline?", minsAgo: 1100 },
    { sender: users.angel,  text: "We're on track, milestone 2 wraps up Friday.", minsAgo: 1095 },
    { sender: users.schezo, text: "Great, the client is keen to see progress next week.", minsAgo: 1090 },
    { sender: users.angel,  text: "I'll prepare a status deck for the meeting.", minsAgo: 1085 },
    { sender: users.schezo, text: "Perfect, send it over before Thursday.", minsAgo: 1080 },
  ]);

  // Zim <-> Sailor
  await createDirectConvo(users.zim, users.sailor, [
    { sender: users.sailor, text: "Zim, I need the user behavior data for my research report.", minsAgo: 1200 },
    { sender: users.zim,    text: "I'll export it now, any specific date range?", minsAgo: 1195 },
    { sender: users.sailor, text: "Last 6 months please.", minsAgo: 1190 },
    { sender: users.zim,    text: "Sent to your email, let me know if you need anything else.", minsAgo: 1180 },
    { sender: users.sailor, text: "Got it, this is exactly what I needed!", minsAgo: 1178 },
  ]);

  // Adeleke <-> RD2D
  await createDirectConvo(users.adeleke, users.rd2d, [
    { sender: users.rd2d,    text: "Adeleke, my headset isn't connecting to the support system.", minsAgo: 1300 },
    { sender: users.adeleke, text: "Try unplugging and replugging the USB dongle.", minsAgo: 1295 },
    { sender: users.rd2d,    text: "Still not working.", minsAgo: 1290 },
    { sender: users.adeleke, text: "I'll remote in and take a look.", minsAgo: 1285 },
    { sender: users.rd2d,    text: "It's working now, thanks Adeleke!", minsAgo: 1270 },
  ]);

  // Abimbola <-> Beethoven
  await createDirectConvo(users.abimbola, users.beethoven, [
    { sender: users.abimbola,  text: "Beethoven, the new component library is ready to use.", minsAgo: 1400 },
    { sender: users.beethoven, text: "Nice! Is there documentation for it?", minsAgo: 1395 },
    { sender: users.abimbola,  text: "Yes, check the README in the repo.", minsAgo: 1390 },
    { sender: users.beethoven, text: "Got it, I'll start integrating it into the dashboard.", minsAgo: 1385 },
    { sender: users.abimbola,  text: "Let me know if you run into any issues!", minsAgo: 1380 },
  ]);

  // Pedro <-> Sailor
  await createDirectConvo(users.pedro, users.sailor, [
    { sender: users.pedro,  text: "Sailor, can you share the latest customer survey results?", minsAgo: 1500 },
    { sender: users.sailor, text: "Sure, sending them over now.", minsAgo: 1495 },
    { sender: users.pedro,  text: "These are really helpful for the campaign messaging.", minsAgo: 1490 },
    { sender: users.sailor, text: "Glad they're useful! Let me know if you need a deeper breakdown.", minsAgo: 1485 },
    { sender: users.pedro,  text: "Will do, thanks!", minsAgo: 1480 },
  ]);

  // Group: Dev team
  await createGroupConvo(
    [users.tanner, users.ryan, users.abimbola, users.beethoven],
    [
      { sender: users.ryan,      text: "Morning team, standup in 10 minutes.", minsAgo: 120 },
      { sender: users.abimbola,  text: "On my way, just finishing a PR review.", minsAgo: 118 },
      { sender: users.beethoven, text: "Ready when you are!", minsAgo: 117 },
      { sender: users.tanner,    text: "I'll join from the sales floor, might be a minute late.", minsAgo: 115 },
      { sender: users.ryan,      text: "No worries, we'll start with frontend updates.", minsAgo: 114 },
      { sender: users.abimbola,  text: "PR is approved by the way, merging now.", minsAgo: 110 },
      { sender: users.beethoven, text: "Nice! I'll pull the latest after standup.", minsAgo: 108 },
    ]
  );

  // Group: Project sync
  await createGroupConvo(
    [users.tanner, users.angel, users.zim, users.sailor],
    [
      { sender: users.angel,  text: "Can everyone share their progress on the Henderson project?", minsAgo: 200 },
      { sender: users.zim,    text: "Data pipeline is 80% complete, should be done by Friday.", minsAgo: 195 },
      { sender: users.sailor, text: "Research report is drafted, sending for review today.", minsAgo: 190 },
      { sender: users.tanner, text: "Sales deck is ready, just waiting on Zim's data for the final slide.", minsAgo: 185 },
      { sender: users.angel,  text: "Great progress everyone, let's aim to wrap everything by EOD Friday.", minsAgo: 180 },
      { sender: users.zim,    text: "Sounds good!", minsAgo: 178 },
      { sender: users.sailor, text: "Agreed!", minsAgo: 177 },
    ]
  );

  // Group: Management
  await createGroupConvo(
    [users.tanner, users.schezo, users.angel, users.pedro],
    [
      { sender: users.schezo, text: "Team, we need to finalize the Q3 budget by end of week.", minsAgo: 400 },
      { sender: users.angel,  text: "I'll have the project costs ready by Wednesday.", minsAgo: 395 },
      { sender: users.pedro,  text: "Marketing budget is already drafted, will share shortly.", minsAgo: 390 },
      { sender: users.tanner, text: "Sales projections are done, sending them to you now Schezo.", minsAgo: 385 },
      { sender: users.schezo, text: "Great, let's meet Thursday to consolidate everything.", minsAgo: 380 },
      { sender: users.angel,  text: "Thursday works for me.", minsAgo: 378 },
      { sender: users.pedro,  text: "Same here!", minsAgo: 377 },
    ]
  );

  // Group: IT and Support
  await createGroupConvo(
    [users.adeleke, users.rd2d, users.abimbola, users.ryan],
    [
      { sender: users.adeleke,  text: "Heads up, there's a planned maintenance window tonight from 11pm-1am.", minsAgo: 500 },
      { sender: users.ryan,     text: "Got it, I'll make sure deployments are done before then.", minsAgo: 495 },
      { sender: users.abimbola, text: "I'll hold off on any merges until after maintenance.", minsAgo: 490 },
      { sender: users.rd2d,     text: "Should I notify customers about potential downtime?", minsAgo: 485 },
      { sender: users.adeleke,  text: "Yes please, send a brief notice to active accounts.", minsAgo: 480 },
      { sender: users.rd2d,     text: "On it!", minsAgo: 478 },
    ]
  );

  // Group: Research and Data
  await createGroupConvo(
    [users.zim, users.sailor, users.abimbola, users.schezo],
    [
      { sender: users.sailor,   text: "I've completed the user interviews, 47 responses total.", minsAgo: 600 },
      { sender: users.zim,      text: "Great, I'll start analyzing the quantitative data.", minsAgo: 595 },
      { sender: users.abimbola, text: "Do you need me to set up a dashboard for the results?", minsAgo: 590 },
      { sender: users.sailor,   text: "That would be amazing, yes please!", minsAgo: 585 },
      { sender: users.schezo,   text: "Can we have a readout by next Monday?", minsAgo: 580 },
      { sender: users.zim,      text: "Should be doable, I'll keep you posted.", minsAgo: 578 },
    ]
  );

  // Group: Marketing and Sales
  await createGroupConvo(
    [users.tanner, users.pedro, users.sailor, users.rd2d],
    [
      { sender: users.pedro,  text: "The new campaign goes live Monday, everyone ready?", minsAgo: 700 },
      { sender: users.tanner, text: "Sales team is briefed and ready to follow up on leads.", minsAgo: 695 },
      { sender: users.sailor, text: "Research assets are uploaded to the shared drive.", minsAgo: 690 },
      { sender: users.rd2d,   text: "Customer service scripts are updated for the new campaign.", minsAgo: 685 },
      { sender: users.pedro,  text: "Perfect, let's crush it this week!", minsAgo: 680 },
      { sender: users.tanner, text: "Let's go!", minsAgo: 678 },
    ]
  );

  // Group: All hands
  await createGroupConvo(
    [users.tanner, users.schezo, users.angel, users.ryan, users.abimbola, users.beethoven, users.naila, users.pedro, users.zim, users.sailor, users.rd2d, users.adeleke],
    [
      { sender: users.schezo,    text: "Good morning everyone! Company all-hands is this Friday at 10am.", minsAgo: 1000 },
      { sender: users.angel,     text: "Will there be an agenda shared beforehand?", minsAgo: 995 },
      { sender: users.schezo,    text: "Yes, sending it out tomorrow.", minsAgo: 990 },
      { sender: users.naila,     text: "Will Q2 financials be covered?", minsAgo: 985 },
      { sender: users.schezo,    text: "Yes, Naila will present the financial summary.", minsAgo: 980 },
      { sender: users.pedro,     text: "Looking forward to it!", minsAgo: 975 },
      { sender: users.beethoven, text: "Will it be recorded for those who can't attend live?", minsAgo: 970 },
      { sender: users.schezo,    text: "Yes, it will be recorded and shared afterwards.", minsAgo: 965 },
      { sender: users.rd2d,      text: "Thanks for letting us know!", minsAgo: 960 },
      { sender: users.tanner,    text: "See everyone Friday!", minsAgo: 955 },
    ]
  );

  console.log('Seeding complete!');
}

seed().catch(console.error);