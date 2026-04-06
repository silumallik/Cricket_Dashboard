let undoUsed = false;

let match = {
    overs: 0,
    totalOvers: 0,
    teams: {
        A: { score: 0, wickets: 0, balls: 0, overs: [], players: {}, striker: '', nonStriker: '', bowler: '', bowlers: {}, },
        B: { score: 0, wickets: 0, balls: 0, overs: [], players: {}, striker: '', nonStriker: '', bowler: '', bowlers: {}, }
    },
    currentTeam: 'A',
    lastState: null
};

const teamForm = document.getElementById('teamForm');
const playerForm = document.getElementById('playerForm');

const bowlerForm = document.getElementById('bowlerForm');

bowlerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const team = match.teams[match.currentTeam];
    const bowlerName = document.getElementById('nextBowler').value;

    // Set bowler for new over
    team.bowler = bowlerName;

    // ✅ YAHAN ADD KARO   ***
    // if (!team.bowlers[bowlerName]) {
    //   team.bowlers[bowlerName] = {
    //     balls: 0,
    //     runs: 0,
    //     wickets: 0
    //   };
    // }

    // Create new over card
    renderOverCard(match.currentTeam);

    // Hide popup
    document.getElementById('bowlerPopup').style.display = 'none';
});

teamForm.addEventListener('submit', (e) => {
    e.preventDefault();
    match.teams.A.name = document.getElementById('teamAName').value;
    match.teams.B.name = document.getElementById('teamBName').value;
    match.totalOvers = parseInt(document.getElementById('totalOvers').value);
    document.getElementById('teamAHeader').innerText = match.teams.A.name;
    document.getElementById('teamBHeader').innerText = match.teams.B.name;
    teamForm.style.display = 'none';
    playerForm.style.display = 'block';
});

playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let bowler = document.getElementById('bowler').value;
    let striker = document.getElementById('striker').value;
    let nonStriker = document.getElementById('nonStriker').value;

    let team = match.teams[match.currentTeam];
    team.bowler = bowler;
    team.striker = striker;
    team.nonStriker = nonStriker;

    // Initialize players
    // [striker, nonStriker].forEach(p => {
    //   if (!team.players[p]) team.players[p] = { runs: 0, balls: 0 };
    // });

    // Initialize players
    [striker, nonStriker].forEach(p => {
        if (!team.players[p]) {
            team.players[p] = {
                runs: 0,
                balls: 0,
                ones: 0,
                twos: 0,
                fours: 0,
                sixes: 0
            };
        }
    });


    // Create first over for new innings
    renderOverCard(match.currentTeam);

    // Hide the form until next over
    playerForm.style.display = 'none';
});

function renderOverCard(teamKey) {
    const team = match.teams[teamKey];
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const overCard = document.createElement('div');
    overCard.classList.add('over-card');

    overCard.innerHTML = `
      <div><strong>Over: </strong> ${team.overs.length + 1}</div>
      <div><strong>Bowler: </strong>${team.bowler}</div>
      <div>
        <strong>Striker:</strong> <span class="striker-name">${team.striker}</span> | 
        <strong>Non-Striker:</strong> <span class="non-striker-name">${team.nonStriker}</span>
      </div>
      <div class="ball-history">Balls: </div>
      <div class="ball-buttons">
        <button onclick="ball('${teamKey}','0', this)">0</button>
        <button onclick="ball('${teamKey}','1', this)">1</button>
        <button onclick="ball('${teamKey}','2', this)">2</button>
        <button onclick="ball('${teamKey}','3', this)">3</button>
        <button onclick="ball('${teamKey}','4', this)">4</button>
        <button onclick="ball('${teamKey}','6', this)">6</button>
        <button onclick="ball('${teamKey}','W', this)">W</button>
        <button onclick="ball('${teamKey}','RO', this)">RO</button>
        <button onclick="ball('${teamKey}','WD', this)">WD</button>
        <button onclick="ball('${teamKey}','NB', this)">NB</button>
        <button onclick="undo('${teamKey}', this)">UNDO</button>
      </div>
    `;
    overCardsDiv.appendChild(overCard);
    team.overs.push({ balls: [] });

    // Highlight striker/non-striker for the first time
    updateOverCardDisplay(teamKey);
}

