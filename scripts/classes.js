class Resource {
	constructor (name, cap=Infinity, dumbName="") {
		this.name = name;
		this.cap = parseInt(cap,10);
		if(dumbName) {this.dumbName = dumbName} else {this.dumbName=name;};
		
		this.amount = 0;
		this.income = 0;
		this.drain = 0;
		this.multiplier = 1;
		this.multipliers = [];
		this.sources = [];
		this.sinks = [];
		this.active = 0;
		
		this.bar = document.createElement('div');
		this.bar.setAttribute('class','resource');
		leftPane.append(this.bar);
		this.txtName = document.createElement('div');
		this.txtName.setAttribute('class','res-name');
		this.txtAmount = document.createElement('div');
		this.txtCap = document.createElement('div');
		this.txtRate = document.createElement('div');
		this.bar.append(this.txtName,this.txtAmount,this.txtCap,this.txtRate);
		
		this.tooltip = {
			description: ''
		};
		setupTooltip(this.txtRate,this.tooltip);
	}
	
	get displayName () {
		return (science.language.researched) ? this.name : this.dumbName;
	}
	
	get rps () {
		return this.income * this.multiplier - this.drain;
	}
	
	get displayRPS () {
		let rps = this.rps;
		if( (rps > 0 && this.amount === this.cap) || (rps < 0 && this.amount === 0) ) {
			rps = 0;
		}
		if(rps < 0 && this.getNextBreakpoint() < 25) {
			this.txtRate.style.color = 'red';
		} else {
			this.txtRate.style.color = 'inherit';
		}
		
		//TODO: Time until cap/empty if foresight
		if(science.time.researched) {
			//TODO: details with logistics
			this.tooltip.description = '';
			if(science.foresight.researched) {
				//TODO: Display time
				if(rps > 0) {
					this.tooltip.cost = `Time to cap: ${displayTime(this.getNextBreakpoint())}`;
				} else if(rps < 0) {
					this.tooltip.cost = `Time to zero: ${displayTime(this.getNextBreakpoint())}`;
				} else {
					this.tooltip.cost = '';
				}
			}
			if(rps > 0) {
				return `+${displayNumber(rps,'decimals')} /s`;
			} else if(rps < 0) {
				return `-${displayNumber(Math.abs(rps),'decimals')} /s`;
			} else {
				return '';
			}
		} else {
			this.tooltip.description = `${(rps > 0) ? 'going up' : 'going down'}`;
			if(rps > 0) {
				return '^';
			} else if (rps < 0) {
				return 'v';
			} else {
				return '';
			}
		}
		
	}
	
	add (plus=1) {
		if (this.amount + plus > this.cap) {
			this.amount = this.cap;
		} else {
			this.amount += plus;
		}
		this.update();
	}
	
	consume (minus=1) {
		if (this.amount >= minus) {
			this.amount -= minus;
			this.update();
			return true;
		} else {
			return false;
		}
	}
	
	//TODO: Remove number argument for these methods? Then introduce a reduce() method for mechanisms?
	
	// FUNCTIONS CALLED BY MECHANISMS
	addSource (plusRps, number, mechanism, unstoppable=false) {
		this.income += plusRps*number;
		//TODO: Update if mechanism is already here
		this.sources.push(plusRps, number, mechanism, unstoppable);
	}
	removeSource (plusRps, number, mechanism) {
		this.income -= plusRps*number;
		//TODO: search for matching mechanism, reduce by number and appropriate rps
		if(Math.abs(this.income) < Number.EPSILON) {this.income = 0;}
	}
	addSink (minusRps, number, mechanism, unstoppable=false) {
		//manage a list of mechanisms to cut off when out of resource
		this.drain += minusRps*number;
		//TODO: Update if mechanism is already here
		this.sinks.push(minusRps,number,mechanism,unstoppable); //push adds to the end of the array.
	}
	removeSink (minusRps, number, mechanism) {
		//called by mechanisms
		//TODO: search for matching mechanism, reduce by number and appropriate rps
		this.drain -= minusRps*number;
		if(Math.abs(this.drain) < Number.EPSILON) {this.drain = 0;}
	}
	addMultiplier (multiplier, mechanism) {
		this.multiplier *= multiplier;
		//TODO: Update if mechanism is already here
		// for(let i=1,l=this.multipliers.length; i<l; i+=2) {
			// if(
		this.multipliers.push(multiplier,mechanism);
	}
	removeMultiplier (multiplier, mechanism) {
		this.multiplier /= multiplier;
		//TODO: search for matching mechanism, reduce by multiplier
	}
	// END FUNCTIONS CALLED BY MECHANISMS
	
	tick (time) {
		let change = this.rps * time;
		if (this.amount + change >= 0) {
			if (this.amount + change >= this.cap) {
				this.amount = this.cap;
			} else {
				this.amount += change;
			}
		} else {
			//TODO
			//cut off the adjective mechanisms until rps is greater than 0;
			//buildings[name].decrease();
			//by calling tick(time) again!!!!
			//if no more mechanisms, then final result is just stay at 0:
			this.amount = 0;
		}
		
		//TODO: stop mechanism (temporarily?) if limit reached
	}
	
	getNextBreakpoint () { //TODO: call for an adjustment on next tick? :O  if the tick is equal to this one! Alternatively: just call getNextBreakpoint on the tick, and if they're the same, then do the adjustment.
		if(this.rps > 0) {
			return (this.amount === this.cap) ? Infinity : (this.cap - this.amount)/this.rps;
		} else if(this.rps < 0) {
			return (this.amount === 0) ? Infinity : -this.amount/this.rps;
		} else {
			return Infinity;
		}
	}
	
	update () {
		if(this.active || this.amount >= 1) {
			this.active = 1;
			updateText(this.txtName,`${this.displayName}`);
			updateText(this.txtAmount,`${displayNumber(this.amount,this.name === 'population' ? 'discrete' : '')}`);
			if(science.foresight.researched) {
				if(this.cap != Infinity) {updateText(this.txtCap,`/ ${displayNumber(this.cap)}`);}
			}
			if(this.name !== 'population') {updateText(this.txtRate,this.displayRPS);}
			//TODO: dumbify()
			//logistics allows the view of all the sources and multipliers
		}
	}
	
	save () {
		let saveString = `${this.amount},${this.active}`;
		localStorage.setItem(`resources.${this.name}`,saveString);
	}
	
	load () {
		let saveString = localStorage.getItem(`resources.${this.name}`);
		if(saveString) {
			let things = saveString.split(',');
			this.amount = parseInt(things[0],10);
			this.active = parseInt(things[1],10);
			return true;
		} else {
			return false;
		}
	}
}

