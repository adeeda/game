function logMessage (message) {
	let thing = document.createElement('div');
	thing.setAttribute('class','log-message');
	updateText(thing,message);
	logPane.prepend(thing);
	return thing;
}

let optionsOpen = false;
function createNavBar() {
	const saveButton = document.createElement('a');
	updateText(saveButton,'save');
	saveButton.addEventListener('click', event => {
		saveGame();
		event.preventDefault();
	});
	
	const optionsButton = document.createElement('a');
	updateText(optionsButton,'options');
	optionsButton.addEventListener('click', event => {
		if(optionsOpen) {
			options.style.display = 'none';
			optionsOpen = false;
		} else {
			options.style.display = 'block';
			optionsOpen = true;
		}
		if(aboutOpen) {
			about.style.display = 'none';
			aboutOpen = false;
		}
		if(creditsOpen) {
			credits.style.display = 'none';
			creditsOpen = false;
		}
		event.preventDefault();
	});
	document.querySelector('#options > a.close').addEventListener('click', event => {
		options.style.display = 'none';
		optionsOpen = false;
		event.preventDefault();
	});
	
	//OPTIONS
	const fpsSelector = document.querySelector('[name="fps"]');
	fpsSelector.value = gameVars.fps;
	fpsSelector.addEventListener('change', () => {
		gameVars.fps = parseInt(fpsSelector.value,10);
	});
	const saveSelector = document.querySelector('[name="save"]');
	saveSelector.value = gameVars.saveInterval;
	saveSelector.addEventListener('change', () => {
		gameVars.saveInterval = parseInt(saveSelector.value,10);
	});
	
	const deleteSave = document.createElement('a');
	updateText(deleteSave,'Delete Save');
	deleteSave.addEventListener('click', event => {
		if(window.confirm('This will permanently completely reset your progress.')) {
			localStorage.clear();
			window.location.reload();
		}
		event.preventDefault();
	});
	
	navBar.prepend(saveButton,optionsButton,deleteSave);
	
}

let aboutOpen = false;
let creditsOpen = false;
function createFooter() {
	const aboutButton = document.createElement('a');
	updateText(aboutButton,'about');
	aboutButton.addEventListener('click', event => {
		if(aboutOpen) {
			about.style.display = 'none';
			aboutOpen = false;
		} else {
			about.style.display = 'block';
			aboutOpen = true;
		}
		event.preventDefault();
		if(optionsOpen) {
			options.style.display = 'none';
			optionsOpen = false;
		}
		if(creditsOpen) {
			credits.style.display = 'none';
			creditsOpen = false;
		}
	});
	document.querySelector('#about > .close').addEventListener('click', event => {
		about.style.display = 'none';
		aboutOpen = false;
		event.preventDefault();
	});
	
	
	const creditsButton = document.createElement('a');
	updateText(creditsButton,'credits');
	creditsButton.addEventListener('click', event => {
		if(creditsOpen) {
			credits.style.display = 'none';
			creditsOpen = false;
		} else {
			credits.style.display = 'block';
			creditsOpen = true;
		}
		
		event.preventDefault();
		if(optionsOpen) {
			options.style.display = 'none';
			optionsOpen = false;
		}
		if(aboutOpen) {
			about.style.display = 'none';
			aboutOpen = false;
		}
	});
	document.querySelector('#credits > .close').addEventListener('click', event => {
		credits.style.display = 'none';
		creditsOpen = false;
		event.preventDefault();
	});
	
	footer.prepend(aboutButton,creditsButton);
}