function ball(teamKey, val, btn) {
    let team = match.teams[teamKey];
    if (!undoUsed) {
        match.lastState = JSON.stringify(match);
    }

    // Current over reference
    let currentOver = team.overs[team.overs.length - 1];

    if (val === 'W') {
        const modal = document.getElementById('wModal');
        modal.style.display = 'flex';
        modal.dataset.teamKey = teamKey;
        console.log("W CLICKED - ball()");

        // ✅ Check if all out
        if (team.wickets >= 10) {
            checkInningsEnd(teamKey);  // Switch innings if needed
            return; // Stop processing further
        }

        return;
    }

    else if (val === 'RO') {
        const modal = document.getElementById('roModal');
        modal.style.display = 'flex';

        // Store team info for later
        modal.dataset.teamKey = teamKey;

        // ✅ Check if all out
        if (team.wickets >= 10) {
            checkInningsEnd(teamKey);  // Switch innings if needed
            return; // Stop processing further
        }

        return; // 🚫 stop normal flow
    }
    else if (val === 'NB') {
        const modal = document.getElementById('nbModal');
        modal.style.display = 'flex';
        modal.dataset.teamKey = teamKey;

        // ✅ Check if all out
        if (team.wickets >= 10) {
            checkInningsEnd(teamKey);  // Switch innings if needed
            return; // Stop processing further
        }

        return;
    }
    else if (val === 'WD') {
        team.score += 1;
        currentOver.balls.push("WD");

        // UI update
        document.querySelector(`#team${teamKey}Score`).innerText = `${team.score}/${team.wickets}`;
        btn.parentElement.previousElementSibling.innerText = 'Balls: ' + currentOver.balls.join(' ');

        // Chase update
        if (match.currentTeam === 'B') {
            updateChaseInfo();
        }

        return; // 🔥 VERY IMPORTANT → yahin stop kar do
    }
    else {
        val = parseInt(val);
        team.score += val;
        team.players[team.striker].runs += val;
        team.players[team.striker].balls += 1;
        // p.runs += val;
        // p.balls += 1;
        if (val === 1) team.players[team.striker].ones++;
        if (val === 2) team.players[team.striker].twos++;
        if (val === 4) team.players[team.striker].fours++;
        if (val === 6) team.players[team.striker].sixes++;
        currentOver.balls.push(val);

        // Strike change for odd runs
        if (val % 2 !== 0) {
            swapStrike(team);
        }
    }

    team.balls++;
    document.querySelector(`#team${teamKey}Score`).innerText = `${team.score}/${team.wickets}`;
    document.querySelector(`#team${teamKey}Overs`).innerText = `${Math.floor(team.balls / 6)}.${team.balls % 6}`;
    btn.parentElement.previousElementSibling.innerText = 'Balls: ' + currentOver.balls.join(' ');

    if (team.balls % 6 === 0 && team.balls > 0) {
        swapStrike(team);
        disableOverButtons(teamKey); // disable this over's buttons
        const switched = checkInningsEnd(teamKey);
        if (!switched) {
            document.getElementById('bowlerPopup').style.display = 'flex';
            document.getElementById('nextBowler').value = '';
        }
    }

    renderPlayerTable(teamKey);
    updateOverCardDisplay(teamKey);
    updateOverCardNames(match.teams[teamKey]);

    if (match.currentTeam === 'B') {
        updateChaseInfo();
    }

    // --- ✅ Check match winner after all updates ---
    if (checkMatchWinner()) {
        return; // stop further ball processing if match ended
    }

    // renderBowlerTable(teamKey);
    undoUsed = false;
}

function undo(teamKey) {
    if (undoUsed || !match.lastState) return;

    // Restore previous state
    match = JSON.parse(match.lastState);

    // ❌ अब दुबारा undo नहीं होगा
    undoUsed = true;
    match.lastState = null;

    // UI update
    document.getElementById('teamAScore').innerText =
        `${match.teams.A.score}/${match.teams.A.wickets}`;
    document.getElementById('teamAOvers').innerText =
        `${Math.floor(match.teams.A.balls / 6)}.${match.teams.A.balls % 6}`;

    document.getElementById('teamBScore').innerText =
        `${match.teams.B.score}/${match.teams.B.wickets}`;
    document.getElementById('teamBOvers').innerText =
        `${Math.floor(match.teams.B.balls / 6)}.${match.teams.B.balls % 6}`;

    renderPlayerTable('A');
    renderPlayerTable('B');

    // ✅ Ball history clean update
    refreshBallHistory('A');
    refreshBallHistory('B');
}

function ensureBowler(team) {
    if (!team.bowler) return null;

    if (!team.bowlers) {
        team.bowlers = {};
    }

    if (!team.bowlers[team.bowler]) {
        team.bowlers[team.bowler] = {
            balls: 0,
            runs: 0,
            wickets: 0
        };
    }

    return team.bowlers[team.bowler];
}