class Tab {
	constructor (name, visible=false, active=false) {
		this.name = name;
		this.visible = visible;
		
		this.tab = document.createElement('a');
		updateText(this.tab,name);
		if(!visible) {this.tab.style.display = 'none';}
		tabBar.append(this.tab);
		this.pane = document.createElement('div');
		if(active) {this.activate();}
		this.tab.addEventListener('click', () => this.activate());
	}
	
	unlock() {
		this.tab.style.display = 'inline-block';
		this.visible = true;
	}
	
	activate() {
		midPane.replaceChildren(this.pane);
		let alreadyActive = document.querySelector('#tab-bar > a.active');
		if(alreadyActive) {document.querySelector('#tab-bar > a.active').setAttribute('class','');}
		this.tab.setAttribute('class','active');
	}
}

class Section {
	constructor (name, father, visible=false, active=false) {
		this.name = name;
		this.visible = visible;
		
		this.pane = document.createElement('section');
		if(!visible) {this.pane.style.display = 'none';}
		father.append(this.pane);
		
		this.header = document.createElement('h2');
		updateText(this.header,name);
		this.pane.append(this.header);
	}
	
	unlock() {
		this.pane.style.display = 'inline-block';
		this.visible = true;
	}
	
	collapse() {
		//? can this be CSS instead?
	}
}

