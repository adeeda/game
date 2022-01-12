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
		this.active = false;
		
		this.bar = document.createElement('div');
		this.bar.setAttribute('class','resource');
		leftPane.append(this.bar);
		this.txtName = document.createElement('div');
		this.txtName.setAttribute('class','res-name');
		this.txtAmount = document.createElement('div');
		this.txtCap = document.createElement('div');
		this.txtRate = document.createElement('div');
		this.bar.append(this.txtName,this.txtAmount,this.txtCap,this.txtRate);
		
		this.tooltip = createTooltip(this.txtRate);
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
		if(science.mathematics.researched) { //TODO: science.time.researched
			return `${rps} /s`;
		} else {
			updateText(this.tooltip,`${(rps > 0) ? 'going up' : 'going down'}`);
			if(rps > 0) {
				this.tooltip.style.opacity = 1;
				return '^';
			} else if (rps < 0) {
				this.tooltip.style.opacity = 1;
				return 'v';
			} else {
				this.tooltip.style.opacity = 0;
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
	
	// FUNCTIONS CALLED BY BUILDINGS
	addSource (plusRps, number, mechanism, unstoppable=false) {
		this.income += plusRps*number;
		//TODO: Update if mechanism is already here
		this.sources.push(plusRps, number, mechanism, unstoppable);
	}
	removeSource (plusRps, number, mechanism) {
		this.income -= plusRps*number;
		//TODO: search for matching mechanism, reduce by number and appropriate rps
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
	}
	addMultiplier (multiplier, mechanism) {
		this.multiplier *= multiplier;
		//TODO: Update if mechanism is already here
		this.multipliers.push(multiplier,mechanism);
	}
	removeMultiplier (multiplier, mechanism) {
		this.multiplier /= multiplier;
		//TODO: search for matching mechanism, reduce by multiplier
	}
	// END FUNCTIONS CALLED BY BUILDINGS
	
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
			//cut off the newest mechanisms until rps is greater than 0;
			//buildings[name].decrease();
			//by calling tick(time) again!!!!
			//if no more mechanisms, then final result is just stay at 0:
			this.amount = 0;
		}
		
		//TODO: stop mechanism (temporarily?) if limit reached
	}
	
	getNextBreakpoint () { //TODO: call for an adjustment on next tick? :O  if the tick is equal to this one! Alternatively: just call getNextBreakpoint on the tick, and if they're the same, then do the adjustment.
		if(this.rps > 0) {
			return (this.cap - this.amount)/this.rps;
		} else if(this.rps < 0) {
			return this.amount/this.rps;
		} else {
			return Infinity;
		}
	}
	
	update () {
		if(this.active || this.amount >= 1) {
			this.active = true;
			updateText(this.txtName,`${this.displayName}:`);
			updateText(this.txtAmount,`${displayNumber(this.amount,this.name === 'population' ? 'discrete' : '')}`);
			//TODO: capacity science conditional
			//if(this.cap != Infinity) {updateText(this.txtCap,`/ ${displayNumber(this.cap)}`);}
			
			updateText(this.txtRate,this.displayRPS);
			//TODO: dumbify()
			//logistics allows the view of all the sources and multipliers
		}
	}
	
	save () {
		let saveString = `${this.amount}`;
		localStorage.setItem(this.name,saveString);
	}
	
	load () {
		//TODO: sources?
		let saveString = localStorage.getItem(this.name);
		if(saveString) {
			//let things = saveString.split(',');
			this.amount = parseInt(saveString,10);
			this.update();
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
	}
	
	activate() {
		midPane.replaceChildren(this.pane);
		let alreadyActive = document.querySelector('#tab-bar > a.active');
		if(alreadyActive) {document.querySelector('#tab-bar > a.active').setAttribute('class','');}
		this.tab.setAttribute('class','active');
	}
}

class Button {
	constructor (name, description, pane, onClick) {
		this.name = name;
		this.btn = document.createElement('button');
		updateText(this.btn,description);
		pane.append(this.btn);
		this.btn.addEventListener('click',onClick);
	}
}

class Building extends Button {
	constructor (name, costs, caps, multipliers, outs, ins, upgrades, dumbName="", description) {
		super(name, name, tabs.main.pane, () => {
			//on click
			for (let i=1; i<this.costs.length; i+=2) {
				resources[this.costs[i]].consume(this.costs[i-1]*costMultiplier**this.number);
			}
			this.increase(1,true);
		});
		
		if(dumbName) {this.dumbName = dumbName} else {this.dumbName=name;};
		this.description = description;
		this.costs = costs.split(';');
		
		if(caps) {this.caps = caps.split(';');} else {this.caps = false;}
		if(multipliers) {this.multipliers = multipliers.split(';');} else {this.multipliers = false;} //TODO
		if(outs) {this.outs = outs.split(';');} else {this.outs = false;} //TODO
		if(ins) {
			//TODO: if any ins, add +/- mini buttons
			this.ins = ins.split(';');
		} else {
			this.ins = false;
		}
		if(upgrades) {this.upgrades = upgrades.split(';');} else {this.upgrades = false;} //TODO
		
		this.number = 0;
		this.activeNumber = 0;
		
		// this.test = document.createElement('div');
		// updateText(this.test,'+/-');
		// this.btn.append(this.test);
		// button.addEventListener("click", event => {
			// console.log("Handler for button.");
			// event.stopPropagation(); //<-- This is the one!
		  // });
		
		this.visible = false;
		this.btn.style.display = 'none';
		this.btn.setAttribute('class','building');
		
		this.tooltip = createTooltip(this.btn);
	}
	