function swapStrike(team) {
    // Swap in the team object
    let temp = team.striker;
    team.striker = team.nonStriker;
    team.nonStriker = temp;

    // Update the over card text
    updateOverCardNames(team);
}

function updateOverCardNames(team) {
    const teamKey = team === match.teams.A ? 'A' : 'B';
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const overCard = overCardsDiv.lastElementChild;
    if (!overCard) return;

    const strikerSpan = overCard.querySelector('.striker-name');
    const nonStrikerSpan = overCard.querySelector('.non-striker-name');

    // Update text
    strikerSpan.innerText = team.striker;
    nonStrikerSpan.innerText = team.nonStriker;

    // Highlight
    strikerSpan.style.backgroundColor = '#d1ffd1'; // light green
    nonStrikerSpan.style.backgroundColor = '#ffe0b3'; // light orange
}

function renderPlayerTable(teamKey) {
    let tbody = document.querySelector(`#team${teamKey}Players tbody`);
    tbody.innerHTML = '';
    let team = match.teams[teamKey];

    for (let player in team.players) {
        let p = team.players[player];
        let sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : 0;

        // Highlight striker
        let isStriker = player === team.striker ? 'background: #d1ffd1; font-weight: bold;' : '';

        tbody.innerHTML += `
        <tr style="${isStriker}">
          <td>${player}</td>
          <td>${p.runs}</td>
          <td>${p.balls}</td>
          <td>${p.ones}</td>
          <td>${p.twos}</td>
          <td>${p.fours}</td>
          <td>${p.sixes}</td>
          <td>${sr}</td>
        </tr>
        `;
    }
}

//     function renderPlayerTable(teamKey) {
//       let tbody = document.querySelector(`#team${teamKey}Players tbody`);
//       tbody.innerHTML = '';
//       let team = match.teams[teamKey];

//       for (let player in team.players) {
//         let p = team.players[player];
//         let sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : 0;

//         let isStriker = player === team.striker
//           ? 'background: #d1ffd1; font-weight: bold;'
//           : '';

//         tbody.innerHTML += `
// <tr style="${isStriker}">
//   <td>${player}</td>
//   <td>${p.runs}</td>
//   <td>${p.balls}</td>
//   <td>${p.ones}</td>
//   <td>${p.twos}</td>
//   <td>${p.fours}</td>
//   <td>${p.sixes}</td>
//   <td>${sr}</td>
// </tr>
// `;
//       }
//     }

function updateOverCardDisplay(teamKey) {
    let team = match.teams[teamKey];
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    // Get the latest over card
    const overCard = overCardsDiv.lastElementChild;
    if (!overCard) return;

    const strikerSpan = overCard.querySelector('.striker-name');
    const nonStrikerSpan = overCard.querySelector('.non-striker-name');

    if (strikerSpan) strikerSpan.style.backgroundColor = '#d1ffd1'; // Light green for striker
    if (nonStrikerSpan) nonStrikerSpan.style.backgroundColor = '#ffe0b3'; // Light orange for non-striker
}

function checkInningsEnd(teamKey) {
    const team = match.teams[teamKey];

    // Condition 1: All overs completed
    const oversCompleted = Math.floor(team.balls / 6) >= match.totalOvers;

    // Condition 2: All wickets fallen
    const allOut = team.wickets >= 10;

    if (oversCompleted || allOut) {
        if (match.currentTeam === 'A') {
            alert(`Team A innings complete! Team B will start now.`);
            match.currentTeam = 'B';


            // Show bottom nav for Team B
            const nav = document.getElementById('matchTargetNav');
            nav.style.display = 'block';
            document.getElementById('targetScore').innerText = `Target: ${match.teams.A.score + 1}`;
            updateChaseInfo(); // initial runs/balls needed


            // Reset Team B data
            match.teams.B.balls = 0;
            match.teams.B.wickets = 0;
            match.teams.B.overs = [];
            match.teams.B.players = {};
            document.getElementById('teamBOverCards').innerHTML = '';
            document.querySelector('#teamBPlayers tbody').innerHTML = '';

            // Show **full player form** for Team B
            playerForm.style.display = 'block';
            playerForm.querySelector('#bowler').value = '';
            playerForm.querySelector('#striker').value = '';
            playerForm.querySelector('#nonStriker').value = '';

        } else {
            alert('Match Complete!');
        }
        return true; // innings switched
    }

    return false; // continue current innings
}