class Button {
	constructor (name, description, father, onClick) {
		this.name = name;
		//this.btn = document.createElement('button');
		this.btn = document.createElement('div');
		this.btn.setAttribute('class','btn');
		updateText(this.btn,description);
		father.append(this.btn);
		this.btn.addEventListener('click',onClick);
		this.disabled = false;
	}
	
	hide() {
		this.visible = false;
		this.btn.style.display = 'none';
	}
	
	show() {
		this.visible = true;
		this.btn.style.display = 'flex';
	}
	
	enable() {
		this.btn.removeAttribute('disabled');
		this.disabled = false;
	}
	
	disable() {
		this.btn.setAttribute('disabled','');
		this.disabled = true;
	}
}

class Building extends Button {
	constructor (name, costs, caps, multipliers, outs, ins, dumbName="", description, prereq, upgrades) {
		super(name, name, tabs.main.pane, () => {
			//on click
			if(!this.disabled) {
				let ok=true;
				for (let i=1; i<this.costs.length; i+=2) {
					if(!resources[this.costs[i]].consume(this.costs[i-1]*costMultiplier**this.number)) {
						//somehow fail
						logMessage(`You don't have the ${resources[this.costs[i]].displayName} for that. Something went wrong.`);
						ok = false;
						break;
					}
				}
				if(ok) {
					this.increase(1,true);
					for(const name in buildings) {
						buildings[name].update();
					}
				}
			}
		});
		
		this.body = document.createElement('div');
		this.main = document.createElement('div');
		this.body.append(this.main);
		updateText(this.main,this.name);
		this.btn.replaceChildren(this.body);
		
		if(dumbName) {this.dumbName = dumbName} else {this.dumbName=name;};
		this.description = description;
		this.costs = costs.split(';');
		
		if(caps) {this.caps = caps.split(';');} else {this.caps = false;}
		if(multipliers) {this.multipliers = multipliers.split(';');} else {this.multipliers = false;} //TODO
		if(outs) {this.outs = outs.split(';');} else {this.outs = false;} //TODO
		if(ins) {
			this.ins = ins.split(';');
			
			//TODO: stop highlight of button if highlighting mini buttons
			//Update: that might only be possible if I move the styling to javascript >:(
			this.plusMinus = document.createElement('div');
			this.plusMinus.setAttribute('class','plusminus');
			
			this.plus = document.createElement('div');
			updateText(this.plus,'+');
			this.plus.addEventListener('click', event => {
				event.stopPropagation();
				this.increase(1);
			});
			
			this.minus = document.createElement('div');
			updateText(this.minus,'-');
			this.minus.addEventListener('click', event => {
				event.stopPropagation();
				this.decrease(1);
			});
			
			this.plusMinus.append(this.plus,this.minus);
			this.btn.append(this.plusMinus);
			
		} else {
			this.ins = false;
		}
		
		if(upgrades) {
			this.upgrades = upgrades.split(';');
			//TODO: if any upgrades, add upgrade mini button
			this.upButton = document.createElement('div');
			this.body.append(this.upButton);
			//updateText(this.upButton,'test!')
		} else {
			this.upgrades = false;
		}
		
		if(prereq) {this.prereq = prereq;} else {this.prereq = false;}
			
		this.number = 0;
		this.activeNumber = 0;
		
		this.hide();
		this.btn.setAttribute('building','');
		this.tooltip = {
			description: description,
		};
		setupTooltip(this.btn,this.tooltip);
	}
	
	get displayName () {
		return (science.language.researched) ? this.name : this.dumbName;
	}
	
	get displayCosts () {
		let txt = 'Cost:';
		let biggestTime = 0;
		for (let i=1; i<this.costs.length; i+=2) {
			let cost = this.costs[i-1]*costMultiplier**this.number;
			let res = resources[this.costs[i]];
			txt += ` ${displayNumber(cost,'of')} ${res.displayName}`;
			txt += (i===this.costs.length-1) ? '' : ',' ;
			if (res.amount < cost) {
				if (res.rps > 0) {
					let newTime = (cost - res.amount) / res.rps;
					if(newTime > biggestTime) {biggestTime=newTime;}
				} else {
					biggestTime = Infinity;
				}
			}
		}
		if(science.mathematics.researched && biggestTime > 0 && biggestTime < Infinity) {
			txt += `<br>Ready in ${displayTime(biggestTime)}`;
		}
		return txt;
	}
	
