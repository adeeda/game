const version = '0.0.3';

//start by loading save
let gameVars = localStorage.getItem('gameVars');
if(gameVars) {
	gameVars = JSON.parse(gameVars);
} else {
	gameVars = {
		title: 'Game',
		fps: 12,
		saveInterval: 30, //seconds
		speedrun: true, //speeds up certain things if you know what you're doing
		version: version,
	}
}

header.textContent = pageTitle.textContent = gameVars.title;
updateText(vNumber,`v ${version}`);

createFooter();
let tooltip=createTooltip();

let tabs = {};
let sections = {};
let buttons = {}; //Special-purpose buttons
let resources = {};
let buildings = {};
let science = {};
let scienceResearched = {}; //Used for saving
let jobs = {};
let names = [];
let surnames = [];
let gameInterval;	//declared here so we can change the framerate in the options menu
let saveInterval;	//with clearTimeout()

initialize();

function gameLoop() {
	
	let currentTime = Date.now();
		
	//switch based on era
	switch (gameVars.era) {
		case 0: //the era of darkness
			switch (gameVars.progress) {
				case 0: //finding food
					if(resources.food.amount > 0) {
						logMessage('You find something edible and immediately start consuming it.');
						updateText(resHeader,'Things');
						resources.food.drain += 0.3;
						gameVars.progress++;
					}
					break;
				case 1: //lighting a fire
					if(resources.food.amount > 5) {
						logMessage('You think you can spare some time looking for something to burn.');
						gameVars.progress++;
						buttons.collectTinder.show();
						buttons.lightFire.show();
					}
					break;
				case 3: //building a shelter
					if(resources.earth.amount > 2) {
						logMessage('You can build a simple shelter if you gather more things.');
						gameVars.progress+=2;
					}
					break;
					
				case 5:
					if(buildings.house.number > 0) {
						gameVars.progress++;
						logMessage('The fire crackles in the comfort of your new structure. It slowly burns through your tinder.');
						updateText(tabs.main.tab,'a shelter');
						buttons.lightFire.hide();
						resources.wood.addSink(0.1, 1, 'fire', true)
						var visitor = setInterval( () => {
							if(resources.wood.amount < 5 || resources.food.amount < 10) {
								let txt = 'You hear a rustling nearby. When you look, nothing is there.';
								if(resources.wood.amount < 5) {txt += ' Your tinder is getting low.';};
								if(resources.food.amount < 10) {txt += ' You need more food.';}
								gameVars.speedrun = false;
								logMessage(txt);
							} else {
								logMessage('A haggard stranger approaches warily. You motion them inside.');
								gameVars.progress++;
								resources.population.add(1);
								clearInterval(visitor);
							}
						},1000*((gameVars.speedrun) ? 25 : 50));
					}
					break;
					
				case 7: //finding time to think
					var thought = setInterval( () => {
						if(resources.wood.amount < 5 || resources.food.amount < 10) {
							let txt = 'Your new friend is still looking a little pale.';
							if(resources.wood.amount < 5) {txt += ' Your tinder is getting low.';};
							if(resources.food.amount < 10) {txt += ' You need more food.';}
							logMessage(txt);
							gameVars.speedrun = false;
						} else {
							clearInterval(thought);
							gameVars.progress++;
							logMessage('Your friend looks better, and offers help. You find a moment to rest, and. . . ? ? ? ?');
							gameVars.people[0].assignJob('gatherer');
							updateText(tabs.science.tab,'? ? ? ?');
							tabs.science.unlock();
						}
					},1000*((gameVars.speedrun) ? 25 : 50));
					gameVars.progress++;
					break;
					
				case 9:
					if (science.thought.researched) {
						updateText(tabs.science.tab,'Ideas');
						updateText(tabs.main.tab,'Home');
						resources.science.add(1);
						resources.science.income += 0.2;
						resources.population.income = 0.015;
						gameVars.progress++;
					}
					//don't break here!
				case 10:
					if (science['division of labor'].researched) {
						updateText(tabs.government.tab,'People');
						tabs.government.unlock();
						gameVars.progress++;
					} else if (science['knapping'].researched && jobs.hunter.count < 1) {
						//Helps bring the food income up earlier, and makes more sense maybe?
						gameVars.people[0].assignJob('hunter');
					}
					
					break;
				case 11:
					if (gameVars.popCount >= 5) {
						//we don't need those buttons any more
						for( const name in buttons ) {
							buttons[name].hide();
						}
						logMessage('You grow weary of menial tasks.');
						gameVars.era++;
					}
					break;
			}
			break;
		case 1: //the era of science (and the normal game flow)
			
			if(resources.food.amount <= 0) {
				resources.population.drain = 0.03;
				resources.population.income = 0;
			} else {
				resources.population.drain = 0;
				resources.population.income = 0.015;
			}
			
			if(gameVars.popCount <= 0) {
				logMessage('GAME OVER');//TODO: Game Over
			}
	}
	
	checkFlags();
	
	let timePassed =  Math.max(0,Math.min((currentTime-gameVars.lastTick)/1000,24*60*60)); //allows a maximum of 1 day to pass
	
	let remainingTime = timePassed;
	while(remainingTime > 0) {
		let lowestBreakpoint = Math.min(updatePopulation(),remainingTime); //calls updatePopulation to get a breakpoint *and* update the population.
		for ( const name in resources ) {
			const thisBreakpoint = resources[name].getNextBreakpoint();
			if (thisBreakpoint < lowestBreakpoint) {lowestBreakpoint = thisBreakpoint;}
		}
		//TODO: also check the plan for breakpoints and include that here too
		
		for ( const name in resources ) {
			resources[name].tick(lowestBreakpoint);
		}
		for (let i=0; i<gameVars.popCount; i++) {
			gameVars.people[i].tick(lowestBreakpoint);
		}
		//TODO: also tick the plan
		
		remainingTime -= lowestBreakpoint;
	}
	
	//update display
	for(const name in resources) {
		resources[name].update();
	}
	for(const name in buildings) {
		buildings[name].update();
	}
	for(const name in science) {
		science[name].update();
	}
	for(const name in jobs) {
		jobs[name].update();
	}
	updateText(idleDisp,`Idle: ${displayNumber(gameVars.idle,'discrete')}`);
	
	if(tooltip.active) {updateTooltip();}
	
	if(science.time.researched) {
		gameVars.days += timePassed/simSpeed;
		if(science.calendar.researched) {
			if(gameVars.days >= 365) {
				gameVars.years += Math.floor(gameVars.days/365);
				gameVars.days %= 365;
			}
			updateText(logHeader,`Year ${displayNumber(gameVars.years+1,'discrete')} Day ${displayNumber(gameVars.days+1,'discrete')}`);
		} else {
			updateText(logHeader,`Day ${displayNumber(gameVars.days+1,'discrete')}`);
		}
	}
	
	//Planning drag and drop: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
	
	//I think it's possible to import and export saves by just going through every localStorage item with localStorage.length and localStorage.key()
	//could even put them in an object and JSON it?
	//Do I need to sanitize and/or escape it?
	
	gameVars.lastTick = currentTime;
	gameInterval = setTimeout(gameLoop,1000/gameVars.fps);
}

