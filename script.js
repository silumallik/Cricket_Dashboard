let undoUsed = false;

let match = {
    overs: 0,
    totalOvers: 0,
    teams: {
        A: { score: 0, wickets: 0, balls: 0, overs: [], players: {}, striker: '', nonStriker: '', bowler: '', bowlers: {}, },
        B: { score: 0, wickets: 0, balls: 0, overs: [], players: {}, striker: '', nonStriker: '', bowler: '', bowlers: {}, }
    },
    currentTeam: 'A',
    startTime: null,
    endTime: null
};

let lastState = null;

const teamForm = document.getElementById('teamForm');
const playerForm = document.getElementById('playerForm');

const bowlerForm = document.getElementById('bowlerForm');


const menuBtn = document.getElementById('menuBtn');
const popup = document.getElementById('menuPopup');
const closeBtn = document.getElementById('closePopup');

// Open popup
menuBtn.addEventListener('click', () => {
    popup.style.display = 'flex';
});

// Close popup
closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

// Optional: click outside to close
popup.addEventListener('click', (e) => {
    if (e.target === popup) {
        popup.style.display = 'none';
    }
});


bowlerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const team = match.teams[match.currentTeam];
    const bowlerName = document.getElementById('nextBowler').value;

    // Set bowler for new over
    team.bowler = bowlerName;

    // Initialize bowler stats if not exists
    if (!team.bowlers[bowlerName]) {
        team.bowlers[bowlerName] = {
            balls: 0,
            dots: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            wides: 0,
            runs: 0
        };
    }

    // Create new over card
    renderOverCard(match.currentTeam);

    // Hide popup
    document.getElementById('bowlerPopup').style.display = 'none';
});

document.getElementById('bowlerCloseBtn').addEventListener('click', () => {
    const teamKey = match.currentTeam;
    if (teamKey && lastState) {
        undo(teamKey);
    }
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

    if (team.players[striker]) {
        alert('Striker name already exists. Please choose a different name.');
        return;
    }
    if (team.players[nonStriker]) {
        alert('Non-striker name already exists. Please choose a different name.');
        return;
    }

    team.bowler = bowler;
    team.striker = striker;
    team.nonStriker = nonStriker;

    // Initialize bowler stats
    if (!team.bowlers[bowler]) {
        team.bowlers[bowler] = {
            balls: 0,
            dots: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            wides: 0,
            runs: 0
        };
    }

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
                sixes: 0,
                isOut: false
            };
        }
    });


    // Create first over for new innings
    renderOverCard(match.currentTeam);

    // Hide the form until next over
    playerForm.style.display = 'none';

    updateTopNav();

    match.startTime = new Date();

    updateStartTimeUI();
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
        lastState = JSON.stringify(match);
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

        updateBowlerStats(team, 'WD');

        // UI update
        document.querySelector(`#team${teamKey}Score`).innerText = `${team.score}/${team.wickets}`;
        updateBallHistory(teamKey);

        // Chase update
        if (match.currentTeam === 'B') {
            updateChaseInfo();
        }
        updateTopNav();
        renderBowlerTable(teamKey);
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

        updateBowlerStats(team, val);

        // Strike change for odd runs
        if (val % 2 !== 0) {
            swapStrike(team);
        }
    }

    team.balls++;
    document.querySelector(`#team${teamKey}Score`).innerText = `${team.score}/${team.wickets}`;
    document.querySelector(`#team${teamKey}Overs`).innerText = `${Math.floor(team.balls / 6)}.${team.balls % 6}`;
    updateBallHistory(teamKey);

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

    renderBowlerTable(teamKey);
    undoUsed = false;
    updateTopNav();
}

function undo(teamKey) {
    if (undoUsed || !lastState) return;

    // Restore previous state
    match = JSON.parse(lastState);

    // Allow future ball clicks to save state again
    undoUsed = false;
    lastState = null;

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

    renderBowlerTable('A');
    renderBowlerTable('B');

    // Re-enable buttons for the current over after undo
    enableOverButtons(teamKey);

    // ✅ Ball history clean update
    refreshBallHistory('A');
    refreshBallHistory('B');
    updateTopNav();
}