function checkMatchWinner() {
    const teamA = match.teams.A;
    const teamB = match.teams.B;

    // Clear any previous winner messages
    document.querySelectorAll('.team-board .winner-text').forEach(el => el.remove());

    if (match.currentTeam !== 'B') return false; // Only check after Team B starts

    let winnerBoard = null;
    let text = '';

    if (teamB.score > teamA.score) {
        // Team B wins
        winnerBoard = document.getElementById('teamBBoard');
        text = `Winner! Score: ${teamB.score} - ${teamA.score}`;

    } else {
        const oversCompleted = Math.floor(teamB.balls / 6) >= match.totalOvers;
        const allOut = teamB.wickets >= 10;
        if (oversCompleted || allOut) {
            // Team A wins
            winnerBoard = document.getElementById('teamABoard');
            text = `Winner! Score: ${teamA.score} - ${teamB.score}`;

        }
    }

    if (winnerBoard) {
        const div = document.createElement('div');
        div.classList.add('winner-text');
        div.style.color = 'darkgreen';
        div.style.fontSize = '18px';
        div.style.fontWeight = 'bold';
        div.style.margin = '5px 0';
        div.innerText = text;
        winnerBoard.prepend(div); // Show above board content

        // ✅ Disable all over buttons for both teams
        const teamKeys = ['A', 'B'];
        teamKeys.forEach(k => {
            const overCardsDiv = document.getElementById(k === 'A' ? 'teamAOverCards' : 'teamBOverCards');
            overCardsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);
        });

        match.currentTeam = null; // stop the match
        return true;
    }

    return false;
}

function updateChaseInfo() {
    const teamB = match.teams.B;
    const totalBalls = match.totalOvers * 6;
    const ballsLeft = totalBalls - teamB.balls;
    const runsNeeded = (match.teams.A.score + 1) - teamB.score;
    document.getElementById('chaseInfo').innerText = `${runsNeeded} runs needed from ${ballsLeft} balls`;
}

function disableOverButtons(teamKey) {
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const lastOverCard = overCardsDiv.lastElementChild;
    if (!lastOverCard) return;
    const buttons = lastOverCard.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
}

function renderBowlerTable(teamKey) {
    let team = match.teams[teamKey];
    let tbody = document.querySelector(`#team${teamKey}Bowlers tbody`);
    tbody.innerHTML = '';

    for (let bowler in team.bowlers) {
        let b = team.bowlers[bowler];

        let overs = `${Math.floor(b.balls / 6)}.${b.balls % 6}`;
        let eco = b.balls > 0 ? (b.runs / (b.balls / 6)).toFixed(2) : 0;

        tbody.innerHTML += `
      <tr>
        <td>${bowler}</td>
        <td>${overs}</td>
        <td>${b.runs}</td>
        <td>${b.wickets}</td>
        <td>${eco}</td>
      </tr>
    `;
    }
}

function refreshBallHistory(teamKey) {
    let team = match.teams[teamKey];
    if (team.overs.length === 0) return;

    let currentOver = team.overs[team.overs.length - 1];

    const overCardsDiv = document.getElementById(
        teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards'
    );

    const lastOverCard = overCardsDiv.lastElementChild;
    if (!lastOverCard) return;

    lastOverCard.querySelector('.ball-history').innerText =
        'Balls: ' + currentOver.balls.join(' ');
}