	get displayName () {
		//TODO
		//if good science return this.name else
		return this.dumbName;
	}
	
	get displayCosts () {
		let text = 'Cost:';
		for (let i=1; i<this.costs.length; i+=2) {
			text += ` ${displayNumber(this.costs[i-1]*costMultiplier**this.number,'of')} ${resources[this.costs[i]].displayName}`;
			text += (i===this.costs.length-1) ? '' : ',' ;
		}
		return text;
	}
	
	update() {
		if(!this.visible) {
			let show = true;
			for( let i=1; i<this.costs.length; i+=2 ) {
				if( resources[this.costs[i]].amount < this.costs[i-1] * discoveryFraction) {
					show = false;
					break;
				}
			}
			if(show) {
				this.visible = true;
				this.btn.style.display = 'block';
				updateText(this.btn,`${this.displayName}`);
			}
		}
		
		if(this.visible) {
			let ok = true;
			for (let i=1; i<this.costs.length; i+=2) {
				if( resources[this.costs[i]].amount < this.costs[i-1]*costMultiplier**this.number ) {
					//cost is not met
					this.btn.disabled = true;
					ok = false;
					break;
				}
			}
			if (ok) {this.btn.disabled = false;}
			updateText(this.tooltip,`${this.description} ${this.displayCosts}`);
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
		if(ok) {
			updateText(this.btn,`${this.displayName}` + ((this.activeNumber < this.number) ? `(${this.activeNumber}/${this.number})` : `(${this.number})`));
			if(this.caps) {
				for (let i=1; i<this.caps.length; i+=2) {
					resources[this.caps[i]].cap += this.caps[i-1]*by;
				}
			}
			if(this.multipliers) {
				for (let i=1; i<this.multipliers.length; i+=2) {
					resources[this.multipliers[i]].addMultiplier(this.multipliers[i-1]*by,this);
				}
			}
			if(this.outs) {
				for (let i=1; i<this.outs.length; i+=2) {
					resources[this.outs[i]].addSource(this.outs[i-1],by,this);
				}
			}
			if(this.ins) {
				for (let i=1; i<this.ins.length; i+=2) {
					resources[this.ins[i]].addSink(this.ins[i-1],by,this);
				}
			}
		}
	}
	
	decrease (by) { //Decreases the number of active buildings
		let actual = (this.activeNumber >= by) ? by : this.activeNumber; //whichever is smaller? wait should I just use... min?
		
		if(this.caps) {
			for (let i=1; i<this.caps.length; i+=2) {
				resources[this.caps[i]].cap -= this.caps[i-1]*actual;
			}
		}
		if(this.multipliers) {
			for (let i=1; i<this.multipliers.length; i+=2) {
				resources[this.multipliers[i]].removeMultiplier(this.multipliers[i-1]*actual,this);
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
		
		this.activeNumber -= actual;
		updateText(this.btn,`${this.displayName}` + ((this.activeNumber < this.number) ? `(${this.activeNumber}/${this.number})` : `(${this.number})`));
	}
	
	save() {
		let saveString = `${this.number},${this.activeNumber}`;
		localStorage.setItem(this.name,saveString);
	}
	
	load() {
		let saveString = localStorage.getItem(this.name);
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
		super(name, name, tabs.science.pane, () => {
			//when button is pressed
			//actually consume the resources
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
				this.visible = false;
				this.btn.style.display = 'none';
				if(message) {
					logMessage(message);
				}
			}
		});
		this.researched = false;
		this.visible = false;
		this.btn.style.display = 'none';
		
		if(prereqs) {this.prereqs = prereqs.split(';');} else {this.prereqs = false;};
		this.costs = costs.split(';');
		this.description = description;
		
		if(description) {
			this.tooltip = createTooltip(this.btn);
		}
	}
	
	update () {
		if(!this.researched) {
			if(!this.visible) {
				if(!this.prereqs) {
					this.unlock();
				} else { //check prereqs
					let ok = true;
					for (let i=0; i<this.prereqs.length; i++) {
						if(!science[this.prereqs[i]].researched) {
							ok = false; //if any prereqs are not met
							break;
						}
					}
					if(ok) {this.unlock();}
				}
			}
			if(this.visible) {
				let ok = true;
				for (let i=1; i<this.costs.length; i+=2) {
					if( resources[this.costs[i]].amount < this.costs[i-1] ) {
						//cost is not met
						this.btn.disabled = true;
						ok = false;
						break;
					}
				}
				if (ok) {this.btn.disabled = false;}
				
				//TODO: Might not need to update this every frame, but where do I update it?
				if(this.tooltip) {
					updateText(this.tooltip,`${this.description} ${this.displayCosts}`);
				}
			}
		}
	}
	
	get displayCosts () {
		let text = 'Cost:';
		for (let i=1; i<this.costs.length; i+=2) {
			text += ` ${displayNumber(this.costs[i-1],'of')} ${resources[this.costs[i]].displayName}`;
		}
		return text;
	}
	
	unlock () {
		this.visible = true;
		this.btn.style.display = 'block';
	}
	
	load() {
		this.researched = true;
		this.visible = false;
	}
}

