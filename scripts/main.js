//start by loading save
let gameVars = localStorage.getItem('gameVars');
if(gameVars) {
	gameVars = JSON.parse(gameVars);
} else {
	gameVars = {
		title: 'Game Title',
		fps: 12,
		era: 0,
		saveInterval: 30, //seconds
		speedrun: true //speeds up certain things if you know what you're doing
	}
}

header.textContent = pageTitle.textContent = gameVars.title;
const resHeader = document.createElement('h2');
leftPane.append(resHeader);

createFooter();

let tabs = {};
let resources = {};
let science = {};
let scienceResearched = {};
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
						resources.food.rps -= 0.3;
						gameVars.progress++;
					}
					break;
				case 1: //lighting a fire
					if(resources.food.amount > 5) {
						logMessage('You think you can spare some time looking for something to burn.');
						gameVars.progress++;
						const collectTinder = new Button('tinder', 'Collect tinder', tabs.main.pane, () => {
							if(resources.food.consume(0.3)) {
								resources.wood.add();
							} else {
								logMessage('You are too hungry to find tinder right now.');
							}
						});
						let fireExists = false;
						let fireButton = false;
						const lightFire = new Button('fire','Light fire',tabs.main.pane, () => {
							if(fireExists) {
								//logMessage('You already have a fire.');
							} else {
								if(resources.wood.amount > 5) {
									if(resources.food.amount > 2) {
										resources.wood.consume(5);
										resources.food.consume(2);
										logMessage('You light a warm fire, as your parents showed you. It is vulnerable to the elements.');
										gameVars.progress++;
										updateText(tabs.main.tab,'a fire');
										fireExists = true;
										lightFire.btn.disabled = true;
										var fireTimeout = setTimeout(() => {
											clearTimeout(fireTimeout);
											if(gameVars.progress <= 5) {
												logMessage('The fire has gone out.');
												gameVars.progress--;
												updateText(tabs.main.tab,'wilderness');
												gameVars.speedrun = false;
												fireExists = false;
												lightFire.btn.disabled = false;
											}
										}, 1000*30);
										if(!fireButton) {
											const digFoundation = new Button ('dig','Dig a foundation',tabs.main.pane, () => {
												if(resources.food.amount > 3) {
													if(fireExists) {
														resources.food.consume(0.3);
														resources.earth.add();
													} else {
														logMessage('You are too cold to dig right now.');
													}
												} else {
													logMessage('You are too hungry to dig right now.');
												}
											});
											fireButton = true;
										}
									} else {
										logMessage('You are too hungry to light a fire right now.');
									}
								} else {
									resources.wood.amount = 0;
									logMessage('You try to light a fire, but all the pieces burn away too quickly.');
									gameVars.speedrun = false;
								}
							}
						});
					}
					break;
				case 3: //building a shelter
					if(resources.earth.amount > 15) {
						logMessage('You can build a simple shelter if you gather more things.');
						gameVars.progress+=2;
						let shelterExists = false;
						const buildShelter = new Button ('shelter','Build a shelter',tabs.main.pane, () => {
							if(shelterExists) {
								//logMessage('You already have a shelter.');
							} else if(resources.food.amount < 5) {
								logMessage('You are too hungry to build a shelter.');
							} else if(gameVars.progress < 5) {
								logMessage('You are too cold to build a shelter.');
							} else if(resources.wood.amount < 15) {
								logMessage('You need more branches.');
							} else if(resources.earth.consume(25)) {
								resources.food.consume(3);
								resources.wood.consume(15);
								gameVars.progress++;
								logMessage('The fire crackles in the comfort of your new structure.');
								updateText(tabs.main.tab,'a shelter');
								shelterExists = true;
								buildShelter.btn.style.display = 'none';
								resources.wood.rps -= 0.1;
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
										resources.population.cap++;
										resources.population.add();
										resources.food.rps -= 0.3;
										clearInterval(visitor);
									}
								},1000*((gameVars.speedrun) ? 30 : 60));
							} else {
								logMessage('You need to dig more.');
							}
						});
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
							resources.food.rps += 0.3;
							updateText(tabs.science.tab,'? ? ? ?');
							tabs.science.unlock();
						}
					},1000*((gameVars.speedrun) ? 30 : 60));
					gameVars.progress++;
					break;
				case 9:
					if (science.thought.researched) {
						updateText(tabs.science.tab,'Ideas');
						updateText(tabs.main.tab,'Home');
						resources.science.add();
						resources.science.rps = 0.1;
						gameVars.era++;
						//saveTimeout = setTimeout(saveGame,gameVars.saveInterval*1000);
						//createNavBar();
						logMessage("(DevNote: This is the end of the prologue/tutorial! As I type, I am working on making sure it's working 100% before I move on. Let me know what you think!)");
					}
			}
		case 1: //the era of science (and the normal game flow)
			
			
	}
	
	let timePassed =  Math.max(0,Math.min((currentTime-gameVars.lastTick)/1000,24*60*60)); //allows a maximum of 1 day to pass
	
	//I can use an object to hold all the resources, and a for..in loop to go through them all. And I can reference any other resource by its name. Amazing!
	//Update: I have learned about maps but I am too lazy to switch at this point in time.
	
	//This is for long periods of time, and managing where all the resources are going. Big TODO.
	/*
	let lowestBreakpoint=Infinity;
	for ( const name in resources ) {
		const thisBreakpoint = resources[name].getNextBreakpoint();
		if (thisBreakpoint < lowestBreakpoint) {lowestBreakpoint = thisBreakpoint;}
	}
	//also check the plan and include that here too
	for ( const name in resources ) {
		resources[name].tick(lowestBreakpoint);
	}
	remainingTime -= lowestBreakpoint;
	*/
	
	//update display
	for(const name in resources) {
		resources[name].tick(timePassed); //temporary solution, TODO: move to section above.
		resources[name].update();
	}
	
	for(const name in science) {
		science[name].update();
	}
	
	//Planning drag and drop: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
	
	//I think it's possible to import and export saves by just going through every localStorage item with localStorage.length and localStorage.key()
	//could even put them in an object and JSON it?
	//probably need to sanitize and/or escape it?
	gameVars.lastTick = currentTime;
}

