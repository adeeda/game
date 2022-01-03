function logMessage (message) {
	let thing = document.createElement('div');
	thing.setAttribute('class','log-message');
	updateText(thing,message);
	rightPane.prepend(thing);
	return thing;
}

function createNavBar() {
	const saveButton = document.createElement('a');
	saveButton.setAttribute('href','#');
	updateText(saveButton,'save');
	saveButton.addEventListener('click', () => saveGame());
	
	const optionsButton = document.createElement('a');
	//TODO options menu
	
	const deleteSave = document.createElement('a');
	updateText(deleteSave,'Delete Save');
	deleteSave.setAttribute('href','#');
	deleteSave.addEventListener('click', () => {
		//TODO: Present a warning dialogue first
		localStorage.clear();
		//window.location.reload();
	});
	
	navBar.append(saveButton,optionsButton,deleteSave);
	
}

function createFooter() {
	const aboutButton = document.createElement('a');
	aboutButton.setAttribute('href','#');
	updateText(aboutButton,'about');
	aboutButton.addEventListener('click', () => {about.style.display = 'block';});
	document.querySelector('#about > .close').addEventListener('click', () => {about.style.display = 'none';});
	
	const creditsButton = document.createElement('a');
	creditsButton.setAttribute('href','#');
	updateText(creditsButton,'credits');
	creditsButton.addEventListener('click', () => {credits.style.display = 'block';});
	document.querySelector('#credits > .close').addEventListener('click', () => {credits.style.display = 'none';});
	
	footer.prepend(aboutButton,creditsButton);
}

function initialize () {
	
	tabs.main = new Tab ('main',true,true);
	tabs.main.pane.setAttribute('class','btn-grid');
	tabs.science = new Tab ('science');
	
	//TODO: functionalize the following nonsense
	
	//try to find the resources file
	//TODO: sanitize/escape?
	fetch('design/resources.csv')
		.then(response => response.text())
		.then(text => {
			buildResources(text.replaceAll('\r',''));
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
			resources[name] = new Resource(...attributes[i]);
			resources[name].load();
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
			science[name] = new Science(...attributes[i]);
			if(scienceResearched[name]) {
				science[name].load();
			}
		}
		
		finalInit();//TODO: Move to end of initialization chain
	}
	
	function finalInit() {
		rightPane.replaceChildren(); //clears any devlog things
		
		//switch based on era
		switch (gameVars.era) {
			case 0: //prologue/tutorial setup
				const foodButton = new Button('food','Gather food',tabs.main.pane,() => resources.food.add());
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
				elmnt.prepend(document.createTextNode(txt));
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