function initialize () {
	
	//Set up tabs
	tabs.main = new Tab ('main',true,true);
	tabs.main.pane.setAttribute('class','btn-grid');
	tabs.science = new Tab ('science');
	sections.newScience = new Section ('New',tabs.science.pane,true,true);
	sections.researched = new Section ('Researched',tabs.science.pane);
	tabs.government = new Tab ('government');
	sections.jobs = new Section ('Jobs',tabs.government.pane,true,true);
	sections.population = new Section ('Roster',tabs.government.pane);
	
	let allGreen = {};
	
	//FILE LOADING
	if(window.location.protocol === 'file:') {
		//we're testing locally
		fileInput = document.createElement('input');
		fileInput.setAttribute('type','file');
		fileInput.setAttribute('multiple','');
		logMessage("Hello! The following file input is for testing locally. You shouldn't see this, so let me know if you do. Thanks!");
		logMessage('Upload files:').append(fileInput);
		fileInput.addEventListener('input', () => {
			for (let i=0,l=fileInput.files.length; i<l; i++) {
				const reader = new FileReader();
				let file = fileInput.files[i];
				
				if(file.name === 'resources.tsv') {
					reader.addEventListener('load', () => {
						buildResources(reader.result.replaceAll('\r',''));
						finalInit();
					}, false);
					reader.readAsText(file);
					
				} else if(file.name === 'science.tsv') {
					reader.addEventListener('load', () => {
						buildScience(reader.result.replaceAll('\r',''));
						finalInit();
					}, false);
					reader.readAsText(file);
					
				} else if(file.name === 'buildings.tsv') {
					reader.addEventListener('load', () => {
						buildBuildings(reader.result.replaceAll('\r',''));
						finalInit();
					}, false);
					reader.readAsText(file);
					
				} else if(file.name === 'firstnames.csv') {
					reader.addEventListener('load', () => {
						buildNames(reader.result.replaceAll('\r',''));
					}, false);
					reader.readAsText(file);
					
				} else if(file.name === 'surnames.csv') {
					reader.addEventListener('load', () => {
						buildSurnames(reader.result.replaceAll('\r',''));
					}, false);
					reader.readAsText(file);
				}
			}
		});
		//TODO: Dev features?
	} else {
		//it's on the internet
		//try to find the resources file
		fetch('design/resources.tsv')
			.then(response => response.text())
			.then(text => {
				buildResources(text.replaceAll('\r',''));
				finalInit();
			});
		//try to find the science file
		fetch('design/science.tsv')
			.then(response => response.text())
			.then(text => {
				buildScience(text.replaceAll('\r',''));
				finalInit();
			});
		//try to find the buildings file
		fetch('design/buildings.tsv')
			.then(response => response.text())
			.then(text => {
				buildBuildings(text.replaceAll('\r',''));
				finalInit();
			});
		//try to find name files
		fetch('design/firstnames.csv')
			.then(response => response.text())
			.then(text => {
				buildNames(text.replaceAll('\r',''));
			});
		fetch('design/firstnames.csv')
			.then(response => response.text())
			.then(text => {
				buildSurnames(text.replaceAll('\r',''));
			});
	}
	
	function buildResources (tsv) {
		const attributes = tsv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split('\t');
			const name = attributes[i][0];
			if(name) {
				resources[name] = new Resource(...attributes[i]);
				resources[name].load();
			}
		}
		allGreen.resources = true;
	}
	
	function buildScience (tsv) {
		let saveString = localStorage.getItem('science');
		if (saveString) {scienceResearched = JSON.parse(saveString);}
		const attributes = tsv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split('\t');
			const name = attributes[i][0];
			if(name) {
				science[name] = new Science(...attributes[i]);
				if(scienceResearched[name]) {
					science[name].load();
				}
			}
		}
		allGreen.science = true;
	}
	
	function buildBuildings (tsv) {
		const attributes = tsv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split('\t');
			const name = attributes[i][0];
			if(name) {
				buildings[name] = new Building(...attributes[i]);
			}
		}
		allGreen.buildings = true;
	}
	
	function buildNames (csv) {
		const lines = csv.split('\n');
		for (let i=0,l=lines.length; i<l; i++) {
			names.push(lines[i].split(',')[0]);
		}
	}
	
	function buildSurnames (csv) {
		const lines = csv.split('\n');
		for (let i=0,l=lines.length; i<l; i++) {
			surnames.push(lines[i].split(',')[0]);
		}
	}
	
	function finalInit() {
		//If all things have been built, proceed, else do nothing.
		console.log(`Resources: ${allGreen.resources ? 'ok':'X'}; Science: ${allGreen.science ? 'ok':'X'}; Buildings: ${allGreen.buildings ? 'ok':'X'}`);
		if(allGreen.resources && allGreen.science && allGreen.buildings) {
		
			logPane.replaceChildren(); //clears any devlog things
			createJobs();
			
			if(!gameVars.era) {gameVars.era = 0;}
			//switch based on era
			switch (gameVars.era) {
				case 0: //prologue/tutorial setup
					createButtons();
					buttons.foodButton.show();
					if(!gameVars.progress) {
						gameVars.progress = 0;
						gameVars.popCount = 0;
					}
					if(gameVars.progress < 6) {
						logMessage('You are cold, hungry, and lonely.');
						updateText(tabs.main.tab,'wilderness');
						resources.food.amount = 0;
						gameVars.progress = 0;
					} else {
						resources.food.drain += 0.3;
						updateText(resHeader,'Things');
						buttons.collectTinder.show();
						if (gameVars.progress < 9) {
							logMessage('Your shelter is cold. You are hungry and lonely.');
							gameVars.progress = 4;
							resources.population.amount = 0;
							gameVars.popCount = 0;
							gameVars.people = [];
							gameVars.idle = 0;
							updateText(tabs.main.tab,'a shelter');
							resources.food.amount = 0;
							buttons.lightFire.show();
						} else if(gameVars.progress === 9) {
							logMessage('Your friend is waiting for you. You had something to do, but what was it . . . ? ? ? ?');
							updateText(tabs.science.tab,'? ? ? ?');
							tabs.science.unlock();
							buttons.digFoundation.show();
							resources.wood.addSink(0.1, 1, 'fire', true)
						} else {
							logMessage('Something tugs at your mind.');
							tabs.science.unlock();
							buttons.digFoundation.show();
							resources.wood.addSink(0.1, 1, 'fire', true)
							gameVars.progress = 9;
						}
					}
					break;
				case 1: //regular setup
					logMessage('Something tugs at your mind.');
					updateText(tabs.main.tab,'Home');
					updateText(tabs.science.tab,'Ideas');
					tabs.science.unlock();
					updateText(tabs.government.tab,'People');
					tabs.government.unlock();
					updateText(resHeader,science.language.researched ? 'Resources' : 'Things');
					resources.food.drain += 0.3;
					resources.science.income += 0.2;
					resources.wood.addSink(0.1, 1, 'fire', true)
					break;
			}
			
			createNavBar();
			saveInterval = setTimeout(saveGame,gameVars.saveInterval*1000);
			for(const name in buildings) {
				buildings[name].load();
			}
			if(gameVars.popCount > 0) {
				resources.food.addSink(0.3,gameVars.popCount,'population',true); //TODO: more things will depend on population?
			}
			for(let i=0; i<gameVars.popCount; i++) {
				gameVars.people[i] = Object.assign(new Person, gameVars.people[i]);
				//This makes each person an actual Person
				gameVars.people[i].load();
			}
			
			loadFlags();
			
			if(!gameVars.lastTick) {gameVars.lastTick = Date.now();}
			
			if(version !== gameVars.version) {
				logMessage(`The game has updated! Your save is from version ${gameVars.version}. If the game breaks, you may have to delete your save.`);
				gameVars.version = version;
			}
			
			gameLoop();
		}
	}
}