document.getElementById('roForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const modal = document.getElementById('roModal');
    const teamKey = modal.dataset.teamKey;
    const btn = modal.dataset.btn;

    const newBatsman = document.getElementById('roNewBatsman').value.trim();
    const runs = parseInt(document.getElementById('roRuns').value) || 0;
    const outPlayer = document.getElementById('roOutPlayer').value;

    let team = match.teams[teamKey];
    let currentOver = team.overs[team.overs.length - 1];

    // 🧠 Determine who is out
    let outName = outPlayer === 'striker' ? team.striker : team.nonStriker;

    // Add runs (if any)
    if (runs > 0) {
        team.score += runs;
    }

    // Add ball
    team.balls++;

    // ✅ 👉 YAHAN ADD KARO ***
    // let bowler = ensureBowler(team);
    // if (bowler) {
    //   bowler.balls += 1;
    //   bowler.wickets += 1;
    // }

    // Add runs to striker (only valid case)
    if (runs > 0) {
        team.players[team.striker].runs += runs;

        // ✅ 👉 YAHAN ADD KARO ***
        // let bowler = ensureBowler(team);
        // if (bowler) {
        //   bowler.runs += runs;
        // }
    }

    team.players[team.striker].balls += 1;

    // Add wicket
    team.wickets++;

    // 🧾 Ball history format
    let historyText = runs > 0 ? `${runs}RO` : `RO`;
    currentOver.balls.push(historyText);

    // 🧍 Replace out player
    if (outPlayer === 'striker') {
        team.striker = newBatsman;
    } else {
        team.nonStriker = newBatsman;
    }

    // Add new batsman to table
    // if (!team.players[newBatsman]) {
    //   team.players[newBatsman] = { runs: 0, balls: 0 };
    // }

    // Add new batsman to table
    if (!team.players[newBatsman]) {
        team.players[newBatsman] = {
            runs: 0,
            balls: 0,
            ones: 0,
            twos: 0,
            fours: 0,
            sixes: 0
        };
    }

    // 🔄 Strike logic
    if (runs % 2 !== 0) {
        swapStrike(team);
    }

    // Update UI
    document.querySelector(`#team${teamKey}Score`).innerText = `${team.score}/${team.wickets}`;
    document.querySelector(`#team${teamKey}Overs`).innerText =
        `${Math.floor(team.balls / 6)}.${team.balls % 6}`;

    // Update ball history UI
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const lastOverCard = overCardsDiv.lastElementChild;
    lastOverCard.querySelector('.ball-history').innerText =
        'Balls: ' + currentOver.balls.join(' ');

    renderPlayerTable(teamKey);
    updateOverCardNames(team);

    // Over complete check
    if (team.balls % 6 === 0) {
        swapStrike(team);
        disableOverButtons(teamKey);

        const switched = checkInningsEnd(teamKey);
        if (!switched) {
            document.getElementById('bowlerPopup').style.display = 'flex';
        }
    }

    // Chase update
    if (match.currentTeam === 'B') {
        updateChaseInfo();
    }

    checkMatchWinner();

    // ❌ Close modal
    modal.style.display = 'none';

    // Reset form
    this.reset();
    // renderBowlerTable(teamKey);
});

document.getElementById('roCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('roModal');

    // 🔥 Restore previous state (UNDO)
    if (match.lastState) {
        match = JSON.parse(match.lastState);

        // UI update
        document.getElementById('teamAScore').innerText =
            `${match.teams.A.score}/${match.teams.A.wickets}`;
        document.getElementById('teamAOvers').innerText =
            `${Math.floor(match.teams.A.balls / 6)}.${match.teams.A.balls % 6}`;

        document.getElementById('teamBScore').innerText =
            `${match.teams.B.score}/${match.teams.B.wickets}`;
        document.getElementById('teamBOvers').innerText =
            `${Math.floor(match.teams.B.balls / 6)}.${match.teams.B.balls % 6}`;

        renderPlayerTable('A');
        renderPlayerTable('B');
    }

    // ❌ Close modal
    modal.style.display = 'none';

    // Reset form
    document.getElementById('roForm').reset();
});

document.getElementById('nbForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const modal = document.getElementById('nbModal');
    const teamKey = modal.dataset.teamKey;

    const runs = parseInt(document.getElementById('nbRuns').value) || 0;
    const outType = document.getElementById('nbOutType').value;
    const newBatsman = document.getElementById('nbNewBatsman').value.trim();

    let team = match.teams[teamKey];
    let currentOver = team.overs[team.overs.length - 1];

    // ✅ NB always +1 run
    team.score += 1 + runs;

    // ✅ 👉 YAHAN ADD KARO ***
    // let bowler = ensureBowler(team);
    // if (bowler) {
    //   bowler.runs += runs;
    // }

    // ❌ ball count NOT increase

    // ✅ runs to striker
    if (runs > 0) {
        team.players[team.striker].runs += runs;
    }

    // ❌ ball count nahi but batsman ball count bhi usually nahi badhta NB pe
    // (optional: agar chaho add kar sakte ho)

    // 🧾 History
    let historyText = 'NB';
    if (runs > 0) historyText = `NB+${runs}`;

    // ✅ Wicket case
    if (outType !== 'no') {
        team.wickets++;

        historyText += 'W';

        if (outType === 'striker') {
            team.striker = newBatsman;
        } else {
            team.nonStriker = newBatsman;
        }


        if (!team.players[newBatsman]) {
            team.players[newBatsman] = {
                runs: 0,
                balls: 0,
                ones: 0,
                twos: 0,
                fours: 0,
                sixes: 0
            };
        }

        // if (!team.players[newBatsman]) {
        //   team.players[newBatsman] = { runs: 0, balls: 0 };
        // }
    }

    currentOver.balls.push(historyText);

    // 🔄 Strike change
    if (runs % 2 !== 0) {
        swapStrike(team);
    }

    // UI update
    document.querySelector(`#team${teamKey}Score`).innerText =
        `${team.score}/${team.wickets}`;

    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const lastOverCard = overCardsDiv.lastElementChild;

    lastOverCard.querySelector('.ball-history').innerText =
        'Balls: ' + currentOver.balls.join(' ');

    renderPlayerTable(teamKey);
    updateOverCardNames(team);

    if (match.currentTeam === 'B') {
        updateChaseInfo();
    }

    checkMatchWinner();

    modal.style.display = 'none';
    this.reset();
    // renderBowlerTable(teamKey);
});

