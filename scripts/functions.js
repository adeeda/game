function logMessage (message) {
	let thing = document.createElement('div');
	thing.setAttribute('class','log-message');
	updateText(thing,message);
	rightPane.prepend(thing);
	return thing;
}

function createNavBar() {
	const saveButton = document.createElement('a');
	updateText(saveButton,'save');
	saveButton.addEventListener('click', event => {
		saveGame();
		event.preventDefault();
	});
	
	const optionsButton = document.createElement('a');
	//TODO options menu
	
	const deleteSave = document.createElement('a');
	updateText(deleteSave,'Delete Save');
	deleteSave.addEventListener('click', event => {
		//TODO: Present a warning dialogue first
		localStorage.clear();
		event.preventDefault();
		//window.location.reload();
	});
	
	navBar.append(saveButton,optionsButton,deleteSave);
	
}

function createFooter() {
	const aboutButton = document.createElement('a');
	updateText(aboutButton,'about');
	aboutButton.addEventListener('click', event => {
		about.style.display = 'block';
		event.preventDefault();
	});
	document.querySelector('#about > .close').addEventListener('click', event => {
		about.style.display = 'none';
		event.preventDefault();
	});
	//TODO: Click anywhere to close
	
	const creditsButton = document.createElement('a');
	updateText(creditsButton,'credits');
	creditsButton.addEventListener('click', event => {
		credits.style.display = 'block';
		event.preventDefault();
	});
	document.querySelector('#credits > .close').addEventListener('click', event => {
		credits.style.display = 'none';
		event.preventDefault();
	});
	//TODO: Click anywhere to close
	
	footer.prepend(aboutButton,creditsButton);
}

function initialize () {
	
	tabs.main = new Tab ('main',true,true);
	tabs.main.pane.setAttribute('class','btn-grid');
	tabs.science = new Tab ('science');
	tabs.government = new Tab ('government');
	
	let allGreen = {};
	
	//try to find the resources file
	fetch('design/resources.csv')
		.then(response => response.text())
		.then(text => {
			buildResources(text.replaceAll('\r',''));
			finalInit();
		})
		.catch(error => {
			//console.log(error);
			//this should only be when I'm locally doing things, so I will upload all the files I'm looking for now
			fileInput = document.createElement('input');
			fileInput.setAttribute('type','file');
			fileInput.setAttribute('multiple','');
			logMessage("Hello! The following file input is for testing locally. You shouldn't see this, so let me know if you do. Thanks!");
			logMessage('Upload 3 CSV files').append(fileInput);
			fileInput.addEventListener('input', () => {
				//Need three reads here
				
				const resReader = new FileReader();
				resReader.addEventListener("load", () => {
					//console.log(resReader.result);
					buildResources(resReader.result.replaceAll('\r',''));
					finalInit();
				}, false);
				resReader.readAsText(fileInput.files[1]); //resources
				
				const sciReader = new FileReader();
				sciReader.addEventListener("load", () => {
					//console.log(sciReader.result);
					buildScience(sciReader.result.replaceAll('\r',''));
					finalInit();
				}, false);
				sciReader.readAsText(fileInput.files[2]); //science
				
				const builReader = new FileReader();
				builReader.addEventListener("load", () => {
					//console.log(builReader.result);
					buildBuildings(builReader.result.replaceAll('\r',''));
					finalInit();
				}, false);
				builReader.readAsText(fileInput.files[0]); //buildings
			});
		});
	
	//try to find the science file
	fetch('design/science.csv')
		.then(response => response.text())
		.then(text => {
			buildScience(text.replaceAll('\r',''));
			finalInit();
		})
		.catch(error => {
			console.log(error);
			//this shouldn't matter
		});
	
	//try to find the buildings file
	fetch('design/buildings.csv')
		.then(response => response.text())
		.then(text => {
			buildBuildings(text.replaceAll('\r',''));
			finalInit();
		})
		.catch(error => {
			console.log(error);
			//this shouldn't matter
		});
	
	function buildResources (csv) {
		const attributes = csv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split(',');
			const name = attributes[i][0];
			if(name) {
				resources[name] = new Resource(...attributes[i]);
				resources[name].load();
			}
		}
		allGreen.resources = true;
	}
	
	function buildScience (csv) {
		let saveString = localStorage.getItem('science');
		if (saveString) {scienceResearched = JSON.parse(saveString);}
		const attributes = csv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split(',');
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
	
	function buildBuildings (csv) {
		const attributes = csv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split(',');
			const name = attributes[i][0];
			if(name) {
				buildings[name] = new Building(...attributes[i]);
			}
		}
		allGreen.buildings = true;
	}
	
	function finalInit() {
		//If all things have been built, proceed, else do nothing.
		console.log(`Resources: ${allGreen.resources ? 'ok':'X'}; Science: ${allGreen.science ? 'ok':'X'}; Buildings: ${allGreen.buildings ? 'ok':'X'}`);
		if(allGreen.resources && allGreen.science && allGreen.buildings) {
		
			rightPane.replaceChildren(); //clears any devlog things
			createJobs();
			
			//switch based on era
			switch (gameVars.era) {
				case 0: //prologue/tutorial setup
					buttons.foodButton = new Button('food','Gather food',tabs.main.pane,() => resources.food.add());
					tabs.main.pane.prepend(buttons.foodButton.btn);
					buttons.foodButton.btn.setAttribute('class','building');
					gameVars.progress = 0;
					gameVars.popCount = 0;
					logMessage('You are cold, hungry, and lonely.');
					updateText(tabs.main.tab,'wilderness');
					break;
				case 1: //regular setup
					createNavBar();
					saveTimeout = setTimeout(saveGame,gameVars.saveInterval*1000);
					updateText(resHeader,'Resources');
					for(const name in buildings) {
						buildings[name].load();
					}
					break;
			}
			if(!gameVars.lastTick) {gameVars.lastTick = Date.now();}
			gameInterval = setInterval(gameLoop,1000/gameVars.fps);
		}
	}
}

function createJobs () {
	if(!gameVars.jobs) {gameVars.jobs = {};}
	if(!gameVars.jobs.idle) {gameVars.jobs.idle = 0;}
	
	jobs.gatherer = new Job('gatherer',[0.4,'food',0.1,'wood']);
	jobs.hunter = new Job('hunter',[0.8,'food'],'knapping');
	jobs.digger = new Job('digger',[0.2,'earth'],'knapping');
	
	for( const name in jobs ) {
		jobs[name].load();
	}
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
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(saveGame,gameVars.saveInterval*1000);
}

function createTooltip (daddy) {
	if (daddy instanceof Element) {
		let thing = document.createElement('div');
		thing.setAttribute('class','tooltip');
		daddy.append(thing);
		return thing;
	} else {
		throw('Not a DOM element dumbass!');
	}
}

function updateText (elmnt, txt) { //this is to get around textContent deleting children, and therefore my lovely tooltips.
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

function displayNumber (number, type='amount') {
	let txt = '';
	
	if(science.mathematics.researched) {
		return Math.trunc(number);
	} else if(science.counting.researched) {
		if(number < 13) {
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
			txt = 'much';
		} else if(number < 200) {
			txt = 'lots' + ((type.includes('of')) ? ' of' : '');
		} else if(number < 250) {
			txt = 'a ton' + ((type.includes('of')) ? ' of' : '');
		} else {
			txt = 'too much';
		}
	} else {
		if(type==='discrete') {
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
			} else if(number <= 30) {
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
			} else if(number <= 30) {
				txt = 'enough';
			} else {
				txt = 'too much';
			}
		}
	}
	
	return txt;
}

