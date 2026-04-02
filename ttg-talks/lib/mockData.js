export const currentUser = {
  id: 'lemres',
  name: 'Lemres',
  email: 'lemres.ttg',
};

export const contacts = [
  { id: '1', name: 'Schezo Wegey',    role: 'Project Manager',      avatar: '🧝' },
  { id: '2', name: 'Abimbola Pitan',  role: 'Full-Stack Developer', avatar: '🦊' },
  { id: '3', name: 'Adeleke Adeyemo', role: 'I.T. Support',         avatar: '🐙' },
  { id: '4', name: 'Tanner Petreman', role: 'Sales',                avatar: '🚶' },
  { id: '5', name: 'Angel Iglesias',  role: 'Project Manager',      avatar: '🐛' },
  { id: '6', name: 'Ryan Ware',       role: 'Accountant',           avatar: '🧀' },
];

export const conversations = {
  '1': [
    { id: 'm1', from: '1',      text: 'Hey, are you ready for the meeting?', time: '9:00 AM' },
    { id: 'm2', from: 'lemres', text: 'Almost! Give me 5 minutes.',          time: '9:01 AM' },
    { id: 'm3', from: '1',      text: 'Perfect, I will be ready.',           time: '9:02 AM' },
  ],
  '2': [
    { id: 'm1', from: '2',      text: 'I will be there',                     time: '8:30 AM' },
  ],
  '3': [
    { id: 'm1', from: 'lemres', text: 'Does that work for you?',             time: '10:00 AM' },
    { id: 'm2', from: '3',      text: 'ok sounds good',                      time: '10:05 AM' },
  ],
  '4': [
    { id: 'm1', from: '4',      text: 'In the last meeting we discussed the roadmap.', time: 'Yesterday' },
  ],
  '5': [
    { id: 'm1', from: '5',      text: 'The project is going well!',          time: 'Yesterday' },
  ],
  '6': [
    { id: 'm1', from: '6',      text: 'We will meet next Monday.',           time: 'Mon' },
  ],
};