	update() {
		if(!this.visible && (!this.prereq || science[this.prereq].researched) ) {
			let show = true;
			for( let i=1; i<this.costs.length; i+=2 ) {
				if( resources[this.costs[i]].amount < this.costs[i-1] * discoveryFraction) {
					show = false;
					break;
				}
			}
			if(show) {
				this.show();
				updateText(this.main,`${this.displayName}`);
			}
		}
		
		if(this.visible) {
			let ok = true;
			for (let i=1; i<this.costs.length; i+=2) {
				if( resources[this.costs[i]].amount < this.costs[i-1]*costMultiplier**this.number ) {
					//cost is not met
					this.disable();
					ok = false;
					break;
				}
			}
			if (ok) {this.enable();}
			this.tooltip.cost = this.displayCosts;
		}
	}
	
	increase (by=1, isCreating=false) { //Increases the number of active buildings
		let ok = true;
		let actual = by;
		if(isCreating) {
			this.number += by;
			this.activeNumber += by;
		} else {
			if(this.activeNumber + by <= this.number) {
				this.activeNumber += by;
			} else if(this.number !== this.activeNumber) {
				actual = this.number - this.activeNumber;
				this.activeNumber = this.number;
			} else {
				ok = false;
			}
		}
		if(ok && actual > 0) {
			this.show();
			updateText(this.main,`${this.displayName} ` + ((this.activeNumber < this.number) ? `(${displayNumber(this.activeNumber,'discrete')}/${displayNumber(this.number,'discrete')})` : `(${displayNumber(this.number,'discrete')})`));
			if(this.caps) {
				for (let i=1; i<this.caps.length; i+=2) {
					resources[this.caps[i]].cap += this.caps[i-1]*actual;
				}
			}
			if(this.multipliers) {
				for (let i=1; i<this.multipliers.length; i+=2) {
					resources[this.multipliers[i]].addMultiplier(this.multipliers[i-1]**actual,this);
				}
			}
			if(this.outs) {
				for (let i=1; i<this.outs.length; i+=2) {
					resources[this.outs[i]].addSource(this.outs[i-1],actual,this);
				}
			}
			if(this.ins) {
				for (let i=1; i<this.ins.length; i+=2) {
					resources[this.ins[i]].addSink(this.ins[i-1],actual,this);
				}
			}
		}
	}
	
	decrease (by) { //Decreases the number of active buildings
		let actual = Math.min(by,this.activeNumber);
		
		if(actual > 0) {
			if(this.caps) {
				for (let i=1; i<this.caps.length; i+=2) {
					resources[this.caps[i]].cap -= this.caps[i-1]*actual;
				}
			}
			if(this.multipliers) {
				for (let i=1; i<this.multipliers.length; i+=2) {
					resources[this.multipliers[i]].removeMultiplier(this.multipliers[i-1]**actual,this);
				}
			}
			if(this.outs) {
				for (let i=1; i<this.outs.length; i+=2) {
					resources[this.outs[i]].removeSource(this.outs[i-1],actual,this);
				}
			}
			if(this.ins) {
				for (let i=1; i<this.ins.length; i+=2) {
					resources[this.ins[i]].removeSink(this.ins[i-1],actual,this);
				}
			}
		}
		
		this.activeNumber -= actual;
		updateText(this.main,`${this.displayName} ` + ((this.activeNumber < this.number) ? `(${displayNumber(this.activeNumber,'discrete')}/${displayNumber(this.number,'discrete')})` : `(${displayNumber(this.number,'discrete')})`));
	}
	
	save() {
		let saveString = `${this.number},${this.activeNumber}`;
		localStorage.setItem(`buildings.${this.name}`,saveString);
	}
	
