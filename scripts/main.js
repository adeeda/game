const version = '0.0.1';

//start by loading save
let gameVars = localStorage.getItem('gameVars');
if(gameVars) {
	gameVars = JSON.parse(gameVars);
} else {
	gameVars = {
		title: 'Game Title',
		fps: 12,
		saveInterval: 30, //seconds
		speedrun: true, //speeds up certain things if you know what you're doing
		version: version
	}
}

header.textContent = pageTitle.textContent = gameVars.title;
updateText(vNumber,`v ${version}`);
const resHeader = document.createElement('h2');
leftPane.append(resHeader);

createFooter();

let tabs = {};
let panes = {}; //Subscreens of tabs
let buttons = {}; //Special-purpose buttons
let resources = {};
let buildings = {};
let science = {};
let scienceResearched = {}; //Used for saving
let jobs = {};
let gameInterval;	//declared here so we can change the framerate in the options menu
let saveTimeout;	//with clearInterval()

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
						resources.wood.drain += 0.1;
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
							jobs.gatherer.increase(1);
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
						resources.science.income = 0.1;
						resources.population.income = 0.01;
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
						jobs.gatherer.decrease(1);
						jobs.hunter.increase(1);
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
		case 1: //the era of science (and the normal game flow)
			//TODO: make a flag function/class?
			//usable here and on load
			//state changes, onRaise action
			//and just needs to interface with gameVars.flags and it'll auto-save!
			
			//TODO: check for starvation
	}
	
	let timePassed =  Math.max(0,Math.min((currentTime-gameVars.lastTick)/1000,24*60*60)); //allows a maximum of 1 day to pass
	//console.log(`timepassed: ${timePassed}`);
	
	let remainingTime = timePassed;
	while(remainingTime > 0) {
		let lowestBreakpoint = Math.min(updatePopulation(),remainingTime);
		for ( const name in resources ) {
			const thisBreakpoint = resources[name].getNextBreakpoint();
			//console.log(`${name}: ${thisBreakpoint}`);
			if (thisBreakpoint < lowestBreakpoint) {lowestBreakpoint = thisBreakpoint;}
		}
		//TODO: also check the plan for breakpoints and include that here too
		
		for ( const name in resources ) {
			resources[name].tick(lowestBreakpoint);
		}
		//TODO: also tick the plan
		
		//console.log(`lowestBreakpoint: ${lowestBreakpoint}`);
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
	updateText(idleDisp,`Idle: ${gameVars.jobs.idle}`);
	
	//Planning drag and drop: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
	
	//I think it's possible to import and export saves by just going through every localStorage item with localStorage.length and localStorage.key()
	//could even put them in an object and JSON it?
	//Do I need to sanitize and/or escape it?
	gameVars.lastTick = currentTime;//-remainingTime*1000;
}

function updatePopulation () { //returns time until next breakpoint
	let nextBreakpoint = Infinity;
	let newPop = resources.population.amount - gameVars.popCount;
	if(newPop > 0) {
		nextBreakpoint = (Math.floor(resources.population.amount) + 1 - resources.population.amount) / resources.population.rps;
		if(newPop >= 1) {
			//console.log(`population added: ${newPop}`);
			addPop = Math.floor(newPop);
			gameVars.popCount += addPop;
			//gameVars.people.push('Person'); //TODO: people module
			//Give people random names and statistics, and store their age and mastery.
			resources.food.addSink(0.3,addPop,'pop',true);
			if(science.thought.researched) {
				jobs.gatherer.increase(addPop,true);
				//TODO: give the person the job
				//then the people module can update the job count
			} else {
				gameVars.jobs.idle += addPop;
			}
			
			switch (gameVars.popCount) {
				case 2:
					logMessage('Another stranger arrives wanting warmth.');
					break;
				case 3:
					logMessage('Another stranger approaches seeking sustenance.');
					break;
				case 4:
					logMessage('Another stranger appears craving companionship.');
					break;
			}
			
		}
	}
	return nextBreakpoint;
}