document.getElementById('nbCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('nbModal');

    if (match.lastState) {
        match = JSON.parse(match.lastState);

        document.getElementById('teamAScore').innerText =
            `${match.teams.A.score}/${match.teams.A.wickets}`;
        document.getElementById('teamBScore').innerText =
            `${match.teams.B.score}/${match.teams.B.wickets}`;

        renderPlayerTable('A');
        renderPlayerTable('B');
    }

    modal.style.display = 'none';
    document.getElementById('nbForm').reset();
});

document.getElementById('wForm').addEventListener('submit', function (e) {
    e.preventDefault();

    console.log("W submit triggered"); // debug
    console.log("W SUBMIT");

    const modal = document.getElementById('wModal');
    const teamKey = modal.dataset.teamKey;

    const newBatsman = document.getElementById('wNewBatsman').value.trim();

    let team = match.teams[teamKey];
    let currentOver = team.overs[team.overs.length - 1];

    // ✅ Add ball
    team.balls++;

    // ✅ Wicket
    team.wickets++;

    // ✅ Bowler gets wicket
    if (team.bowlers && team.bowlers[team.bowler]) {
        team.bowlers[team.bowler].balls += 1;
        team.bowlers[team.bowler].wickets += 1;
    }

    // Add ball to striker
    team.players[team.striker].balls += 1;

    // 🧾 History
    currentOver.balls.push('W');

    // 🔄 Replace striker (normal wicket)
    team.striker = newBatsman;

    // if (!team.players[newBatsman]) {
    //   team.players[newBatsman] = { runs: 0, balls: 0 };
    // }

    if (!team.players[newBatsman]) {
        team.players[newBatsman] = {
            runs: 0,
            balls: 0,
            ones: 0,
            twos: 0,
            fours: 0,
            sixes: 0
        };
    }

    // UI update
    document.querySelector(`#team${teamKey}Score`).innerText =
        `${team.score}/${team.wickets}`;

    document.querySelector(`#team${teamKey}Overs`).innerText =
        `${Math.floor(team.balls / 6)}.${team.balls % 6}`;

    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const lastOverCard = overCardsDiv.lastElementChild;

    lastOverCard.querySelector('.ball-history').innerText =
        'Balls: ' + currentOver.balls.join(' ');

    renderPlayerTable(teamKey);
    updateOverCardNames(team);

    // Over complete check
    if (team.balls % 6 === 0) {
        swapStrike(team);
        disableOverButtons(teamKey);

        const switched = checkInningsEnd(teamKey);
        if (!switched) {
            document.getElementById('bowlerPopup').style.display = 'flex';
        }
    }

    if (match.currentTeam === 'B') {
        updateChaseInfo();
    }

    checkMatchWinner();

    modal.style.display = 'none';
    this.reset();
});

document.getElementById('wCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('wModal');

    if (match.lastState) {
        match = JSON.parse(match.lastState);

        document.getElementById('teamAScore').innerText =
            `${match.teams.A.score}/${match.teams.A.wickets}`;
        document.getElementById('teamAOvers').innerText =
            `${Math.floor(match.teams.A.balls / 6)}.${match.teams.A.balls % 6}`;

        document.getElementById('teamBScore').innerText =
            `${match.teams.B.score}/${match.teams.B.wickets}`;
        document.getElementById('teamBOvers').innerText =
            `${Math.floor(match.teams.B.balls / 6)}.${match.teams.B.balls % 6}`;

        renderPlayerTable('A');
        renderPlayerTable('B');
        // renderBowlerTable('A');
        // renderBowlerTable('B');
    }

    modal.style.display = 'none';
    document.getElementById('wForm').reset();
});