	load() {
		let saveString = localStorage.getItem(`buildings.${this.name}`);
		if(saveString) {
			let things = saveString.split(',');
			this.number = parseInt(things[0],10);
			this.increase(parseInt(things[1],10));
			this.update();
			return true;
		} else {
			return false;
		}
	}
}

class Science extends Button {
	constructor (name, prereqs, costs, description, message) {
		super(name, name, sections.newScience.pane, () => {
			//when button is pressed
			if(!this.disabled) {
				let ok = true;
				for (let i=1; i<this.costs.length; i+=2) {
					if( !resources[this.costs[i]].consume(this.costs[i-1]) ) {
						//somehow fail
						logMessage(`You don't have the ${resources[this.costs[i]].displayName} for that. Something went wrong.`);
						ok = false;
						break;
					}
				}
				if (ok) {
					this.researched = true;
					scienceResearched[this.name] = true; //This is for an easy savestate
					this.hide();
					if(message) {
						logMessage(message);
					}
					checkScienceFlags(this.name);
				}
			}
		});
		this.researched = false;
		this.hide();
		
		if(prereqs) {this.prereqs = prereqs.split(';');} else {this.prereqs = false;}
		if(costs) {this.costs = costs.split(';');} else {this.costs = false;}
		this.description = description;
		
		if(description || costs) {
			this.tooltip = {
				description: description,
			};
			setupTooltip(this.btn,this.tooltip);
		}
	}
	
	update () {
		if(!this.researched) {
			if(!this.visible) {
				if(!this.prereqs) {
					this.show();
				} else { //check prereqs
					let ok = true;
					for (let i=0; i<this.prereqs.length; i++) {
						if(!science[this.prereqs[i]].researched) {
							ok = false; //if any prereqs are not met
							break;
						}
					}
					if(ok) {this.show();}
				}
			}
			if(this.visible) {
				let ok = true;
				for (let i=1; i<this.costs.length; i+=2) {
					if( resources[this.costs[i]].amount < this.costs[i-1] ) {
						//cost is not met
						this.disable();
						ok = false;
						break;
					}
				}
				if (ok) {this.enable();}
				
				//TODO: Might not need to update this every frame, but where do I update it?
				if(this.tooltip) {
					this.tooltip.cost = this.displayCosts;
				}
			}
		}
	}
	
	get displayCosts () {
		if(this.costs) {
			let txt = 'Cost:';
			let biggestTime = 0;
			for (let i=1; i<this.costs.length; i+=2) {
				let cost = this.costs[i-1];
				let res = resources[this.costs[i]];
				txt += ` ${displayNumber(cost,'of')} ${res.displayName}`;
				txt += (i===this.costs.length-1) ? '' : ',' ;
				if (res.amount < cost) {
					if(res.rps > 0) {
						let newTime = (cost - res.amount) / res.rps;
						if(newTime > biggestTime) {biggestTime = newTime;}
					} else {
						biggestTime = Infinity;
					}
				}
			}
			if(science.mathematics.researched && biggestTime > 0 && biggestTime < Infinity) {
				txt += `<br>Available in ${displayTime(biggestTime)}`;
			}
			return txt;
		} else {
			return '';
		}
	}
	
	load() {
		this.researched = true;
		this.visible = false;
	}
}

class Job {
	constructor (name, outputs, prereq=false, visible=false) {
		this.name = name;
		this.outputs = outputs;
		this.visible = visible;
		if(prereq) {this.prereq = prereq;}
		
		this.count = 0;
		
		this.div = document.createElement('div');
		this.div.setAttribute('class','job');
		this.txt = document.createElement('div');
		this.txtCount = document.createElement('div');
		this.plus = document.createElement('button');
		this.plus.setAttribute('class','small');
		this.plus.style.display = 'none';
		this.plus.disabled = true;
		updateText(this.plus,'+');
		this.minus = document.createElement('button');
		this.minus.setAttribute('class','small');
		this.minus.style.display = 'none';
		this.minus.disabled = true;
		updateText(this.minus,'-');
		
		this.div.append(this.txt,this.txtCount,this.plus,this.minus);
		sections.jobs.pane.append(this.div);
		
		this.plus.addEventListener('click', () => {
			for( let i=0; i<gameVars.popCount; i++ ) {
				if(gameVars.people[i].job === 'idle') {
					gameVars.people[i].assignJob(this.name);
					break;
				}
			}
		});
		
		this.minus.addEventListener('click', () => {
			for( let i=0; i<gameVars.popCount; i++ ) {
				if(gameVars.people[i].job === this.name) {
					gameVars.people[i].assignJob('idle');
					break;
				}
			}
		});
		
		//TODO: Tooltip if logistics
		// this.tooltip = {
			// description: this.name,
		// };
		// setupTooltip(this.txt,this.tooltip);
	}
	
