class Resource {
	constructor (name, cap=Infinity, dumbName="") {
		this.name = name;
		this.cap = cap;
		if(dumbName) {this.dumbName = dumbName} else {this.dumbName=name;};
		
		this.amount = 0;
		this.rps=0;
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
	}
	
	get displayName () {
		//if good science, return name, else
		//TODO
		return this.dumbName;
	}
	
	displayAmount (number) {
		//TODO: move out of here and to functions.js
		if(science.mathematics.researched) {
			return Math.trunc(number);
		} else if(science.counting.researched) {
			if(number <= 16) {
				return Math.trunc(number);
			} else if(number <= 25) {
				return 'a lot';
			} else  {
				return 'enough';
			}
		} else {
			if(this.name === 'population') {
				if(number === 0) {
					return 'none';
				} else if(number === 1) {
					return 'one';
				} else if(number <= 4) {
					return 'a few';
				} else if(number <= 9) {
					return 'some';
				} else if(number <= 25) {
					return 'many';
				} else {
					return 'too many';
				}
			} else {
				if(number === 0) {
					return 'none';
				} else if(number <= 4) {
					return 'a little';
				} else if(number <= 9) {
					return 'some';
				} else if(number <= 25) {
					return 'a lot';
				} else {
					return 'enough';
				}
			}
		}
	}
	
	get displayRPS () {
		//TODO
		//return `${this.rps} /s`;
		if(this.rps > 0) {
			return '^';
		} else if (this.rps < 0) {
			return 'v';
		} else {
			return '';
		}
	}
	
	add (plus=1) {
		if (this.amount + plus > this.cap) {
			this.amount = this.cap;
			this.update();
			return false;
		} else {
			this.amount += plus;
			this.update();
			return true;
		}
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
	
	addSource (plusRps, mechanism) {
		//add to rps
		//stop mechanism (temporarily?) if limit reached
		this.update();
	}
	
	removeSource (plusRps, mechanism) {
		
	}
	
	addSink (minusRps, mechanism) {
		//manage a list of mechanisms to cut off when out of resource
	}
	
	removeSink (minusRps, mechanism) {
		
	}
	
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
			//by calling tick(time) again!!!!
			//if no more mechanisms, then final result is just stay at 0:
			this.amount = 0;
		}
	}
	
	getNextBreakpoint () { //TODO: call for an adjustment on next tick? :O  if the tick is equal to this one! Alternatively: just call getNextBreakpoint on the tick, and if they're the same, then do the adjustment.
		let time;
		if(this.rps > 0) {
			return (this.cap - this.amount)/this.rps;
		} else if(this.rps < 0) {
			return this.amount/this.rps;
		}
	}
	
	update () {
		if(this.active || this.amount > 0) {
			this.active = true;
			//TODO: Add conditionals for science
			//TODO: dumbify
			//(see new functions above for display)
			this.txtName.textContent = `${this.displayName}:`;
			this.txtAmount.textContent = `${this.displayAmount(this.amount)}`;
			//if(this.cap != Infinity) {this.txtCap.textContent = `/ ${this.displayAmount(this.cap)}`;}
			if( this.rps > 0 || (this.amount > 0 && this.rps) ) {this.txtRate.textContent = this.displayRPS;} else {this.txtRate.textContent="";}
		}
	}
	
	save () {
		//TODO: sinks and sources
		let saveString = `${this.amount},${this.rps}`;
		localStorage.setItem(this.name,saveString);
	}
	
	load () {
		//TODO: sinks and sources
		let saveString = localStorage.getItem(this.name);
		if(saveString) {
			let things = saveString.split(',');
			this.amount = parseInt(things[0],10);
			this.rps = parseInt(things[1],10);
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
		this.tab.setAttribute('href','#');
		this.tab.textContent=name;
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
		this.btn.textContent = description;
		pane.append(this.btn);
		this.btn.addEventListener('click',onClick);
	}
}

class Building extends Button {
	constructor (name, costs, caps, multipliers, outs, ins, upgrades) {
		super(name, name, tabs.main.pane, () => {
			//TODO: build a new Building
		});
		
		this.costs = costs.split(' ');
		if(caps) {this.caps = caps.split(' ');} else {this.caps = false;} //TODO
		if(multipliers) {this.multipliers = multipliers.split(' ');} else {this.multipliers = false;} //TODO
		if(outs) {this.outs = outs.split(' ');} else {this.outs = false;} //TODO
		if(ins) {
			//TODO: if any ins, add +/- mini buttons
			this.ins = ins.split(' ');
		} else {
			this.ins = false;
		}
		if(upgrades) {this.upgrades = upgrades.split(' ');} else {this.upgrades = false;} //TODO
		
		this.number = 0;
		
		// this.test = document.createElement('div');
		// this.test.textContent = '+/-';
		// this.btn.append(this.test);
		
		this.visible = false;
		this.btn.style.display = 'none';
	}
	
	update() {
		if(!this.visible) {
			for( let i=1; i<this.costs.length; i+=2 ) {
				if( resources[this.costs[i]].amount > this.costs[i-1] * discoveryFraction) {
					this.visible = true;
					this.btn.style.display = 'block';
					break;
				}
			}
		}
		
		if(this.visible) {
			let ok = true;
			for (let i=1; i<this.costs.length; i+=2) {
				if( resources[this.costs[i]].amount < this.costs[i-1]*(this.number+1)^costExponent ) {
					//cost is not met
					this.btn.disabled = true;
					ok = false;
					break;
				}
			}
			if (ok) {this.btn.disabled = false;}
		}
	}
	
	addDistributor (to, rate) {
		
	}
	
	addCollector (from, rate) {
		
	}
	
	save() {
		this.number;
	}
	
	load() {
		
	}
}

class Science extends Button {
	constructor (name, prereqs, costs, description, message) {
		super(name, name, tabs.science.pane, () => {
			//when button is pressed
			this.researched = true;
			scienceResearched[this.name] = true; //This is for an easy savestate
			this.visible = false;
			this.btn.style.display = 'none';
			if(message) {
				logMessage(message);
			}
		});
		this.researched = false;
		this.visible = false;
		this.btn.style.display = 'none';
		if(prereqs) {this.prereqs = prereqs.split(' ');} else {this.prereqs = false;};
		this.costs = costs.split(' ');
	}
	
	update () {
		if(!this.visible && !this.researched) {
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
			if(this.prereqs) {
				for (let i=1; i<this.costs.length; i+=2) {
					if( resources[this.costs[i]].amount < this.costs[i-1] ) {
						//cost is not met
						this.btn.disabled = true;
						ok = false;
						break;
					}
				}
			}
			if (ok) {this.btn.disabled = false;}
		}
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