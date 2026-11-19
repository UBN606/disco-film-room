(() => {
  const get = id => document.getElementById('sideline-' + id);
  const formations = [...goGoRules.sets, 'Gun Y Trips Offset', 'Gun Deuce', 'Gun Spread Y-Slot Wk'];
  const quick = [
    'Light box, give. Press inside, then cut.',
    'Confirm the hook. Slant, then flat.',
    'Read the safety. Seam if open.',
    'Numbers outside, throw. Otherwise give.',
    'Read the flat defender. Snag or flat.',
    'Press the wing surface. One cut downhill.',
    'Edge wide, give. Edge crashes, keep.',
    'Sell run. Check safety over the seam.',
    'Overhang widens with jet, give inside.',
    'Own the force defender before you sweep.',
    'Clear the boot edge. Wheel, then outlet.',
    'Hook clears, throw pop. Otherwise give.',
    'Soft corner, smoke. Otherwise check the box.',
    'Key the edge. Give if wide, keep if he crashes.',
    'Let the cross clear the hook.',
    'Check safety rotation. Post, then outlet.',
    'Shallow against pressure. Dig at the sticks.',
    'Check pop and bubble. Give if both close.',
    'Man, follow the shallow. Zone, find the sit.',
    'Check hook and safety. Dig if it clears.'
  ];
  const wingQuick = ['Read the flat defender. Stick or flat.', 'Light box, give inside.',
    'Pitch key widens, keep. He commits, pitch early.', 'Sell the run. Read the safety.'];
  const plays = lessons.map(([set, name, , read], index) => ({
    index, name, read, quick: quick[index] ?? wingQuick[index - 22],
    formation: index < 16 ? formations[Math.floor(index / 4)] : set,
    slot: index < 16 ? buttons[index % 4] : index >= 22 ? ['Q', 'E', 'Z', 'C'][index - 22] + ' editor slot' : 'Formation menu'
  })).filter(play => play.index !== 20 && play.index !== 21);
  const houston = [
    { index: 0, look: 0, label: 'Early downs · Light box', cue: 'Press inside and cut off the first clean block.' },
    { index: 8, look: 0, label: 'Early downs · Edge follows jet', cue: 'Give inside underneath the motion.' },
    { index: 5, look: 0, label: 'Short yardage · Run fit', cue: 'Give downhill when the box is favorable.' },
    { index: 6, look: 1, label: 'Third and two · Give or keep', cue: 'Edge stays wide, give. Edge crashes, keep.' },
    { index: 1, look: 3, label: 'Two minute · Quick middle', cue: 'Confirm the hook drop, then slant to flat.' },
    { index: 4, look: 2, label: 'Two minute · Quick outlet', cue: 'Read the flat defender. Snag inside or flat outside.' },
    { index: 16, look: 3, label: 'Third and eight · Drive', cue: 'Check the hook. Hit the in-breaker if it clears at the sticks.' },
    { index: 18, look: 3, label: 'Third and eight · Mesh', cue: 'Man, follow the winning shallow. Zone, find the sit window.' },
    { index: 13, look: 1, label: 'High red zone · QB run', cue: 'Key the tagged edge. Give if wide, keep behind the lead if he crashes.' },
    { index: 24, look: 0, label: 'Third and two · Pitch answer', cue: 'Keep if the pitch key widens. Pitch early if he commits and the lane is clear.' }
  ].map(entry => ({ ...plays.find(play => play.index === entry.index), ...entry }));
  let visible = [];
  let selected;
  let deadline = null;
  let clockTimer;

  function clockReady() {
    return deadline !== null && deadline - performance.now() > 12000;
  }

  function refreshClock() {
    const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    get('cue').disabled = !selected || !clockReady();
    const message = remaining === null ? 'Enter the visible play clock to enable a live cue.'
      : remaining <= 12 ? 'Stay with the call. Clock cutoff.' : remaining + ' seconds · Live cue available';
    if (get('status').textContent !== message) get('status').textContent = message;
    if (remaining === 0) clearInterval(clockTimer);
  }

  function select(play) {
    selected = play;
    get('detail').hidden = !play;
    if (play) {
      get('slot').textContent = play.formation + ' · ' + play.slot;
      get('play').textContent = play.name;
      get('read').textContent = play.cue || play.read;
    }
    for (const button of get('plays').querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.index) === play?.index));
    }
    refreshClock();
  }

  function render() {
    const source = get('package').value === 'houston' ? houston : plays;
    const query = get('search').value.trim().toLowerCase();
    visible = source.filter(play => [play.formation, play.name, play.slot, play.label].join(' ').toLowerCase().includes(query));
    get('plays').replaceChildren(...visible.map(play => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.index = play.index;
      const title = document.createElement('strong');
      title.textContent = play.name;
      const slot = document.createElement('span');
      slot.textContent = play.slot;
      const caption = document.createElement('small');
      caption.textContent = play.label ? play.label + ' · ' + play.formation : play.formation;
      button.append(title, slot, caption);
      button.onclick = () => select(play);
      return button;
    }));
    if (!visible.length) get('plays').textContent = 'No plays match.';
    select(visible.find(play => play.index === selected?.index) || visible[0]);
  }

  function textFor(play) {
    return play.name + '. ' + (play.cue || play.quick);
  }

  get('package').onchange = get('search').oninput = render;
  get('clock').oninput = () => {
    clearInterval(clockTimer);
    const input = get('clock');
    deadline = input.value && input.validity.valid ? performance.now() + Number(input.value) * 1000 : null;
    refreshClock();
    if (deadline !== null) clockTimer = setInterval(refreshClock, 200);
  };
  get('listen').onclick = () => speakParts([lessonAudio(lessons[selected.index])]);
  get('cue').onclick = () => {
    if (clockReady() && selected) speakParts([textFor(selected)]);
    refreshClock();
  };
  get('rep').onclick = () => {
    lab.lesson.value = selected.index;
    lab.defense.value = selected.look ?? 0;
    resetLab();
    lab.field.scrollIntoView({ block: 'center' });
    lab.play.focus({ preventScroll: true });
  };
  get('print').onclick = () => {
    const list = get('package').value === 'houston' ? houston : plays;
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    for (const heading of ['Formation', 'Call', 'Slot', 'QB read']) {
      const cell = document.createElement('th');
      cell.textContent = heading;
      head.append(cell);
    }
    const body = table.createTBody();
    for (const play of list) {
      const row = body.insertRow();
      for (const value of [play.formation, play.name, play.slot, play.cue || play.read]) row.insertCell().textContent = value;
    }
    get('print-sheet').replaceChildren(table);
    window.print();
  };
  render();
})();
(() => {
  const picker = document.getElementById('coach-chapter');
  const player = document.getElementById('coach-player');
  for (const [title, file] of Object.entries(window.goGoChapterFiles)) picker.add(new Option(title, file));
  function load() {
    player.src = window.goGoEmbedded?.[picker.value] || 'GO-GO-Audio/' + picker.value;
  }
  picker.onchange = load;
  player.onplay = () => {
    speechRequest++;
    window.speechSynthesis?.cancel();
    recordedCue?.pause();
  };
  load();
})();