	increase (by=1) {
		if(by >= 1) {
			for (let i=1; i<this.outputs.length; i+=2) {
				resources[this.outputs[i]].addSource(this.outputs[i-1],by,this);
			}
			this.count += by;
			updateText(this.txtCount,`${displayNumber(this.count,'discrete')}`);
		} else {
			return false;
		}
	}
	
	decrease (by=1) {
		if(by >= 1) {
			for (let i=1; i<this.outputs.length; i+=2) {
				resources[this.outputs[i]].removeSource(this.outputs[i-1],by,this);
			}
			this.count -= by;
			updateText(this.txtCount,`${displayNumber(this.count,'discrete')}`);
		} else {
			return false;
		}
	}
	
	update () {
		if(!this.visible) {
			if(!this.prereq) {
				this.unlock();
			} else if(science[this.prereq].researched) {
				this.unlock();
			}
		}
		if(this.visible) {
			if(gameVars.idle <= 0) {
				this.plus.disabled = true;
			} else {
				this.plus.disabled = false;
			}
			if(this.count <= 0) {
				this.minus.disabled = true;
			} else {
				this.minus.disabled = false;
			}
		}
	}
	
	unlock () {
		this.visible = true;
		updateText(this.txt,`${this.name}s`);
		updateText(this.txtCount,`${displayNumber(this.count,'discrete')}`);
		this.plus.style.display = 'block';
		this.minus.style.display = 'block';
	}
}

class Person {
	constructor (creation=false) {
		this.name = 'Default Name';
		this.age = Math.random()*6+16;
		
		if(creation) {
			if(science.thought.researched) {
				this.job = 'gatherer';
				jobs.gatherer.increase(1);
			} else {
				this.job = 'idle';
				gameVars.idle++;
			}
			this.div = document.createElement('div');
			sections.population.pane.append(this.div);
			this.assignName();
		}
	}
	
	//TODO: adjust job effectiveness based on mastery and stats
	assignJob (job) {
		if(this.job === 'idle') {
			gameVars.idle--;
		} else {
			jobs[this.job].decrease(1);
		}
		if(job === 'idle') {
			gameVars.idle++;
		} else {
			jobs[job].increase(1);
		}
		this.job = job;
	}
	
	assignName () {
		if(names.length > 0) {
			this.name = `${names[Math.floor(Math.random()*names.length)]} ${surnames[Math.floor(Math.random()*surnames.length)]}`;
			updateText(this.div,this.name);
			return true;
		} else {
			//fallback data 1/10th the size
			this.name = `${fallbackNames[Math.floor(Math.random()*1000)]} ${fallbackSurnames[Math.floor(Math.random()*1620)]}`;
			updateText(this.div,this.name);
			return false;
		}
	}
	
	tick (time) {
		this.age += time/simSpeed/365;
		//TODO: increase job mastery
		//if(this.age*Math.random() > 65) {this.reincarnate();} //Probably too often
	}
	
	die () {
		if(this.job === 'idle') {
			gameVars.idle--;
		} else {
			jobs[this.job].decrease(1);
		}
		//TODO: delete this.div
	}
	
	load () {
		if(this.job !== 'idle') {
			jobs[this.job].increase(1);
		}
		this.div = document.createElement('div');
		sections.population.pane.append(this.div);
		updateText(this.div,this.name);
	}
}