function enableOverButtons(teamKey) {
    const overCardsDiv = document.getElementById(teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards');
    const lastOverCard = overCardsDiv.lastElementChild;
    if (!lastOverCard) return;
    lastOverCard.querySelectorAll('button').forEach(btn => btn.disabled = false);
}


function updateBowlerStats(team, val) {
    if (!team.bowler || !team.bowlers[team.bowler]) return;

    const bowler = team.bowlers[team.bowler];

    if (val === 'WD') {
        bowler.wides++;
        bowler.runs += 1;
    } else if (val === 'W') {
        bowler.wickets++;
        bowler.balls++;
    } else if (typeof val === 'number') {
        bowler.balls++;
        if (val === 0) bowler.dots++;
        if (val === 4) bowler.fours++;
        if (val === 6) bowler.sixes++;
        bowler.runs += val;
    }
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
    // strikerSpan.innerText = team.striker;
    strikerSpan.innerText = `🏏 ${team.striker}`;
    nonStrikerSpan.innerText = team.nonStriker;

    // Highlight
    // strikerSpan.style.backgroundColor = '#d1ffd1'; // light green
    // nonStrikerSpan.style.backgroundColor = '#ffe0b3'; // light orange

}

// Function to render ball history with colored badges
function updateBallHistory(teamKey) {
    const team = match.teams[teamKey];
    const overCardsDiv = document.getElementById(
        teamKey === 'A' ? 'teamAOverCards' : 'teamBOverCards'
    );

    const lastOverCard = overCardsDiv.lastElementChild;
    if (!lastOverCard) return;

    const currentOver = team.overs[team.overs.length - 1];
    const ballHistoryDiv = lastOverCard.querySelector('.ball-history');

    // Create HTML for each ball with colored badges
    let html = '<span style="font-weight: bold;">Balls:</span>';
    
    currentOver.balls.forEach((ball, index) => {
        let className = 'ball-0';
        let displayBall = String(ball);
        const ballStr = String(ball);

        if (ballStr === '0') className = 'ball-0';
        else if (ballStr === '1') className = 'ball-1';
        else if (ballStr === '2') className = 'ball-2';
        else if (ballStr === '3') className = 'ball-3';
        else if (ballStr === '4') className = 'ball-4';
        else if (ballStr === '6') className = 'ball-6';
        else if (ballStr === 'W') className = 'ball-W';
        else if (ballStr === 'WD') className = 'ball-WD'; 
        else if (ballStr === 'NB') className = 'ball-NB';
        else if (ballStr.startsWith('RO')) className = 'ball-RO';
        else if (ballStr.startsWith('1RO')) { className = 'ball-RO'; displayBall = '1RO'; }
        else if (ballStr.startsWith('NB+')) className = 'ball-NB';

        // Add latest-ball class to the last ball
        if (index === currentOver.balls.length - 1) {
            className += ' latest-ball';
        }

        html += `<span class="ball-badge ${className}" title="${displayBall}">${displayBall}</span>`;
    });

    ballHistoryDiv.innerHTML = html;
}

function renderPlayerTable(teamKey) {
    let tbody = document.querySelector(`#team${teamKey}Players tbody`);
    tbody.innerHTML = '';
    let team = match.teams[teamKey];

    // Find the highest scorer
    let maxRuns = 0;
    for (let player in team.players) {
        if (team.players[player].runs > maxRuns) {
            maxRuns = team.players[player].runs;
        }
    }

    for (let player in team.players) {
        let p = team.players[player];
        let sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : 0;

        // Determine styles
        let styles = [];
        if (p.isOut) {
            styles.push('background-color: red; color: white;');
        } else if (p.runs === maxRuns && maxRuns > 0) {
            styles.push('background-color: gold; font-weight: bold; color: white;');
        }
        if (player === team.striker) {
            styles.push('font-weight: bold; background-color: pink;');
        }
        let styleStr = styles.join(' ');

        tbody.innerHTML += `
        <tr style="${styleStr}">
          <td>${player === team.striker ? '🏏 ' + player : player}</td>
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

    // if (strikerSpan) strikerSpan.style.backgroundColor = '#d1ffd1'; // Light green for striker
    // if (nonStrikerSpan) nonStrikerSpan.style.backgroundColor = '#ffe0b3'; // Light orange for non-striker
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
        endMatch(teamB.name + " won the match!");

    } else {
        const oversCompleted = Math.floor(teamB.balls / 6) >= match.totalOvers;
        const allOut = teamB.wickets >= 10;
        if (oversCompleted || allOut) {
            // Team A wins
            winnerBoard = document.getElementById('teamABoard');
            text = `Winner! Score: ${teamA.score} - ${teamB.score}`;
            endMatch(teamB.name + " won the match!");
        }
    }

    if (winnerBoard) {

        updateTopNav();

        const div = document.createElement('div');
        div.classList.add('winner-text');
        div.style.color = 'darkgreen';
        div.style.fontSize = '18px';
        div.style.fontWeight = 'bold';
        div.style.margin = '5px 0';
        // div.innerText = text;

        div.innerText = `🏆 ${text} 🎉`;

        winnerBoard.prepend(div); // Show above board content

        // Update bowler tables with final stats
        renderBowlerTable('A');
        renderBowlerTable('B');

        // ✅ Disable all over buttons for both teams
        const teamKeys = ['A', 'B'];
        teamKeys.forEach(k => {
            const overCardsDiv = document.getElementById(k === 'A' ? 'teamAOverCards' : 'teamBOverCards');
            overCardsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);
        });

        match.currentTeam = null; // stop the match

        setTimeout(() => {
            showMatchSummary();
        }, 500);

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

function updateTopNav() {
    let teamA = match.teams.A;
    let teamB = match.teams.B;

    // Team A
    document.getElementById('teamATopScore').innerText =
        `${teamA.score}/${teamA.wickets}`;

    document.getElementById('teamATopOvers').innerText =
        `${Math.floor(teamA.balls / 6)}.${teamA.balls % 6}`;

    document.getElementById('teamATotalOvers').innerText =
        match.totalOvers;

    // Team B
    document.getElementById('teamBTopScore').innerText =
        `${teamB.score}/${teamB.wickets}`;

    document.getElementById('teamBTopOvers').innerText =
        `${Math.floor(teamB.balls / 6)}.${teamB.balls % 6}`;

    document.getElementById('teamBTotalOvers').innerText =
        match.totalOvers;

    highlightBattingTeam();
}

function highlightBattingTeam() {
    let teamABox = document.getElementById('teamATop');
    let teamBBox = document.getElementById('teamBTop');

    // reset
    teamABox.classList.remove('active-batting', 'inactive-team');
    teamBBox.classList.remove('active-batting', 'inactive-team');

    if (match.currentTeam === 'A') {
        teamABox.classList.add('active-batting');
        teamBBox.classList.add('inactive-team');
    } else {
        teamBBox.classList.add('active-batting');
        teamABox.classList.add('inactive-team');
    }
}

function showMatchSummary() {
    let teamA = match.teams.A;
    let teamB = match.teams.B;

    // Score
    let teamAScore = `${teamA.score}/${teamA.wickets} (${Math.floor(teamA.balls / 6)}.${teamA.balls % 6})`;
    let teamBScore = `${teamB.score}/${teamB.wickets} (${Math.floor(teamB.balls / 6)}.${teamB.balls % 6})`;

    document.getElementById('teamASummary').innerText = `Team A - ${teamAScore}`;
    document.getElementById('teamBSummary').innerText = `Team B - ${teamBScore}`;

    // 🏆 Result
    let result = '';
    if (teamA.score > teamB.score) {
        result = `Team A : ${teamA.name} won by ${teamA.score - teamB.score} runs`;
    } else if (teamB.score > teamA.score) {
        // result = `Team B won by ${10 - teamB.wickets} wickets`;
        result = `Team B : ${teamB.name} won by ${teamB.score - teamA.score} runs`;
    } else {
        result = 'Match Draw';
    }

    document.getElementById('matchResult').innerText = result;

    // 🔥 Top Batsman
    let topPlayer = '';
    let maxRuns = 0;

    ['A', 'B'].forEach(t => {
        let players = match.teams[t].players;
        for (let name in players) {
            if (players[name].runs > maxRuns) {
                maxRuns = players[name].runs;
                let p = players[name];
                let sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : 0;
                topPlayer = `${name} - ${p.runs} (${p.balls}) | SR: ${sr}`;
            }
        }
    });

    document.getElementById('topBatsman').innerText = topPlayer || 'N/A';

    // 📊 Stats
    let total4s = 0;
    let total6s = 0;

    ['A', 'B'].forEach(t => {
        let players = match.teams[t].players;
        for (let p in players) {
            total4s += players[p].fours || 0;
            total6s += players[p].sixes || 0;
        }
    });

    document.getElementById('matchStats').innerText =
        `4s: ${total4s} | 6s: ${total6s}`;

    // show modal
    document.getElementById('matchSummaryModal').style.display = 'block';
}

function closeSummary() {
    document.getElementById('matchSummaryModal').style.display = 'none';
}

function updateStartTimeUI() {
    if (match.startTime) {
        const time = match.startTime.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        document.getElementById('startTime').innerText = time;
    }
}

function updateEndTimeUI() {
    if (match.endTime) {
        const time = match.endTime.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        document.getElementById('endTime').innerText = time;
    }
}

function renderBowlerTable(teamKey) {
    let team = match.teams[teamKey];
    let tbody = document.querySelector(`#team${teamKey}Bowlers tbody`);
    tbody.innerHTML = '';

    let bowlersArray = Object.keys(team.bowlers).map(name => ({ name, ...team.bowlers[name] }));
    bowlersArray.sort((a, b) => b.wickets - a.wickets);

    bowlersArray.forEach((b, index) => {
        let bgColor = '';
        if (index === 0 && b.wickets > 0) bgColor = 'gold';
        else if (index === 1 && b.wickets > 0) bgColor = '#C0C0C0'; // silver
        else if (index === 2 && b.wickets > 0) bgColor = '#CD7F32'; // bronze
        let style = bgColor ? `background-color: ${bgColor};` : '';

        tbody.innerHTML += `
      <tr style="${style}">
        <td>${b.name}</td>
        <td>${b.balls}</td>
        <td>${b.dots}</td>
        <td>${b.fours}</td>
        <td>${b.sixes}</td>
        <td>${b.wickets}</td>
        <td>${b.runs}</td>
        <td>${b.wides}</td>
      </tr>
    `;
    });
}

function refreshBallHistory(teamKey) {
    let team = match.teams[teamKey];
    if (team.overs.length === 0) return;

    updateBallHistory(teamKey);
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

    if (newBatsman && team.players[newBatsman]) {
        alert('Player with this name already exists. Please choose a different name.');
        return;
    }
    let currentOver = team.overs[team.overs.length - 1];

    // 🧠 Determine who is out
    let outName = outPlayer === 'striker' ? team.striker : team.nonStriker;

    // Mark player as out
    team.players[outName].isOut = true;

    // Add runs (if any)
    if (runs > 0) {
        team.score += runs;

        // Update bowler runs
        if (team.bowlers && team.bowlers[team.bowler]) {
            team.bowlers[team.bowler].runs += runs;
        }
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

    // Update bowler stats
    if (team.bowlers && team.bowlers[team.bowler]) {
        team.bowlers[team.bowler].balls += 1;
        team.bowlers[team.bowler].wickets += 1;
    }

    updateTopNav();

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
            sixes: 0,
            isOut: false
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
    updateBallHistory(teamKey);

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
    renderBowlerTable(teamKey);
});

document.getElementById('roCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('roModal');

    // 🔥 Restore previous state (UNDO)
    if (lastState) {
        match = JSON.parse(lastState);

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

        renderBowlerTable('A');
        renderBowlerTable('B');
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

    // Update bowler runs
    if (team.bowlers && team.bowlers[team.bowler]) {
        team.bowlers[team.bowler].runs += 1 + runs;
    }

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

        if (newBatsman && team.players[newBatsman]) {
            alert('Player with this name already exists. Please choose a different name.');
            return;
        }

        // Update bowler stats
        if (team.bowlers && team.bowlers[team.bowler]) {
            team.bowlers[team.bowler].wickets += 1;
        }

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

    // Update ball history UI
    updateBallHistory(teamKey);

    renderPlayerTable(teamKey);
    updateOverCardNames(team);

    if (match.currentTeam === 'B') {
        updateChaseInfo();
    }

    checkMatchWinner();

    updateTopNav();

    modal.style.display = 'none';
    this.reset();
    renderBowlerTable(teamKey);
});

document.getElementById('nbCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('nbModal');

    if (lastState) {
        match = JSON.parse(lastState);

        document.getElementById('teamAScore').innerText =
            `${match.teams.A.score}/${match.teams.A.wickets}`;
        document.getElementById('teamBScore').innerText =
            `${match.teams.B.score}/${match.teams.B.wickets}`;

        renderPlayerTable('A');
        renderPlayerTable('B');

        renderBowlerTable('A');
        renderBowlerTable('B');
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

    if (newBatsman && team.players[newBatsman]) {
        alert('Player with this name already exists. Please choose a different name.');
        return;
    }
    let currentOver = team.overs[team.overs.length - 1];

    // ✅ Add ball
    team.balls++;

    // ✅ Wicket
    team.wickets++;

    updateTopNav();

    // ✅ Bowler gets wicket
    if (team.bowlers && team.bowlers[team.bowler]) {
        team.bowlers[team.bowler].balls += 1;
        team.bowlers[team.bowler].wickets += 1;
    }

    // Add ball to striker
    team.players[team.striker].balls += 1;

    // Mark striker as out
    team.players[team.striker].isOut = true;

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
            sixes: 0,
            isOut: false
        };
    }

    // UI update
    document.querySelector(`#team${teamKey}Score`).innerText =
        `${team.score}/${team.wickets}`;

    document.querySelector(`#team${teamKey}Overs`).innerText =
        `${Math.floor(team.balls / 6)}.${team.balls % 6}`;

    // Update ball history UI
    updateBallHistory(teamKey);

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
    renderBowlerTable(teamKey);
});

document.getElementById('wCloseBtn').addEventListener('click', function () {
    const modal = document.getElementById('wModal');

    if (lastState) {
        match = JSON.parse(lastState);

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
        renderBowlerTable('A');
        renderBowlerTable('B');
    }

    modal.style.display = 'none';
    document.getElementById('wForm').reset();
});

function downloadImage() {
    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'scoreboard.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(document.body);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Multi-page support
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save('match-summary.pdf');
}

function endMatch(message) {
    alert(message);

    showMatchSummary();

    // ✅ Save end time
    // match.endTime = new Date();

    // updateEndTimeUI();

    document.getElementById('downloadBtn').style.display = 'block';
    document.getElementById('screanshotBtn').style.display = 'block';

    setTimeout(() => {
        document.getElementById('matchTargetNav').style.display = 'none';
        var topnav = document.getElementById('topNav')
        topnav.style.position = 'relative';
        topnav.style.top = '0';
    }, 5000);

    match.endTime = new Date();

    updateEndTimeUI();

}
