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
	
	//TODO: functionalize the following nonsense?
	//Rather, let me upload all the files at once.
	
	//try to find the resources file
	//TODO: sanitize/escape?
	fetch('design/resources.csv')
		.then(response => response.text())
		.then(text => {
			buildResources(text.replaceAll('\r',''));
			//TODO: fetch the rest and call their build functions
		})
		.catch(error => {
			//console.log(error);
			//this should only be when I'm locally doing things, so I will upload the file I'm looking for now
			fileInput = document.createElement('input');
			fileInput.setAttribute('type','file');
			logMessage("Hello! The following file inputs are for testing locally. You shouldn't see this, so let me know if you do. Thanks!");
			logMessage('Upload resources.csv').append(fileInput);
			fileInput.addEventListener('input', () => {
				let csvFile = fileInput.files[0];
				const reader = new FileReader();
				reader.addEventListener("load", () => {
					//console.log(reader.result);
					fileInput.remove();
					buildResources(reader.result.replaceAll('\r',''));
				}, false);
				reader.readAsText(csvFile);
			})
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
		
		//try to find the science file
		//TODO: sanitize/escape?
		fetch('design/science.csv')
			.then(response => response.text())
			.then(text => {
				buildScience(text.replaceAll('\r',''));
			})
			.catch(error => {
				//console.log(error);
				//this should only be when I'm locally doing things, so I will upload the file I'm looking for now
				fileInput = document.createElement('input');
				fileInput.setAttribute('type','file');
				logMessage('Upload science.csv').append(fileInput);
				fileInput.addEventListener('input', () => {
					let csvFile = fileInput.files[0];
					const reader = new FileReader();
					reader.addEventListener("load", () => {
						//console.log(reader.result);
						fileInput.remove();
						buildScience(reader.result.replaceAll('\r',''));
					}, false);
					reader.readAsText(csvFile);
				})
			});
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
		
		//try to find the bulidings file
		//TODO: sanitize/escape?
		fetch('design/buildings.csv')
			.then(response => response.text())
			.then(text => {
				buildBuildings(text.replaceAll('\r',''));
			})
			.catch(error => {
				//console.log(error);
				//this should only be when I'm locally doing things, so I will upload the file I'm looking for now
				fileInput = document.createElement('input');
				fileInput.setAttribute('type','file');
				logMessage('Upload buildings.csv').append(fileInput);
				fileInput.addEventListener('input', () => {
					let csvFile = fileInput.files[0];
					const reader = new FileReader();
					reader.addEventListener("load", () => {
						//console.log(reader.result);
						fileInput.remove();
						buildBuildings(reader.result.replaceAll('\r',''));
					}, false);
					reader.readAsText(csvFile);
				})
			});
	}
	
	function buildBuildings (csv) {
		const attributes = csv.split('\n');
		for (let i=1; i<attributes.length; i++) {
			attributes[i] = attributes[i].split(',');
			const name = attributes[i][0];
			if(name) {
				buildings[name] = new Building(...attributes[i]);
				buildings[name].load();
			}
		}
		
		finalInit();//TODO: Move to end of initialization chain
	}
	
	function finalInit() {
		//TODO: if all things have been built, proceed, else do nothing.
		
		rightPane.replaceChildren(); //clears any devlog things
		
		//switch based on era
		switch (gameVars.era) {
			case 0: //prologue/tutorial setup
				buttons.foodButton = new Button('food','Gather food',tabs.main.pane,() => resources.food.add());
				tabs.main.pane.prepend(buttons.foodButton.btn);
				buttons.foodButton.btn.setAttribute('class','building');
				gameVars.progress = 0;
				logMessage('You are cold, hungry, and lonely.');
				updateText(tabs.main.tab,'wilderness');
				break;
			case 1: //regular setup
				createNavBar();
				saveTimeout = setTimeout(saveGame,gameVars.saveInterval*1000);
				updateText(resHeader,'Resources');
				break;
		}
		if(!gameVars.lastTick) {gameVars.lastTick = Date.now();}
		gameInterval = setInterval(gameLoop,1000/gameVars.fps);
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