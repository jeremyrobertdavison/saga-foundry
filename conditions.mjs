export const ALL_CONDITIONS = [
  'Injured', 'Injured (2)', 'Injured (3)', 'Injured (4)', 'Injured (5)', 'Injured (6)', 'Injured (7)',
  'Defeated',
  'Empowered', 'Empowered (2)', 'Empowered (3)', 'Empowered (4)', 'Empowered (5)', 'Empowered (6)', 'Empowered (7)',
  'Unstable', 'Power Dampened', 'Stunned', 'Demoralized', 'Fearful', 'Enraged', 'Confused', 'Compelled',
  'Distracted', 'Delirious', 'Hacked', 'Guilt-Ridden', 'Guilty', 'Distrust', 'Publicly Despised',
  'Muted', 'Deafened', 'Anchored', 'Panicking', 'Frozen in Fear'
];

export const CONDITION_EFFECTS = {
  'Injured': '-1', 'Injured (2)': '-1d4', 'Injured (3)': '-1d6', 'Injured (4)': '-1d8', 'Injured (5)': '-1d10', 'Injured (6)': '-1d12', 'Injured (7)': '-1d20',
  'Empowered': '+1', 'Empowered (2)': '+1d4', 'Empowered (3)': '+1d6', 'Empowered (4)': '+1d8', 'Empowered (5)': '+1d10', 'Empowered (6)': '+1d12', 'Empowered (7)': '+1d20',
};

export const CONDITION_DESCRIPTIONS = {
  'Injured': 'Receive -1 on all rolls made.',
  'Injured (2)': 'Receive -1d4 on all rolls made.',
  'Injured (3)': 'Receive -1d6 on all rolls made.',
  'Injured (4)': 'Receive -1d8 on all rolls made.',
  'Injured (5)': 'Receive -1d10 on all rolls made.',
  'Injured (6)': 'Receive -1d12 on all rolls made.',
  'Injured (7)': 'Receive -1d20 on all rolls made.',
  'Defeated': 'Character is unable to take actions and is removed from Initiative.',
  'Empowered': 'Receive +1 on all rolls made.',
  'Empowered (2)': 'Receive +1d4 on all rolls made.',
  'Empowered (3)': 'Receive +1d6 on all rolls made.',
  'Empowered (4)': 'Receive +1d8 on all rolls made.',
  'Empowered (5)': 'Receive +1d10 on all rolls made.',
  'Empowered (6)': 'Receive +1d12 on all rolls made.',
  'Empowered (7)': 'Receive +1d20 on all rolls made.',
  'Unstable': "Character's power becomes unreliable.",
  'Power Dampened': 'Character is unable to roll any of their abilities under "Powers".',
  'Stunned': 'Character skips their next turn in the initiative and cannot join team attacks.',
  'Demoralized': 'Receive a penalty on rolls based on severity.',
  'Fearful': 'Cannot move toward the source of your fear.',
  'Enraged': 'Must use next turn to attack nearest target.',
  'Confused': 'Character moves or acts unpredictably (Odds/Evens check).',
  'Compelled': 'Character must take actions as directed by the source.',
  'Distracted': 'Minor penalty (-1d4) to teamwork related rolls.',
  'Delirious': 'Major penalty (-1d12) to teamwork related rolls.',
  'Hacked': 'Electronic device is unusable.',
  'Guilt-Ridden': 'Immune to benefits of Heroism.',
  'Guilty': 'Cannot gain additional Heroism.',
  'Distrust': 'Cannot take actions that rely on allies.',
  'Publicly Despised': 'Major penalty (-1d12) on all social contests.',
  'Muted': 'Cannot speak or use verbal components.',
  'Deafened': 'Cannot hear or use skills reliant on hearing.',
  'Anchored': 'Cannot be moved by external abilities.',
  'Panicking': 'Unable to use reactions to assist others.',
  'Frozen in Fear': 'Unable to move or act in presence of fear source.'
};