function createButtons () {
	buttons.foodButton = new Button('food','Gather food',tabs.main.pane,() => resources.food.add());
	tabs.main.pane.prepend(buttons.foodButton.btn);
	buttons.foodButton.btn.setAttribute('building','');
	
	buttons.collectTinder = new Button('tinder', 'Collect tinder', tabs.main.pane, () => {
		if(resources.food.consume(0.3)) {
			resources.wood.add();
		} else {
			logMessage('You are too hungry to find tinder right now.');
		}
	});
	buttons.foodButton.btn.after(buttons.collectTinder.btn);
	buttons.collectTinder.btn.setAttribute('building','');
	
	let fireExists = false;
	buttons.lightFire = new Button('fire','Light fire',tabs.main.pane, () => {
		if(!buttons.lightFire.disabled) {
			if(resources.wood.amount > 5) {
				if(resources.food.amount > 2) {
					resources.wood.consume(5);
					resources.food.consume(2);
					logMessage('You light a warm fire, as your parents showed you. It is vulnerable to the elements.');
					gameVars.progress++;
					updateText(tabs.main.tab,'a fire');
					fireExists = true;
					buttons.lightFire.disable();
					var fireTimeout = setTimeout(() => {
						clearTimeout(fireTimeout);
						if(gameVars.progress <= 5) {
							logMessage('The fire has gone out.');
							gameVars.progress--;
							updateText(tabs.main.tab,'wilderness');
							gameVars.speedrun = false;
							fireExists = false;
							buttons.lightFire.enable();
						}
					}, 1000*30);
					buttons.digFoundation.show();
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
	buttons.collectTinder.btn.after(buttons.lightFire.btn);
	buttons.lightFire.btn.setAttribute('building','');
	
	buttons.digFoundation = new Button ('dig','Dig a foundation',tabs.main.pane, () => {
		if(resources.food.amount > 3) {
			if(fireExists || gameVars.progress >= 9) {
				resources.food.consume(0.3);
				resources.earth.add();
			} else {
				logMessage('You are too cold to dig right now.');
			}
		} else {
			logMessage('You are too hungry to dig right now.');
		}
	});
	buttons.lightFire.btn.after(buttons.digFoundation.btn);
	buttons.digFoundation.btn.setAttribute('building','');
	
	for (const name in buttons) {
		buttons[name].hide();
	}
}

function checkFlags () {
	
}

function loadFlags () {
	if(science.cooking.researched) {resources.food.addMultiplier(1.6, 'cooking');}
	if(science.names.researched) {sections.population.unlock();}
}

function checkScienceFlags(sci) { //This function is run when a science is researched
	switch(sci) {
		case 'counting':
		case 'numbers':
			for (const name in jobs) {
				if(jobs[name].visible) {jobs[name].unlock();} //Updates the number
			}
			for (const name in buildings) {
				buildings[name].decrease(0); //Updates the text content.
			}
			break;
		case 'language':
			for (const name in buildings) {
				buildings[name].decrease(0); //Updates the text content.
			}
			updateText(resHeader,'Resources');
			break;
		case 'time':
			gameVars.days = 0;
			break;
		case 'cooking':
			resources.food.addMultiplier(1.6, 'cooking');
			break;
		case 'calendar':
			gameVars.years = 0;
			break;
		case 'names':
			sections.population.unlock();
			break;
	}
}

function createJobs () {
	if(!gameVars.idle) {gameVars.idle = 0;}
	
	updateText(idleDisp,`Idle: ${gameVars.idle}`);
	sections.jobs.pane.append(idleDisp);
	
	jobs.gatherer = new Job('gatherer',[0.3,'food',0.1,'wood'],'');
	jobs.hunter = new Job('hunter',[0.4,'food',0.001,'remains'],'knapping');
	jobs.digger = new Job('digger',[0.2,'earth',0.002,'rare earth'],'');
	jobs.woodcutter = new Job('woodcutter',[0.3,'wood'],'knapping');
	jobs.thinker = new Job('thinker',[0.1,'science'],'teaching');
	
}

function updatePopulation () { //returns time until next breakpoint
	let nextBreakpoint = Infinity;
	let newPop = resources.population.amount - gameVars.popCount;
	let popPS = resources.population.rps;
	
	if(popPS > 0) {
		nextBreakpoint = (Math.floor(resources.population.amount) + 1 - resources.population.amount) / popPS;
	} else if(popPS < 0) {
		nextBreakpoint = Math.abs( (resources.population.amount-Math.floor(resources.population.amount)) / popPS );
	}
	
	if(newPop >= 1) {
		while(newPop >= 1) {
			gameVars.popCount++;
			if(!gameVars.people) {gameVars.people = [];}
			gameVars.people.push(new Person(true));
			resources.food.addSink(0.3,1,'population',true);
			switch (gameVars.popCount) {
				case 2:
					logMessage('Another stranger arrives wanting warmth.');
					break;
				case 3:
					logMessage('Another stranger approaches seeking sustenance.');
					break;
				case 4:
					logMessage('Another stranger appears, craving companionship.');
					break;
			}
			newPop--;
		}
	} else if(newPop < 0) {
		let removePop = Math.abs(Math.floor(newPop)); //e.g. -0.1 turns into -1, then into 1. B/c 9.9 pop still reads as 9 pop.
		//TODO: Reframe this so we can display 10 pop until it reaches 9. Might be hard/annoying?
		//Oh! Could this be done by adding 0.5 to the population cap?
		while (removePop > 0) {
			let deadGuy = gameVars.people.splice(Math.floor(Math.random()*gameVars.popCount),1);
			logMessage(`${deadGuy[0].name} has starved to death.`);
			deadGuy[0].die();
			resources.food.removeSink(0.3,1,'population');
			gameVars.popCount--;
			removePop--;
		}
	}
	
	if(nextBreakpoint === 0) {nextBreakpoint = Infinity;}
	return nextBreakpoint;
}

function saveGame () {
	localStorage.setItem('gameVars',JSON.stringify(gameVars));
	localStorage.setItem('science',JSON.stringify(scienceResearched));
	for (const name in resources) {
		resources[name].save();
	}
	for (const name in buildings) {
		buildings[name].save();
	}
	console.log('Game saved!');
	
	//TODO: Update fleeting header with no transition and opacity, then update its transition and opacity again.
	clearTimeout(saveInterval);
	saveInterval = setTimeout(saveGame,gameVars.saveInterval*1000);
}

//This is only to be run once, I don't know why I made it a function.
function createTooltip () {
	let tooltip = document.querySelector('.tooltip');
	tooltip.description = document.createElement('div');
	tooltip.cost = document.createElement('div');
	tooltip.effects = document.createElement('div');
	tooltip.append(tooltip.description,tooltip.cost,tooltip.effects);
	tooltip.style.display = 'none';
	tooltip.active = false;
	return tooltip;
}

//source is defined and updated by the source.
function setupTooltip (hover, source) {
	if(hover instanceof Element) {
		hover.addEventListener('mouseover', () => {
			tooltip.source = source;
			updateTooltip();
			//TODO: Highlight relevant costs
			let rect = hover.getBoundingClientRect();
			tooltip.style.left = `calc(${rect.right}px + 0.75em)`;
			tooltip.style.top = `calc(${rect.top}px + 0.5em)`;
			//TODO: Change this for thin screens to be... below?
			//https://stackoverflow.com/questions/31511001/is-there-a-javascript-equivalent-to-using-media-query
			tooltip.style.display = 'block';
			tooltip.active = true;
		});
		hover.addEventListener('mouseleave', () => {
			tooltip.style.display = 'none';
			tooltip.active = false;
		});
		//TODO: Add touchstart and touchend, with preventDefault();
	} else {
		throw('Not a DOM element dunkass!');
	}
}

function updateTooltip () {
	let visible = false;
	if(tooltip.source.description) {
		updateText(tooltip.description,tooltip.source.description);
		tooltip.description.style.display = 'block';
		visible = true;
	} else {
		tooltip.description.style.display = 'none';
	}
	//TODO: Format these?
	if(tooltip.source.cost) {
		//updateText(tooltip.cost,tooltip.source.cost);
		tooltip.cost.innerHTML = tooltip.source.cost;
		tooltip.cost.style.display = 'block';
		visible = true;
	} else {
		tooltip.cost.style.display = 'none';
	}
	if(tooltip.source.effects) {
		updateText(tooltip.effects,tooltip.source.effects);
		tooltip.effects.style.display = 'block';
		visible = true;
	} else {
		tooltip.effects.style.display = 'none';
	}
	if(visible) {
		tooltip.style.opacity = 1;
	} else {
		tooltip.style.opacity = 0;
	}
}

function updateText (elmnt, txt) { //this is to get around textContent deleting children.
	if (elmnt instanceof Element) {
		let child = elmnt.firstChild;
		if(child) {
			if(child instanceof Element) { //then this isn't the text we want to change; add new text node in front
				//elmnt.prepend(document.createTextNode(txt));
				elmnt.insertAdjacentText('afterbegin',txt); //should do the same thing as the above line
			} else {
				child.textContent = txt;
			}
		} else {
			elmnt.textContent = txt;
		}
	} else {
		throw('Not a DOM element dumbass!');
	}
}

function displayNumber (number, type='') {
	let txt = '';
	
	if(science.numbers.researched) {
		return type.includes('decimals') ? number.toFixed(3) : Math.trunc(number);
	} else if(science.counting.researched) {
		if(number < 1) {
			return type.includes('decimals') ? 'a bit' : 0;
		} else if(number < 13) {
			return Math.trunc(number);
		} else if(number < 25) {
			txt = 'an amount' + ((type.includes('of')) ? ' of' : '');
		} else if(number < 50) {
			txt = 'amounts' + ((type.includes('of')) ? ' of' : '');
		} else if(number < 75) {
			txt = 'some';
		} else if(number < 100) {
			txt = 'a lot' + ((type.includes('of')) ? ' of' : '');
		} else if(number < 150) {
			txt = type.includes('discrete') ? 'many' : 'much';
		} else if(number < 200) {
			txt = 'lots' + ((type.includes('of')) ? ' of' : '');
		} else if(number < 250) {
			txt = 'a ton' + ((type.includes('of')) ? ' of' : '');
		} else {
			txt = type.includes('discrete') ? 'too many' : 'too much';
		}
	} else {
		if(type.includes('discrete')) {
			if(number < 1) {
				txt = 'none';
			} else if(number < 2) {
				txt = 'one';
			} else if(number < 3) {
				txt = 'a couple';
			} else if(number < 5) {
				txt = 'a few';
			} else if(number <= 6) {
				txt = 'some';
			} else if(number <= 8) {
				txt = 'many';
			} else if(number <= 10) {
				txt = 'a lot' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 15) {
				txt = 'very many';
			} else if(number <= 20) {
				txt = 'lots' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 25) {
				txt = 'a ton' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 35) {
				txt = 'enough';
			} else {
				txt = 'too many';
			}
		} else {
			if(number === 0) {
				txt = 'none';
			} else if(number <= 1) {
				txt = 'a bit' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 2) {
				txt = 'bits' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 3) {
				txt = 'a little';
			} else if(number <= 5) {
				txt = 'some';
			} else if(number <= 8) {
				txt = 'much';
			} else if(number <= 10) {
				txt = 'a lot' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 15) {
				txt = 'very much';
			} else if(number <= 20) {
				txt = 'lots' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 25) {
				txt = 'a ton' + ((type.includes('of')) ? ' of' : '');
			} else if(number <= 35) {
				txt = 'enough';
			} else {
				txt = 'too much';
			}
		}
	}
	
	return txt;
}

function displayTime (seconds) {
	//I think we assume Time has been researched
	if(seconds < 60) {
		return `${displayNumber(seconds,'discrete of')} seconds`;
	} else {
		let minutes = seconds/60;
		if(minutes < 60) {
			return `${displayNumber(minutes,'discrete of')} minutes`;
		} else {
			let hours = minutes/60;
			if(hours < 24) {
				return `${displayNumber(hours,'discrete of')} hours`;
			} else {
				let days = hours/24;
				return `${displayNumber(days,'discrete of')} days`;
			}
		}
	}
}